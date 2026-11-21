import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-2xl font-semibold">We couldn’t find that page</h1>
      <p className="mt-2 text-muted">The model, lab or provider may have been renamed or removed.</p>
      <Link href="/models" className="mt-4 inline-block text-accent hover:underline">Browse all models</Link>
    </div>
  );
}
