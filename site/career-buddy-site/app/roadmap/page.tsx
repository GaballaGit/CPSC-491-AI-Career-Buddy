import Link from "next/link";

/**
 * Sprint 1 skeleton only — no roadmap generation logic yet (KAN-8).
 * Once skill-gap analysis exists, replace this placeholder body with the
 * generated roadmap while keeping the route and layout in place.
 */
export default function RoadmapPage() {
  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="w-full max-w-xl rounded-2xl border border-black/[.08] bg-white p-8 text-center dark:border-white/[.145] dark:bg-zinc-950">
        <h1 className="mb-3 text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Your Roadmap
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Roadmap coming soon. Once your Career Profile and skill gaps are in
          place, a personalized learning roadmap will appear here.
        </p>
        <Link
          href="/profile"
          className="mt-6 inline-block rounded-full border border-black/[.08] px-5 py-2.5 text-sm font-medium text-black dark:border-white/[.145] dark:text-zinc-50"
        >
          Back to Career Profile
        </Link>
      </div>
    </div>
  );
}
