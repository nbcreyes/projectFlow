/**
 * Layout for all auth pages (login, register).
 * Centers content on the screen with a clean background.
 */
export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      {children}
    </div>
  );
}
