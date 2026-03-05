import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/workspaces/[workspaceId]/projects/[projectId]/tasks
 * Returns all tasks for a project with assignees and labels.
 */
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, projectId } = await params;

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: session.user.id },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
        _count: {
          select: { comments: true, attachments: true },
        },
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Get tasks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspaces/[workspaceId]/projects/[projectId]/tasks
 * Creates a new task in a column.
 */
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, projectId } = await params;

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: session.user.id },
      },
    });

    if (!membership || membership.role === "VIEWER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, columnId, priority = "NONE" } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Task title is required" },
        { status: 400 }
      );
    }

    // Get the highest order value in this column so new task goes to the bottom
    const lastTask = await prisma.task.findFirst({
      where: { projectId, columnId: columnId || null },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const order = lastTask ? lastTask.order + 1 : 0;

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        projectId,
        columnId: columnId || null,
        createdById: session.user.id,
        priority,
        order,
      },
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
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}