import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import TaskDetail from "@/components/task/TaskDetail";

export async function generateMetadata({ params }) {
  const { taskId } = await params;
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { title: true },
  });
  return { title: task?.title || "Task" };
}

/**
 * Task detail page.
 * Fetches the full task with all related data and passes to client component.
 */
export default async function TaskPage({ params }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const { workspaceId, projectId, taskId } = await params;

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId: session.user.id },
    },
  });

  if (!membership) {
    redirect("/onboarding");
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignees: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
      labels: {
        include: { label: true },
      },
      attachments: true,
      document: true,
      createdBy: {
        select: { id: true, name: true, image: true },
      },
      column: {
        select: { id: true, name: true, color: true },
      },
      project: {
        select: { id: true, name: true, color: true, workspaceId: true },
      },
      _count: {
        select: { comments: true, attachments: true },
      },
    },
  });

  if (!task || task.project.workspaceId !== workspaceId) {
    redirect(`/workspace/${workspaceId}/project/${projectId}`);
  }

  // Fetch all columns for this project (for the column selector)
  const board = await prisma.board.findFirst({
    where: { projectId },
    include: {
      columns: {
        orderBy: { order: "asc" },
        select: { id: true, name: true, color: true },
      },
    },
  });

  // Fetch workspace members for assignee selector
  const workspaceMembers = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });

  // Fetch labels for this project
  const labels = await prisma.label.findMany({
    where: { projectId },
    orderBy: { name: "asc" },
  });

  // Fetch comments
  const comments = await prisma.comment.findMany({
    where: { taskId, parentId: null },
    include: {
      author: {
        select: { id: true, name: true, image: true },
      },
      reactions: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <TaskDetail
      task={task}
      columns={board?.columns || []}
      workspaceMembers={workspaceMembers}
      labels={labels}
      comments={comments}
      workspaceId={workspaceId}
      projectId={projectId}
      currentUserId={session.user.id}
      currentUserRole={membership.role}
      currentUser={{ id: session.user.id, name: session.user.name, image: session.user.image }}
    />
  );
}