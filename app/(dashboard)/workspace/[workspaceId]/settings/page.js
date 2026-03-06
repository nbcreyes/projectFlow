import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import WorkspaceSettingsClient from "@/components/workspace/WorkspaceSettingsClient";

export const metadata = { title: "Workspace Settings" };

export default async function WorkspaceSettingsPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { workspaceId } = await params;

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId: session.user.id },
    },
    include: { workspace: true },
  });

  if (!membership) redirect("/onboarding");

  const memberCount = await prisma.workspaceMember.count({
    where: { workspaceId },
  });

  const projectCount = await prisma.project.count({
    where: { workspaceId, isArchived: false },
  });

  return (
    <WorkspaceSettingsClient
      workspace={membership.workspace}
      role={membership.role}
      memberCount={memberCount}
      projectCount={projectCount}
    />
  );
}