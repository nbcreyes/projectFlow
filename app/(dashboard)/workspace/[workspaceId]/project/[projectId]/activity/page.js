import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ActivityFeed from "@/components/activity/ActivityFeed";

export const metadata = { title: "Activity" };

export default async function ActivityPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { workspaceId, projectId } = await params;

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId: session.user.id },
    },
  });

  if (!membership) redirect("/onboarding");

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true },
  });

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Activity</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Recent activity in {project?.name}
      </p>
      <ActivityFeed
        fetchUrl={`/api/workspaces/${workspaceId}/projects/${projectId}/activity?take=50`}
        showTask={true}
      />
    </div>
  );
}