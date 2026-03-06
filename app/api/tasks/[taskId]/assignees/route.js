import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { logActivity } from "@/lib/activity";

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;
    const body = await request.json();
    const { userId } = body;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: task.project.workspaceId,
          userId: session.user.id,
        },
      },
    });

    if (!membership || membership.role === "VIEWER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const assignee = await prisma.taskAssignee.create({
      data: { taskId, userId },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    await createNotification({
      userId,
      triggeredById: session.user.id,
      type: "TASK_ASSIGNED",
      title: "You were assigned to a task",
      message: `You have been assigned to "${task.title}"`,
      linkUrl: `/workspace/${task.project.workspaceId}/project/${task.projectId}/task/${task.id}`,
    });

    await logActivity({
      workspaceId: task.project.workspaceId,
      projectId: task.projectId,
      taskId: task.id,
      userId: session.user.id,
      type: "TASK_ASSIGNED",
      description: `assigned ${assignee.user.name} to "${task.title}"`,
    });

    return NextResponse.json({ assignee }, { status: 201 });
  } catch (error) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "User is already assigned" },
        { status: 409 }
      );
    }
    console.error("Add assignee error:", error);
    return NextResponse.json(
      { error: "Failed to add assignee" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;
    const body = await request.json();
    const { userId } = body;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: task.project.workspaceId,
          userId: session.user.id,
        },
      },
    });

    if (!membership || membership.role === "VIEWER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.taskAssignee.deleteMany({
      where: { taskId, userId },
    });

    return NextResponse.json({ message: "Assignee removed" });
  } catch (error) {
    console.error("Remove assignee error:", error);
    return NextResponse.json(
      { error: "Failed to remove assignee" },
      { status: 500 }
    );
  }
}