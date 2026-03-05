import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ProjectsClient from "@/components/project/ProjectsClient";

export const metadata = {
  title: "Projects",
};

/**
 * Projects list page.
 * Shows all active projects in the workspace.
 */
export default async function ProjectsPage({ params }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const { workspaceId } = await params;

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId: session.user.id },
    },
    include: { workspace: true },
  });

  if (!membership) {
    redirect("/onboarding");
  }

  const projects = await prisma.project.findMany({
    where: { workspaceId, isArchived: false },
    include: {
      createdBy: {
        select: { id: true, name: true, image: true },
      },
      _count: {
        select: { tasks: true, members: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const archivedCount = await prisma.project.count({
    where: { workspaceId, isArchived: true },
  });

  return (
    <ProjectsClient
      projects={projects}
      archivedCount={archivedCount}
      workspaceId={workspaceId}
      workspace={membership.workspace}
      currentUserRole={membership.role}
    />
  );
}