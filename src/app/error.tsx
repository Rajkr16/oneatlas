"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="py-20 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-muted">We couldn’t load this page. Check your connection and try again.</p>
      <button onClick={reset} className="mt-4 rounded-md bg-accent px-4 py-2 font-medium text-white dark:text-black">
        Try again
      </button>
    </div>
  );
}
