import prisma from "@/lib/prisma";

/**
 * Logs an activity event to the database.
 * Called from API routes after significant state changes.
 * Silently swallows errors so logging never breaks the main operation.
 */
export async function logActivity({
  workspaceId,
  projectId,
  taskId,
  userId,
  type,
  description,
  metadata,
}) {
  try {
    await prisma.activity.create({
      data: {
        workspaceId,
        projectId,
        taskId: taskId || null,
        userId,
        type,
        description,
        metadata: metadata || null,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}