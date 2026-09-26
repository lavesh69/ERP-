"use client";

import FacultyDetailPage from "../[id]/page";

export default function FacultyProfileSelfPage() {
  return <FacultyDetailPage params={Promise.resolve({ id: "me" })} />;
}
