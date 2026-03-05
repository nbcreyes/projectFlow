import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import OnboardingForm from "@/components/workspace/OnboardingForm";

export const metadata = {
  title: "Create workspace",
};

/**
 * Onboarding / new workspace page.
 * searchParams must be awaited in Next.js 16.
 */
export default async function OnboardingPage({ searchParams }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Await searchParams as required by Next.js 16
  const resolvedParams = await searchParams;
  const isNewUser = resolvedParams?.new === "true";

  if (!isNewUser) {
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
      include: { workspace: true },
      orderBy: { joinedAt: "desc" },
    });

    if (membership) {
      redirect(`/workspace/${membership.workspace.id}`);
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <OnboardingForm user={session.user} />
    </div>
  );
}
