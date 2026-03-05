import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/workspaces/[workspaceId]/projects/[projectId]/labels
 * Returns all labels for a project.
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

    const labels = await prisma.label.findMany({
      where: { projectId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ labels });
  } catch (error) {
    console.error("Get labels error:", error);
    return NextResponse.json(
      { error: "Failed to fetch labels" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspaces/[workspaceId]/projects/[projectId]/labels
 * Creates a new label for a project.
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
    const { name, color } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Label name is required" },
        { status: 400 }
      );
    }

    const label = await prisma.label.create({
      data: {
        name: name.trim(),
        color: color || "#3b82f6",
        projectId,
      },
    });

    return NextResponse.json({ label }, { status: 201 });
  } catch (error) {
    console.error("Create label error:", error);
    return NextResponse.json(
      { error: "Failed to create label" },
      { status: 500 }
    );
  }
}