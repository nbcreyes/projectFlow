import Link from "next/link";

/**
 * Temporary root page.
 * Will be replaced with a proper marketing landing page in the UI polish step.
 */
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">ProjectFlow</h1>
        <p className="text-muted-foreground text-lg">
          Project management for modern teams.
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          Create account
        </Link>
      </div>
    </main>
  );
}
