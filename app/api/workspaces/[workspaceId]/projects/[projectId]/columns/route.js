import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/workspaces/[workspaceId]/projects/[projectId]/columns
 * Returns all columns for the first board of the project.
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

    const board = await prisma.board.findFirst({
      where: { projectId },
      include: {
        columns: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    return NextResponse.json({ columns: board.columns, boardId: board.id });
  } catch (error) {
    console.error("Get columns error:", error);
    return NextResponse.json(
      { error: "Failed to fetch columns" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspaces/[workspaceId]/projects/[projectId]/columns
 * Creates a new column on the board.
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

    if (!membership || ["MEMBER", "VIEWER"].includes(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Column name is required" },
        { status: 400 }
      );
    }

    const board = await prisma.board.findFirst({ where: { projectId } });

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const lastColumn = await prisma.column.findFirst({
      where: { boardId: board.id },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const column = await prisma.column.create({
      data: {
        boardId: board.id,
        name: name.trim(),
        order: lastColumn ? lastColumn.order + 1 : 0,
      },
    });

    return NextResponse.json({ column }, { status: 201 });
  } catch (error) {
    console.error("Create column error:", error);
    return NextResponse.json(
      { error: "Failed to create column" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/workspaces/[workspaceId]/projects/[projectId]/columns
 * Reorders columns after a drag operation.
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
    const { columns } = body;

    if (!Array.isArray(columns)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await Promise.all(
      columns.map((col) =>
        prisma.column.update({
          where: { id: col.id },
          data: { order: col.order },
        })
      )
    );

    return NextResponse.json({ message: "Columns reordered" });
  } catch (error) {
    console.error("Reorder columns error:", error);
    return NextResponse.json(
      { error: "Failed to reorder columns" },
      { status: 500 }
    );
  }
}