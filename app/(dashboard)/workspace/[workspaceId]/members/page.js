import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import MembersClient from "@/components/workspace/MembersClient";

export const metadata = { title: "Members" };

export default async function MembersPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { workspaceId } = await params;

  const requesterMembership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId: session.user.id },
    },
    include: { workspace: true },
  });

  if (!requesterMembership) redirect("/onboarding");

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true, createdAt: true },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return (
    <MembersClient
      members={members}
      currentUserId={session.user.id}
      currentUserRole={requesterMembership.role}
      workspaceId={workspaceId}
      workspace={requesterMembership.workspace}
    />
  );
}