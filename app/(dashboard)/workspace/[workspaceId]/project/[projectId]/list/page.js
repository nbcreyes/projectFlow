import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ListView from "@/components/project/ListView";

/**
 * List view page.
 * Shows all tasks in a flat table grouped by column.
 */
export default async function ListPage({ params }) {
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

  return (
    <ListView
      initialColumns={board.columns}
      workspaceId={workspaceId}
      projectId={projectId}
      currentUserRole={membership.role}
    />
  );
}