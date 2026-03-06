import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage({ params }) {
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

  return (
    <AnalyticsDashboard
      workspaceId={workspaceId}
      workspaceName={membership.workspace.name}
      userRole={membership.role}
    />
  );
}