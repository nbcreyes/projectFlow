import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import SearchPage from "@/components/search/SearchPage";

export const metadata = { title: "Search" };

/**
 * Search page.
 * Passes the current workspace ID so searches are scoped correctly.
 */
export default async function Search({ searchParams }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const resolvedParams = await searchParams;
  const workspaceId = resolvedParams?.workspaceId;

  // If no workspaceId in URL, get the most recent workspace
  let activeWorkspaceId = workspaceId;
  if (!activeWorkspaceId) {
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
      orderBy: { joinedAt: "desc" },
      select: { workspaceId: true },
    });
    activeWorkspaceId = membership?.workspaceId;
  }

  if (!activeWorkspaceId) redirect("/onboarding");

  return (
    <SearchPage
      workspaceId={activeWorkspaceId}
      userId={session.user.id}
    />
  );
}