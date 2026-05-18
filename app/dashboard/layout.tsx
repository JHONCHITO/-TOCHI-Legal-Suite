export const dynamic = 'force-dynamic'; // 🔥 evita errores de build

export const metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { SessionProvider } from "@/components/providers/session-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
