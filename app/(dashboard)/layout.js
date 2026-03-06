import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Sidebar from "@/components/layouts/Sidebar";
import MobileSidebarTrigger from "@/components/layouts/MobileSidebarTrigger";

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

  const resolvedParams = params ? await params : {};
  const currentWorkspaceId =
    resolvedParams?.workspaceId || workspaces[0]?.id || null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:flex">
        <Sidebar
          workspaces={workspaces}
          currentWorkspaceId={currentWorkspaceId}
          user={session.user}
        />
      </div>

      {/* Mobile sidebar drawer trigger */}
      <MobileSidebarTrigger
        workspaces={workspaces}
        currentWorkspaceId={currentWorkspaceId}
        user={session.user}
      />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
