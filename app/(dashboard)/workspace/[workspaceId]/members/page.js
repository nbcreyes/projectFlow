import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export const metadata = {
  title: "Members",
};

/**
 * Members page placeholder.
 * params must be awaited in Next.js 16.
 */
export default async function MembersPage({ params }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const { workspaceId } = await params;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold tracking-tight">Members</h1>
      <p className="text-muted-foreground mt-1">
        Full member management coming in Step 5.
      </p>
    </div>
  );
}