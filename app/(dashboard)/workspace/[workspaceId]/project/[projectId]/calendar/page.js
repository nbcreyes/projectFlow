import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import CalendarView from "@/components/project/CalendarView";

/**
 * Calendar view page.
 * Shows tasks plotted by due date on a monthly calendar.
 */
export default async function CalendarPage({ params }) {
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

  const tasks = await prisma.task.findMany({
    where: { projectId },
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
      column: {
        select: { id: true, name: true, color: true },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  return (
    <CalendarView
      initialTasks={tasks}
      workspaceId={workspaceId}
      projectId={projectId}
      currentUserRole={membership.role}
    />
  );
}