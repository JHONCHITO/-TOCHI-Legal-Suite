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
import { getRoleLandingPath, type UserRole } from "@/lib/auth-utils";
import { SessionProvider } from "@/components/providers/session-provider";

export default async function PortalLayout({
  children: _children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userRole = (session.user.role as UserRole | undefined) || "abogado";
  if (userRole !== "cliente") {
    redirect(getRoleLandingPath(userRole));
  }

  return <SessionProvider>{_children}</SessionProvider>;
}
