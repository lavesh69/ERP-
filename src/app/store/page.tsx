"use client";

import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import StoreIndentView from "@/components/inventory/StoreIndentView";

export default function StoreStandalonePage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/" },
            { label: "Inventory", href: "/inventory" },
            { label: "Stationery & Examination Store", href: "/store" },
          ]}
        />
        <StoreIndentView />
      </div>
    </AppShell>
  );
}
