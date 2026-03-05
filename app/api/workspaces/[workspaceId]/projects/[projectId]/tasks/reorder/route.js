import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * PATCH /api/workspaces/[workspaceId]/projects/[projectId]/tasks/reorder
 * Updates the columnId and order of tasks after a drag operation.
 * Receives an array of { id, columnId, order } objects.
 */
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await params;

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: session.user.id },
      },
    });

    if (!membership || membership.role === "VIEWER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { tasks } = body;

    if (!Array.isArray(tasks)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Update all tasks in parallel
    await Promise.all(
      tasks.map((task) =>
        prisma.task.update({
          where: { id: task.id },
          data: {
            columnId: task.columnId,
            order: task.order,
          },
        })
      )
    );

    return NextResponse.json({ message: "Tasks reordered" });
  } catch (error) {
    console.error("Reorder tasks error:", error);
    return NextResponse.json(
      { error: "Failed to reorder tasks" },
      { status: 500 }
    );
  }
}