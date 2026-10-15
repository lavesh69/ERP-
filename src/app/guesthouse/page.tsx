"use client";

import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { GuestHouseView } from "@/components/campus/GuestHouseView";

export default function GuestHousePage() {
  return (
    <AppShell>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/" },
            { label: "University Guest House & Transit Accommodation", href: "/guesthouse" },
          ]}
        />
        <GuestHouseView />
      </div>
    </AppShell>
  );
}
