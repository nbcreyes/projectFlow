import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import WorkspaceHome from "@/components/workspace/WorkspaceHome";

/**
 * Workspace home page.
 * params must be awaited in Next.js 16.
 */
export default async function WorkspacePage({ params }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const { workspaceId } = await params;

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: session.user.id,
      },
    },
    include: { workspace: true },
  });

  if (!membership) {
    redirect("/onboarding");
  }

  const [projectCount, memberCount, taskCount] = await Promise.all([
    prisma.project.count({
      where: { workspaceId, isArchived: false },
    }),
    prisma.workspaceMember.count({
      where: { workspaceId },
    }),
    prisma.task.count({
      where: {
        project: { workspaceId },
        status: { not: "DONE" },
      },
    }),
  ]);

  const recentProjects = await prisma.project.findMany({
    where: { workspaceId, isArchived: false },
    orderBy: { updatedAt: "desc" },
    take: 6,
    include: {
      _count: { select: { tasks: true, members: true } },
    },
  });

  return (
    <WorkspaceHome
      workspace={membership.workspace}
      user={session.user}
      stats={{ projectCount, memberCount, taskCount }}
      recentProjects={recentProjects}
    />
  );
}