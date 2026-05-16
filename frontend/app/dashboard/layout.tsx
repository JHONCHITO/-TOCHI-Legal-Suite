export const dynamic = 'force-dynamic'; // 🔥 evita errores de build

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
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

  if (session.user.role === "cliente") {
    redirect("/portal");
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
