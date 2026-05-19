"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AdminOverview } from "@/lib/services/admin-overview";

const AdminOverviewContext = createContext<AdminOverview | null>(null);

export function AdminOverviewProvider({
  initialData,
  children,
}: {
  initialData: AdminOverview | null;
  children: ReactNode;
}) {
  return (
    <AdminOverviewContext.Provider value={initialData}>
      {children}
    </AdminOverviewContext.Provider>
  );
}

export function useAdminOverviewInitialData() {
  return useContext(AdminOverviewContext);
}
