export const dynamic = 'force-dynamic'; // 🔥 evita errores de build

export const metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getEffectiveSubscription, isSubscriptionAccessExpired } from "@/lib/subscription";
import { getRoleLandingPath, type UserRole } from "@/lib/auth-utils";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { SessionProvider } from "@/components/providers/session-provider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userRole = (session.user.role as UserRole | undefined) || "abogado";
  if (userRole === "cliente") {
    redirect(getRoleLandingPath(userRole));
  }

  const effectiveSubscription = await getEffectiveSubscription(session.user.id);
  if (!effectiveSubscription) {
    redirect("/login");
  }

  if (!effectiveSubscription.isUnlimited && isSubscriptionAccessExpired(effectiveSubscription.subscription)) {
    redirect("/precios");
  }

  return (
    <SessionProvider>
      <div className="min-h-screen bg-background">
        {/* Sidebar */}
        <Sidebar />

        {/* Contenido principal */}
        <div className="lg:pl-64 transition-all duration-300">
          <Header />

          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
