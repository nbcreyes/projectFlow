/**
 * Board view placeholder - built in Step 7.
 */
export default async function BoardPage({ params }) {
  const { projectId } = await params;
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-muted-foreground">Kanban board coming in Step 7</p>
    </div>
  );
}