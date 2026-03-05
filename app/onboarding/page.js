import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import OnboardingForm from "@/components/workspace/OnboardingForm";

export const metadata = {
  title: "Set up your workspace",
};

/**
 * Onboarding page.
 * If the user already has a workspace, redirect to it.
 * If not, show the workspace creation form.
 */
export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
    orderBy: { joinedAt: "desc" },
  });

  if (membership) {
    redirect(`/workspace/${membership.workspace.id}`);
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <OnboardingForm user={session.user} />
    </div>
  );
}
