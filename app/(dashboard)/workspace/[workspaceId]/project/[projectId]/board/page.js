import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import KanbanBoard from "@/components/board/KanbanBoard";

/**
 * Board page.
 * Fetches columns and tasks server-side and passes to the client board.
 */
export default async function BoardPage({ params }) {
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

  const board = await prisma.board.findFirst({
    where: { projectId },
    include: {
      columns: {
        orderBy: { order: "asc" },
        include: {
          tasks: {
            orderBy: { order: "asc" },
            include: {
              assignees: {
                include: {
                  user: {
                    select: { id: true, name: true, image: true },
                  },
                },
              },
              labels: {
                include: { label: true },
              },
              _count: {
                select: { comments: true, attachments: true },
              },
            },
          },
        },
      },
    },
  });

  if (!board) {
    redirect(`/workspace/${workspaceId}/projects`);
  }

  // Fetch workspace members for task assignment
  const workspaceMembers = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  return (
    <KanbanBoard
      initialBoard={board}
      workspaceId={workspaceId}
      projectId={projectId}
      currentUserRole={membership.role}
      workspaceMembers={workspaceMembers}
    />
  );
}