/**
 * List view placeholder - built in Step 8.
 */
export default async function ListPage({ params }) {
  const { projectId } = await params;
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-muted-foreground">List view coming in Step 8</p>
    </div>
  );
}