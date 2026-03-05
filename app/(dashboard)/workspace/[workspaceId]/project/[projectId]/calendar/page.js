/**
 * Calendar view placeholder - built in Step 9.
 */
export default async function CalendarPage({ params }) {
  const { projectId } = await params;
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-muted-foreground">Calendar view coming in Step 9</p>
    </div>
  );
}