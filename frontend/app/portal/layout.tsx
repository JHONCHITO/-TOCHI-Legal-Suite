export const dynamic = "force-dynamic";

export const metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SessionProvider } from "@/components/providers/session-provider";
import { PortalHeader } from "@/components/portal/portal-header";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "cliente") {
    redirect("/dashboard");
  }

  return (
    <SessionProvider>
      <div className="min-h-screen bg-background">
        <PortalHeader />
        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}
