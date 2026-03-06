import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/workspaces/[workspaceId]/analytics
 * Returns aggregated stats for the workspace analytics dashboard.
 * Only accessible by OWNER and ADMIN.
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

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(now.getDate() - 13);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const [
      totalTasks,
      completedThisWeek,
      overdueTasks,
      tasksByStatus,
      tasksByPriority,
      projectStats,
      recentActivity,
      memberActivity,
    ] = await Promise.all([
      // Total tasks in workspace
      prisma.task.count({
        where: { project: { workspaceId } },
      }),

      // Completed this week
      prisma.task.count({
        where: {
          project: { workspaceId },
          status: "DONE",
          completedAt: { gte: startOfWeek },
        },
      }),

      // Overdue tasks (past due date, not done or cancelled)
      prisma.task.count({
        where: {
          project: { workspaceId },
          dueDate: { lt: now },
          status: { notIn: ["DONE", "CANCELLED"] },
        },
      }),

      // Tasks grouped by status
      prisma.task.groupBy({
        by: ["status"],
        where: { project: { workspaceId } },
        _count: { id: true },
      }),

      // Tasks grouped by priority
      prisma.task.groupBy({
        by: ["priority"],
        where: { project: { workspaceId } },
        _count: { id: true },
      }),

      // Per-project task counts
      prisma.project.findMany({
        where: { workspaceId, isArchived: false },
        select: {
          id: true,
          name: true,
          color: true,
          _count: { select: { tasks: true } },
        },
        orderBy: { createdAt: "asc" },
      }),

      // Activity count per day for last 14 days
      prisma.activity.findMany({
        where: {
          workspaceId,
          createdAt: { gte: fourteenDaysAgo },
        },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),

      // Top contributors: members with most completed tasks
      prisma.task.groupBy({
        by: ["createdById"],
        where: {
          project: { workspaceId },
          status: "DONE",
        },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
    ]);

    // Build activity-per-day buckets for the last 14 days
    const activityByDay = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      const count = recentActivity.filter((a) => {
        const d = new Date(a.createdAt);
        return d >= date && d < nextDate;
      }).length;

      activityByDay.push({
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        count,
      });
    }

    // Resolve member names for top contributors
    const contributorUserIds = memberActivity.map((m) => m.createdById);
    const contributorUsers = await prisma.user.findMany({
      where: { id: { in: contributorUserIds } },
      select: { id: true, name: true, image: true },
    });

    const topContributors = memberActivity.map((m) => {
      const user = contributorUsers.find((u) => u.id === m.createdById);
      return {
        userId: m.createdById,
        name: user?.name || "Unknown",
        image: user?.image || null,
        completedTasks: m._count.id,
      };
    });

    // Active members (members who have logged activity in the last 14 days)
    const activeUserIds = new Set(
      recentActivity.map((a) => a.userId)
    );

    return NextResponse.json({
      stats: {
        totalTasks,
        completedThisWeek,
        overdueTasks,
        activeMembers: activeUserIds.size,
      },
      tasksByStatus: tasksByStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
      tasksByPriority: tasksByPriority.map((p) => ({
        priority: p.priority,
        count: p._count.id,
      })),
      projectStats: projectStats.map((p) => ({
        id: p.id,
        name: p.name,
        color: p.color,
        taskCount: p._count.tasks,
      })),
      activityByDay,
      topContributors,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}