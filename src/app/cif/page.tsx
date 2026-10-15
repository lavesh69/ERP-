"use client";

import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import CIFPortalTab from "@/components/research/CIFPortalTab";

export default function CIFStandalonePage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/" },
            { label: "Research", href: "/research" },
            { label: "Central Instrumentation Facility (CIF)", href: "/cif" },
          ]}
        />
        <CIFPortalTab />
      </div>
    </AppShell>
  );
}
