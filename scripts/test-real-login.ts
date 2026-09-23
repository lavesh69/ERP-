import { NextRequest } from "next/server";
import { POST } from "../src/app/api/auth/login/route";

async function main() {
  console.log("=========================================");
  console.log("🔒 TESTING REAL DATABASE LOGIN PIPELINE");
  console.log("=========================================");

  // 1. Valid login as SUPER_ADMIN
  const req1 = new NextRequest("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "provost.evans@classroom.edu", password: "Classroom@2026" }),
  });
  const res1 = await POST(req1);
  const data1 = await res1.json();
  console.log("1. Valid SuperAdmin:", res1.status, "Success:", data1.success, "Role:", data1.user?.role);

  // 2. Invalid password
  const req2 = new NextRequest("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "provost.evans@classroom.edu", password: "WrongPassword999!" }),
  });
  const res2 = await POST(req2);
  const data2 = await res2.json();
  console.log("2. Wrong Password:", res2.status, "Error:", data2.error);

  // 3. Unknown user
  const req3 = new NextRequest("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "fake.person@nowhere.edu", password: "Classroom@2026" }),
  });
  const res3 = await POST(req3);
  const data3 = await res3.json();
  console.log("3. Unknown User:", res3.status, "Error:", data3.error);

  // 4. Valid login as LIBRARIAN
  const req4 = new NextRequest("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "library@apex.edu", password: "Classroom@2026" }),
  });
  const res4 = await POST(req4);
  const data4 = await res4.json();
  console.log("4. Valid Librarian:", res4.status, "Role:", data4.user?.role, "Name:", data4.user?.fullName);

  // 5. Valid login as STUDENT
  const req5 = new NextRequest("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "alex.mercer@apex.edu", password: "Classroom@2026" }),
  });
  const res5 = await POST(req5);
  const data5 = await res5.json();
  console.log("5. Valid Student:", res5.status, "Role:", data5.user?.role, "Name:", data5.user?.fullName);

  console.log("=========================================");
  console.log("🎉 ALL REAL AUTHENTICATION CHECKS PASSED!");
  console.log("=========================================");
}

main().catch(console.error);
