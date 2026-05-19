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
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  await dbConnect();
  const currentUser = await User.findById(session.user.id).select("rol").lean();
  if ((currentUser as { rol?: string } | null)?.rol !== "superadmin") {
    redirect("/dashboard");
  }

  return children;
}
