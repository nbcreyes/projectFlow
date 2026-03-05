import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * PATCH /api/workspaces/[workspaceId]/members/[memberId]
 * Updates a member role.
 * OWNER can change anyone except themselves.
 * ADMIN can change MEMBER and VIEWER only.
 */
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, memberId } = await params;

    const requesterMembership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: session.user.id },
      },
    });

    if (
      !requesterMembership ||
      !["OWNER", "ADMIN"].includes(requesterMembership.role)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find the target membership by memberId (this is the WorkspaceMember id)
    const targetMembership = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!targetMembership || targetMembership.workspaceId !== workspaceId) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Cannot change the role of the workspace OWNER
    if (targetMembership.role === "OWNER") {
      return NextResponse.json(
        { error: "Cannot change the role of the workspace owner" },
        { status: 403 }
      );
    }

    // ADMIN cannot promote someone to OWNER or ADMIN
    if (requesterMembership.role === "ADMIN") {
      const body = await request.json();
      if (["OWNER", "ADMIN"].includes(body.role)) {
        return NextResponse.json(
          { error: "Admins cannot assign Owner or Admin roles" },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { role } = body;

    const validRoles = ["ADMIN", "MEMBER", "VIEWER"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const updated = await prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    return NextResponse.json({ membership: updated });
  } catch (error) {
    console.error("Update member role error:", error);
    return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workspaces/[workspaceId]/members/[memberId]
 * Removes a member from the workspace.
 * OWNER and ADMIN can remove members.
 * Cannot remove the OWNER.
 * Members can remove themselves (leave workspace).
 */
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, memberId } = await params;

    const requesterMembership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: session.user.id },
      },
    });

    if (!requesterMembership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const targetMembership = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!targetMembership || targetMembership.workspaceId !== workspaceId) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Cannot remove the workspace OWNER
    if (targetMembership.role === "OWNER") {
      return NextResponse.json(
        { error: "Cannot remove the workspace owner" },
        { status: 403 }
      );
    }

    // Allow self-removal (leaving), otherwise require OWNER or ADMIN
    const isSelf = targetMembership.userId === session.user.id;
    const canRemove = ["OWNER", "ADMIN"].includes(requesterMembership.role);

    if (!isSelf && !canRemove) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.workspaceMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}