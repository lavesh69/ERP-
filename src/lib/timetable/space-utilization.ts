/**
 * CLASSROOM ERP — Space & Facility Utilization Telemetry Engine
 * Computes institutional facility load, room occupancy percentages,
 * seat fill efficiencies, and HVAC/energy scheduling insights.
 */

export interface RoomUtilizationMetric {
  roomId: string;
  roomCode: string;
  roomName: string;
  roomType: string;
  capacity: number;
  scheduledWeeklyHours: number;
  availableWeeklyHours: number;
  occupancyRatePct: number;
  averageSeatFillRatePct: number;
  status: "CRITICAL_BOTTLENECK" | "OPTIMAL" | "MODERATE" | "UNDERUTILIZED";
  capacityFit: "OVERCROWDED" | "WELL_SIZED" | "UNDER_OCCUPIED_SPACE" | "IDLE";
  slotCount: number;
  activeDays: string[];
}

export interface DayUtilizationSummary {
  dayOfWeek: string;
  scheduledHours: number;
  activeRoomsCount: number;
  loadPct: number;
}

export interface HourlyLoadPoint {
  hourLabel: string; // e.g. "09:00 - 10:00"
  startHour: number; // 9
  concurrentRoomsActive: number;
  loadPct: number; // concurrent / totalRooms * 100
}

export interface CampusSpaceTelemetry {
  institutionId?: string;
  campusId?: string;
  generatedAt: string;
  totalRooms: number;
  totalCapacitySeats: number;
  totalScheduledHours: number;
  totalAvailableHours: number;
  averageOccupancyPct: number;
  averageSeatFillPct: number;
  metricsByRoom: RoomUtilizationMetric[];
  roomTypeBreakdown: Record<string, {
    count: number;
    totalSeats: number;
    scheduledHours: number;
    averageOccupancyPct: number;
  }>;
  dayDistribution: DayUtilizationSummary[];
  hourlyDistribution: HourlyLoadPoint[];
  peakHour: string;
  insights: {
    criticalBottlenecks: string[];
    underutilizedRooms: string[];
    capacityMismatches: string[];
    recommendedHvacSavingsHours: number;
  };
}

export interface TimetableSlotLike {
  id: string;
  roomId: string;
  dayOfWeek: string;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  sectionCapacity?: number;
  courseType?: string;
  courseCode?: string;
}

export interface RoomLike {
  id: string;
  code: string;
  name: string;
  type: string;
  capacity: number;
  campusId?: string;
}

const STANDARD_OPERATING_DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const OPERATING_HOURS_PER_DAY = 8; // 09:00 to 17:00 standard academic window
const STANDARD_WEEKLY_HOURS = STANDARD_OPERATING_DAYS.length * OPERATING_HOURS_PER_DAY; // 40 hours

/**
 * Calculates duration in decimal hours between two "HH:MM" strings
 */
export function calculateSlotDurationHours(startTime: string, endTime: string): number {
  try {
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return 1.0;
    const duration = (endH + endM / 60) - (startH + startM / 60);
    return Math.max(0.5, Math.min(12.0, Math.round(duration * 100) / 100));
  } catch {
    return 1.0;
  }
}

/**
 * Evaluates individual room utilization and seat efficiency metrics
 */
export function calculateRoomMetrics(
  room: RoomLike,
  slots: TimetableSlotLike[],
  weeklyOperatingHours: number = STANDARD_WEEKLY_HOURS
): RoomUtilizationMetric {
  const roomSlots = slots.filter((s) => s.roomId === room.id);
  const activeDaysSet = new Set<string>();
  let totalScheduledHours = 0;
  let totalSeatFillRatio = 0;

  for (const slot of roomSlots) {
    const dur = calculateSlotDurationHours(slot.startTime, slot.endTime);
    totalScheduledHours += dur;
    activeDaysSet.add(slot.dayOfWeek.toUpperCase());

    const sectionCap = slot.sectionCapacity || Math.min(room.capacity, 45);
    const fillRate = (sectionCap / Math.max(1, room.capacity)) * 100;
    totalSeatFillRatio += fillRate;
  }

  totalScheduledHours = Math.round(totalScheduledHours * 10) / 10;
  const occupancyPct = weeklyOperatingHours > 0
    ? Math.min(100, Math.round((totalScheduledHours / weeklyOperatingHours) * 1000) / 10)
    : 0;

  const avgSeatFillPct = roomSlots.length > 0
    ? Math.round((totalSeatFillRatio / roomSlots.length) * 10) / 10
    : 0;

  // Status determination
  let status: RoomUtilizationMetric["status"] = "OPTIMAL";
  if (occupancyPct >= 80) {
    status = "CRITICAL_BOTTLENECK";
  } else if (occupancyPct >= 50) {
    status = "OPTIMAL";
  } else if (occupancyPct >= 25) {
    status = "MODERATE";
  } else {
    status = "UNDERUTILIZED";
  }

  // Capacity fit determination
  let capacityFit: RoomUtilizationMetric["capacityFit"] = "WELL_SIZED";
  if (roomSlots.length === 0) {
    capacityFit = "IDLE";
  } else if (avgSeatFillPct > 105) {
    capacityFit = "OVERCROWDED";
  } else if (avgSeatFillPct < 40) {
    capacityFit = "UNDER_OCCUPIED_SPACE";
  } else {
    capacityFit = "WELL_SIZED";
  }

  return {
    roomId: room.id,
    roomCode: room.code,
    roomName: room.name,
    roomType: room.type || "CLASSROOM",
    capacity: room.capacity || 60,
    scheduledWeeklyHours: totalScheduledHours,
    availableWeeklyHours: weeklyOperatingHours,
    occupancyRatePct: occupancyPct,
    averageSeatFillRatePct: avgSeatFillPct,
    status,
    capacityFit,
    slotCount: roomSlots.length,
    activeDays: Array.from(activeDaysSet),
  };
}

/**
 * Computes institution / campus-wide facility telemetry, day load curves, and hourly heatmaps
 */
export function computeCampusSpaceTelemetry(
  rooms: RoomLike[],
  slots: TimetableSlotLike[],
  options?: {
    institutionId?: string;
    campusId?: string;
    weeklyOperatingHours?: number;
  }
): CampusSpaceTelemetry {
  const weeklyHours = options?.weeklyOperatingHours || STANDARD_WEEKLY_HOURS;
  const roomMetrics = rooms.map((r) => calculateRoomMetrics(r, slots, weeklyHours));

  const totalRooms = rooms.length;
  const totalCapacitySeats = rooms.reduce((acc, r) => acc + (r.capacity || 0), 0);
  const totalScheduledHours = Math.round(roomMetrics.reduce((acc, m) => acc + m.scheduledWeeklyHours, 0) * 10) / 10;
  const totalAvailableHours = totalRooms * weeklyHours;

  const avgOccupancy = roomMetrics.length > 0
    ? Math.round((roomMetrics.reduce((acc, m) => acc + m.occupancyRatePct, 0) / roomMetrics.length) * 10) / 10
    : 0;

  const activeRooms = roomMetrics.filter((m) => m.slotCount > 0);
  const avgSeatFill = activeRooms.length > 0
    ? Math.round((activeRooms.reduce((acc, m) => acc + m.averageSeatFillRatePct, 0) / activeRooms.length) * 10) / 10
    : 0;

  // Breakdown by room type
  const roomTypeBreakdown: CampusSpaceTelemetry["roomTypeBreakdown"] = {};
  for (const metric of roomMetrics) {
    const t = metric.roomType;
    if (!roomTypeBreakdown[t]) {
      roomTypeBreakdown[t] = {
        count: 0,
        totalSeats: 0,
        scheduledHours: 0,
        averageOccupancyPct: 0,
      };
    }
    roomTypeBreakdown[t].count += 1;
    roomTypeBreakdown[t].totalSeats += metric.capacity;
    roomTypeBreakdown[t].scheduledHours = Math.round((roomTypeBreakdown[t].scheduledHours + metric.scheduledWeeklyHours) * 10) / 10;
  }

  for (const t of Object.keys(roomTypeBreakdown)) {
    const count = roomTypeBreakdown[t].count;
    const typeScheduled = roomTypeBreakdown[t].scheduledHours;
    const typeAvail = count * weeklyHours;
    roomTypeBreakdown[t].averageOccupancyPct = typeAvail > 0
      ? Math.round((typeScheduled / typeAvail) * 1000) / 10
      : 0;
  }

  // Day distribution (Monday - Friday)
  const dayDistribution: DayUtilizationSummary[] = STANDARD_OPERATING_DAYS.map((day) => {
    const daySlots = slots.filter((s) => s.dayOfWeek.toUpperCase() === day);
    const dayRooms = new Set(daySlots.map((s) => s.roomId));
    let dayHours = 0;
    for (const slot of daySlots) {
      dayHours += calculateSlotDurationHours(slot.startTime, slot.endTime);
    }
    const maxDayCapacityHours = totalRooms * OPERATING_HOURS_PER_DAY;
    const loadPct = maxDayCapacityHours > 0
      ? Math.min(100, Math.round((dayHours / maxDayCapacityHours) * 1000) / 10)
      : 0;

    return {
      dayOfWeek: day,
      scheduledHours: Math.round(dayHours * 10) / 10,
      activeRoomsCount: dayRooms.size,
      loadPct,
    };
  });

  // Hourly distribution (08:00 to 18:00)
  const hourlyDistribution: HourlyLoadPoint[] = [];
  let peakHour = "10:00 - 11:00";
  let maxConcurrent = 0;

  for (let h = 8; h < 18; h++) {
    const startStr = `${h.toString().padStart(2, "0")}:00`;
    const endStr = `${(h + 1).toString().padStart(2, "0")}:00`;
    const hourLabel = `${startStr} - ${endStr}`;

    // Count concurrent active rooms in this hour across Mon-Fri
    const activeRoomSet = new Set<string>();
    for (const slot of slots) {
      const [slotStartH] = slot.startTime.split(":").map(Number);
      const [slotEndH] = slot.endTime.split(":").map(Number);
      if (h >= slotStartH && h < slotEndH) {
        activeRoomSet.add(`${slot.dayOfWeek}-${slot.roomId}`);
      }
    }

    // Average daily concurrent rooms at this hour
    const avgConcurrent = Math.round((activeRoomSet.size / STANDARD_OPERATING_DAYS.length) * 10) / 10;
    const loadPct = totalRooms > 0
      ? Math.min(100, Math.round((avgConcurrent / totalRooms) * 1000) / 10)
      : 0;

    if (avgConcurrent > maxConcurrent) {
      maxConcurrent = avgConcurrent;
      peakHour = hourLabel;
    }

    hourlyDistribution.push({
      hourLabel,
      startHour: h,
      concurrentRoomsActive: avgConcurrent,
      loadPct,
    });
  }

  // Actionable Insights
  const criticalBottlenecks = roomMetrics
    .filter((m) => m.status === "CRITICAL_BOTTLENECK")
    .map((m) => `${m.roomCode} (${m.roomName}): ${m.occupancyRatePct}% occupancy`);

  const underutilizedRooms = roomMetrics
    .filter((m) => m.status === "UNDERUTILIZED")
    .map((m) => `${m.roomCode} (${m.roomName}): ${m.occupancyRatePct}% occupancy`);

  const capacityMismatches = roomMetrics
    .filter((m) => m.capacityFit === "UNDER_OCCUPIED_SPACE")
    .map((m) => `${m.roomCode} (${m.capacity} seats): avg fill rate ${m.averageSeatFillRatePct}%`);

  const idleHoursAcrossCampus = Math.max(0, totalAvailableHours - totalScheduledHours);
  const recommendedHvacSavingsHours = Math.round(idleHoursAcrossCampus * 0.4);

  return {
    institutionId: options?.institutionId,
    campusId: options?.campusId,
    generatedAt: new Date().toISOString(),
    totalRooms,
    totalCapacitySeats,
    totalScheduledHours,
    totalAvailableHours,
    averageOccupancyPct: avgOccupancy,
    averageSeatFillPct: avgSeatFill,
    metricsByRoom: roomMetrics,
    roomTypeBreakdown,
    dayDistribution,
    hourlyDistribution,
    peakHour,
    insights: {
      criticalBottlenecks,
      underutilizedRooms,
      capacityMismatches,
      recommendedHvacSavingsHours,
    },
  };
}
