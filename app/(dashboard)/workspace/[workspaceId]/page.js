import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function WorkspacePage({ params }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Workspace</h1>
        <p className="text-muted-foreground">
          Workspace {params.workspaceId} - full UI coming in Step 4
        </p>
      </div>
    </div>
  );
}