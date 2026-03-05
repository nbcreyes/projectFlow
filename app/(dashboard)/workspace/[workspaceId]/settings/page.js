import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import WorkspaceSettings from "@/components/workspace/WorkspaceSettings";

export const metadata = {
  title: "Workspace settings",
};

/**
 * Workspace settings page.
 * params must be awaited in Next.js 16.
 */
export default async function WorkspaceSettingsPage({ params }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const { workspaceId } = await params;

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: session.user.id,
      },
    },
    include: { workspace: true },
  });

  if (!membership) {
    redirect("/onboarding");
  }

  const canEdit = ["OWNER", "ADMIN"].includes(membership.role);

  return (
    <WorkspaceSettings
      workspace={membership.workspace}
      role={membership.role}
      canEdit={canEdit}
    />
  );
}