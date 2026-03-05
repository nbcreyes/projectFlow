import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/workspaces/[workspaceId]/projects
 * Returns all projects in the workspace the user has access to.
 */
export async function GET(request, { params }) {
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

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get("archived") === "true";

    const projects = await prisma.project.findMany({
      where: {
        workspaceId,
        isArchived: includeArchived ? undefined : false,
      },
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

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Get projects error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspaces/[workspaceId]/projects
 * Creates a new project in the workspace.
 * Automatically adds the creator as a project member with OWNER role.
 * Also creates a default board with default columns.
 */
export async function POST(request, { params }) {
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
    const { name, description, color } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // Create project, add creator as member, and create default board with
    // default columns all in a single transaction
    const project = await prisma.$transaction(async (tx) => {
      const newProject = await tx.project.create({
        data: {
          workspaceId,
          name: name.trim(),
          description: description?.trim() || null,
          color: color || "#3b82f6",
          createdById: session.user.id,
          members: {
            create: {
              userId: session.user.id,
              role: "OWNER",
            },
          },
        },
      });

      // Create the default board
      const board = await tx.board.create({
        data: {
          projectId: newProject.id,
          name: "Main Board",
        },
      });

      // Create default columns
      await tx.column.createMany({
        data: [
          { boardId: board.id, name: "To Do", color: "#e2e8f0", order: 0 },
          { boardId: board.id, name: "In Progress", color: "#bfdbfe", order: 1 },
          { boardId: board.id, name: "In Review", color: "#fef08a", order: 2 },
          { boardId: board.id, name: "Done", color: "#bbf7d0", order: 3 },
        ],
      });

      return newProject;
    });

    return NextResponse.json(
      { message: "Project created", project },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}