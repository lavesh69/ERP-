"use client";

import React, { use } from "react";
import Student360ProfileView from "@/components/students/Student360ProfileView";

export default function StudentDynamicDossierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  return <Student360ProfileView initialStudentId={resolvedParams.id} />;
}
