import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ProjectHeader from "@/components/project/ProjectHeader";

/**
 * Project detail layout.
 * Wraps board, list, and calendar views with the project header and tabs.
 * Fetches project data once here so child pages do not repeat the query.
 */
export default async function ProjectLayout({ children, params }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const { workspaceId, projectId } = await params;

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId: session.user.id },
    },
  });

  if (!membership) {
    redirect("/onboarding");
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
      _count: { select: { tasks: true } },
    },
  });

  if (!project || project.workspaceId !== workspaceId) {
    redirect(`/workspace/${workspaceId}/projects`);
  }

  return (
    <div className="flex flex-col h-full">
      <ProjectHeader
        project={project}
        workspaceId={workspaceId}
        currentUserRole={membership.role}
      />
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}