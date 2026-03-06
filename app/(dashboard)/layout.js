import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Sidebar from "@/components/layouts/Sidebar";

/**
 * Dashboard layout.
 * Extracts workspaceId from the URL to pass the active workspace to the sidebar.
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

  // Extract workspaceId from URL params if present
  const resolvedParams = params ? await params : {};
  const currentWorkspaceId =
    resolvedParams?.workspaceId || workspaces[0]?.id || null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        workspaces={workspaces}
        currentWorkspaceId={currentWorkspaceId}
        user={session.user}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}