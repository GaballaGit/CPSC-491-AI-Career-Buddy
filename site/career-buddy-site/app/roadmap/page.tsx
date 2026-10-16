import Link from "next/link";

/**
 * Sprint 1 skeleton only — no roadmap generation logic yet (KAN-8).
 * Once skill-gap analysis exists, replace this placeholder body with the
 * generated roadmap while keeping the route and layout in place.
 */
export default function RoadmapPage() {
  return (
    <div className="flex flex-1 flex-col items-center bg-background px-6 py-16">
      <div className="w-full max-w-xl rounded-2xl border border-line bg-card p-8 text-center">
        <h1 className="mb-3 text-2xl font-semibold tracking-tight text-foreground">
          Your Roadmap
        </h1>
        <p className="text-muted">
          Roadmap coming soon. Once your Career Profile and skill gaps are in
          place, a personalized learning roadmap will appear here.
        </p>
        <Link
          href="/profile"
          className="mt-6 inline-block rounded-full border border-line px-5 py-2.5 text-sm font-medium text-foreground"
        >
          Back to Career Profile
        </Link>
      </div>
    </div>
  );
}
