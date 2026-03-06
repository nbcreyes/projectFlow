import prisma from "@/lib/prisma";

/**
 * Creates a notification for a user.
 * Uses recipientId and link to match the actual Prisma schema.
 * Silently swallows errors so notification failures never break
 * the operation that triggered them.
 */
export async function createNotification({
  userId,
  triggeredById,
  type,
  title,
  message,
  linkUrl,
}) {
  if (userId === triggeredById) return;

  try {
    await prisma.notification.create({
      data: {
        recipientId: userId,
        triggeredById,
        type,
        title,
        message: message || null,
        link: linkUrl || null,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}