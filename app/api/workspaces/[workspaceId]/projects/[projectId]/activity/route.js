import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/workspaces/[workspaceId]/projects/[projectId]/activity
 * Returns recent activity for a project, newest first.
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

    const { searchParams } = new URL(request.url);
    const take = parseInt(searchParams.get("take") || "30");

    const activities = await prisma.activity.findMany({
      where: { projectId },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        task: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take,
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Get project activity error:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}