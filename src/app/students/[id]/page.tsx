"use client";

import React, { use } from "react";
import Student360ProfilePage from "../profile/page";

export default function StudentDynamicDossierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  return <Student360ProfilePage />;
}
