import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";

/**
 * DELETE /api/tasks/[taskId]/attachments/[attachmentId]
 * Deletes an attachment from Cloudinary and the database.
 * Only the uploader or workspace OWNER/ADMIN can delete.
 */
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId, attachmentId } = await params;

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        task: {
          include: { project: true },
        },
      },
    });

    if (!attachment || attachment.taskId !== taskId) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: attachment.task.project.workspaceId,
          userId: session.user.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const isUploader = attachment.uploadedById === session.user.id;
    const isManager = ["OWNER", "ADMIN"].includes(membership.role);

    if (!isUploader && !isManager) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete from Cloudinary
    if (attachment.publicId) {
      await cloudinary.uploader.destroy(attachment.publicId, {
        resource_type: "auto",
      });
    }

    await prisma.attachment.delete({ where: { id: attachmentId } });

    return NextResponse.json({ message: "Attachment deleted" });
  } catch (error) {
    console.error("Delete attachment error:", error);
    return NextResponse.json(
      { error: "Failed to delete attachment" },
      { status: 500 }
    );
  }
}