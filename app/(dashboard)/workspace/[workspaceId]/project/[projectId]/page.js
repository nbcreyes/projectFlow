import { redirect } from "next/navigation";

/**
 * Default project page.
 * Redirects to the board view.
 */
export default async function ProjectPage({ params }) {
  const { workspaceId, projectId } = await params;
  redirect(`/workspace/${workspaceId}/project/${projectId}/board`);
}