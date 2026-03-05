import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Sidebar from "@/components/layouts/Sidebar";

/**
 * Dashboard layout.
 * Wraps all workspace pages with the sidebar.
 * params must be awaited in Next.js 16.
 */
export default async function DashboardLayout({ children, params }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    include: { workspace: true },
    orderBy: { joinedAt: "desc" },
  });

  const workspaces = memberships.map((m) => ({
    ...m.workspace,
    role: m.role,
  }));

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar workspaces={workspaces} user={session.user} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}