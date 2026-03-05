import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/workspaces/[workspaceId]/members
 * Returns all members of a workspace with their user info.
 */
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await params;

    const requesterMembership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: session.user.id },
      },
    });

    if (!requesterMembership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Get members error:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspaces/[workspaceId]/members
 * Invites a user to the workspace by email.
 * Only OWNER and ADMIN can invite.
 */
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await params;

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

    const body = await request.json();
    const { email, role = "MEMBER" } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const validRoles = ["ADMIN", "MEMBER", "VIEWER"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    const userToInvite = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!userToInvite) {
      return NextResponse.json(
        { error: "No account found with this email address" },
        { status: 404 }
      );
    }

    const existingMembership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: userToInvite.id },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "This user is already a member of this workspace" },
        { status: 409 }
      );
    }

    const membership = await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: userToInvite.id,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(
      { message: "Member added successfully", membership },
      { status: 201 }
    );
  } catch (error) {
    console.error("Invite member error:", error);
    return NextResponse.json(
      { error: "Failed to invite member" },
      { status: 500 }
    );
  }
}