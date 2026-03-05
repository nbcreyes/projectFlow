import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/search?q=query&workspaceId=id
 * Searches tasks and projects within a workspace.
 * Documents are excluded as the schema does not have a searchable title field.
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();
    const workspaceId = searchParams.get("workspaceId");

    if (!query || query.length < 2) {
      return NextResponse.json({
        results: { tasks: [], projects: [] },
      });
    }

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 }
      );
    }

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: session.user.id },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [tasks, projects] = await Promise.all([
      prisma.task.findMany({
        where: {
          project: { workspaceId },
          title: { contains: query, mode: "insensitive" },
        },
        include: {
          project: {
            select: { id: true, name: true, color: true },
          },
          column: {
            select: { name: true },
          },
        },
        take: 8,
        orderBy: { updatedAt: "desc" },
      }),

      prisma.project.findMany({
        where: {
          workspaceId,
          isArchived: false,
          name: { contains: query, mode: "insensitive" },
        },
        include: {
          _count: { select: { tasks: true } },
        },
        take: 5,
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    return NextResponse.json({ results: { tasks, projects } });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}