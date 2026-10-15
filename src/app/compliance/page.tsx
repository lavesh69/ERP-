"use client";

import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { ProctorialBoardView } from "@/components/compliance/ProctorialBoardView";

export default function CompliancePage() {
  return (
    <AppShell>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/" },
            { label: "Statutory Governance & Proctorial Board", href: "/compliance" },
          ]}
        />
        <ProctorialBoardView />
      </div>
    </AppShell>
  );
}
