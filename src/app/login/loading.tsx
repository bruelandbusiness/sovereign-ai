export default function LoginLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background" role="status" aria-label="Loading login">
      {/* Logo */}
      <div className="skeleton mb-8 h-10 w-40" />

      {/* Login card */}
      <div className="w-full max-w-md rounded-xl border border-border/50 bg-card p-8">
        <div className="skeleton mx-auto mb-2 h-7 w-32" />
        <div className="skeleton mx-auto mb-8 h-4 w-48" />

        {/* OAuth button */}
        <div className="skeleton mb-6 h-11 w-full rounded-lg" />

        {/* Divider */}
        <div className="skeleton mx-auto mb-6 h-4 w-8" />

        {/* Email input */}
        <div className="skeleton mb-2 h-4 w-16" />
        <div className="skeleton mb-6 h-11 w-full rounded-lg" />

        {/* Submit button */}
        <div className="skeleton h-11 w-full rounded-lg" />
      </div>
    </div>
  );
}
