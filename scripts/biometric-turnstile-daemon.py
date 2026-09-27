#!/usr/bin/env python3
"""
Physical Biometric Turnstile & RFID Gateway Daemon
CLASSROOM ERP — Edge Hardware Attendance Ingestion Service

Connects to physical turnstile hardware (ZKTeco / Suprema / HID RFID readers),
buffers attendance punches with persistent retry, and dispatches authenticated
batches to the CLASSROOM ERP Biometric Ingestion Endpoint (/api/attendance/biometric-push).
"""

import sys
import time
import json
import socket
import argparse
import logging
import urllib.request
import urllib.error
from datetime import datetime

# Setup standard logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [GATE-DAEMON] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("TurnstileDaemon")

DEFAULT_SERVER_URL = "http://localhost:3000/api/attendance/biometric-push"
DEFAULT_DEVICE_KEY = "apex-biometric-secret-2026"
DEFAULT_SERIAL = "ZKTECO-TURNSTILE-GATE-NORTH-01"
DEFAULT_PORT = 4370  # Standard ZKTeco biometric hardware port

class BiometricTurnstileDaemon:
    def __init__(self, server_url, device_key, serial_number, course_code="CS-402", batch_size=10, flush_interval=5):
        self.server_url = server_url
        self.device_key = device_key
        self.serial_number = serial_number
        self.course_code = course_code
        self.batch_size = batch_size
        self.flush_interval = flush_interval
        self.punch_buffer = []
        self.last_flush_time = time.time()
        self.total_punches_ingested = 0

    def add_punch(self, student_id, status="PRESENT"):
        """Buffers a hardware card swipe or fingerprint punch."""
        punch = {
            "studentId": student_id.strip(),
            "status": status,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
        self.punch_buffer.append(punch)
        logger.info(f"Buffered punch from reader: Student [{punch['studentId']}] at {punch['timestamp']}")

        if len(self.punch_buffer) >= self.batch_size:
            self.flush()

    def flush(self):
        """Dispatches buffered attendance punches to the central ERP."""
        if not self.punch_buffer:
            return True

        to_send = list(self.punch_buffer)
        self.punch_buffer = []

        payload = {
            "deviceSerialNumber": self.serial_number,
            "courseCode": self.course_code,
            "punches": to_send,
        }

        req = urllib.request.Request(
            self.server_url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "x-device-key": self.device_key,
                "User-Agent": f"ApexTurnstileDaemon/2.0 ({self.serial_number})",
            },
            method="POST",
        )

        max_retries = 3
        backoff = 1.0

        for attempt in range(1, max_retries + 1):
            try:
                start_req = time.time()
                with urllib.request.urlopen(req, timeout=8) as response:
                    res_body = json.loads(response.read().decode("utf-8"))
                    latency = round((time.time() - start_req) * 1000, 1)

                    if response.status in (200, 201) and res_body.get("success"):
                        self.total_punches_ingested += len(to_send)
                        logger.info(
                            f"Dispatched {len(to_send)} punches to ERP in {latency}ms. "
                            f"Session ID: {res_body.get('sessionId')} | Total synced: {self.total_punches_ingested}"
                        )
                        self.last_flush_time = time.time()
                        return True
                    else:
                        logger.warning(f"Unexpected ERP response: {res_body}")
            except urllib.error.HTTPError as he:
                err_text = he.read().decode("utf-8", errors="ignore")
                logger.error(f"HTTP {he.code} Error dispatching punches: {err_text}")
                if he.code == 401:
                    logger.critical("Authentication failure: Invalid BIOMETRIC_DEVICE_KEY.")
                    break
            except Exception as ex:
                logger.warning(f"Connection attempt {attempt} failed: {ex}")

            time.sleep(backoff)
            backoff *= 2.0

        # On persistent failure, re-queue to prevent data loss
        logger.warning(f"Re-queueing {len(to_send)} punches for next retry window.")
        self.punch_buffer = to_send + self.punch_buffer
        return False

    def run_simulation(self, count=15, interval=1.2):
        """Simulates turnstile scholar entry flow for testing."""
        sample_scholars = [
            "std-cs-2024-001",
            "std-cs-2024-002",
            "std-cs-2024-003",
            "std-cs-2024-004",
            "std-cs-2024-005",
            "std-cs-2024-006",
            "std-cs-2024-007",
            "std-cs-2024-008",
        ]

        logger.info(f"Starting hardware turnstile simulation ({count} card taps)...")
        for i in range(count):
            student = sample_scholars[i % len(sample_scholars)]
            self.add_punch(student)
            time.sleep(interval)
            if time.time() - self.last_flush_time >= self.flush_interval:
                self.flush()

        self.flush()
        logger.info(f"Simulation completed. Successfully processed {self.total_punches_ingested} hardware punches.")

    def run_socket_listener(self, host="0.0.0.0", port=DEFAULT_PORT):
        """Listens on UDP/TCP port for direct ZKTeco/RFID raw scanner frames."""
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.bind((host, port))
        sock.settimeout(1.0)
        logger.info(f"Biometric hardware UDP listener active on {host}:{port}")

        try:
            while True:
                try:
                    data, addr = sock.recvfrom(1024)
                    raw_str = data.decode("utf-8", errors="ignore").strip()
                    # Expecting format: CARD_ID or {"studentId": "..."}
                    if raw_str.startswith("{") and "studentId" in raw_str:
                        parsed = json.loads(raw_str)
                        self.add_punch(parsed["studentId"], parsed.get("status", "PRESENT"))
                    elif raw_str:
                        self.add_punch(raw_str)
                except socket.timeout:
                    pass

                if time.time() - self.last_flush_time >= self.flush_interval:
                    self.flush()
        except KeyboardInterrupt:
            logger.info("Daemon interrupted by operator. Flushing remaining buffer...")
            self.flush()
        finally:
            sock.close()


def main():
    parser = argparse.ArgumentParser(description="Apex Biometric Turnstile Hardware Ingestion Daemon")
    parser.add_argument("--url", default=DEFAULT_SERVER_URL, help="CLASSROOM biometric endpoint URL")
    parser.add_argument("--key", default=DEFAULT_DEVICE_KEY, help="Biometric device authorization key")
    parser.add_argument("--serial", default=DEFAULT_SERIAL, help="Turnstile hardware serial number")
    parser.add_argument("--course", default="CS-402", help="Course code for active lecture session")
    parser.add_argument("--simulate", action="store_true", help="Run in simulation mode without physical hardware")
    parser.add_argument("--sim-count", type=int, default=10, help="Number of simulated card swipes")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="UDP listener port for hardware packets")

    args = parser.parse_args()

    daemon = BiometricTurnstileDaemon(
        server_url=args.url,
        device_key=args.key,
        serial_number=args.serial,
        course_code=args.course,
    )

    if args.simulate:
        daemon.run_simulation(count=args.sim_count)
    else:
        daemon.run_socket_listener(port=args.port)


if __name__ == "__main__":
    main()
