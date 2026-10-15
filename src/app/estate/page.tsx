"use client";

import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import EstateWorksView from "@/components/estate/EstateWorksView";

export default function EstatePage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/" },
            { label: "Campus Facilities", href: "/inventory" },
            { label: "Estate Office & Infrastructure Works", href: "/estate" },
          ]}
        />
        <EstateWorksView />
      </div>
    </AppShell>
  );
}
