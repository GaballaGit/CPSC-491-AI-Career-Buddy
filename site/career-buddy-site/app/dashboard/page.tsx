import Link from "next/link";

const dashboardSections = [
  {
    title: "Career Profile",
    description:
      "Review your target career, experience level, skills, and learning preferences.",
    href: "/profile",
    action: "View profile",
  },
  {
    title: "Portfolio Projects",
    description:
      "Review the projects in your portfolio and the skills they demonstrate.",
    href: "/projects",
    action: "View projects",
  },
  {
    title: "Add Project",
    description:
      "Add another project to your portfolio and document the skills you used.",
    href: "/projects/new",
    action: "Add project",
  },
  {
    title: "Resume",
    description:
      "Resume analysis and career-readiness feedback will appear here.",
    href: "#",
    action: "Coming soon",
    disabled: true,
  },
  {
    title: "Jobs",
    description:
      "Job matching and saved job opportunities will appear here.",
    href: "#",
    action: "Coming soon",
    disabled: true,
  },
  {
    title: "Roadmap",
    description:
      "Your personalized career roadmap and progress will appear here.",
    href: "#",
    action: "Coming soon",
    disabled: true,
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-12 dark:bg-black">
      <main className="mx-auto w-full max-w-6xl">
        <section className="mb-10">
          <p className="text-sm font-medium text-zinc-500">
            Career Buddy
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Dashboard
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Manage your career profile, portfolio projects, and
            career-readiness tools from one place.
          </p>
        </section>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {dashboardSections.map((section) => (
            <article
              key={section.title}
              className="flex min-h-56 flex-col rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950"
            >
              <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
                {section.title}
              </h2>

              <p className="mt-3 flex-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {section.description}
              </p>

              {section.disabled ? (
                <span className="mt-6 inline-flex w-fit rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {section.action}
                </span>
              ) : (
                <Link
                  href={section.href}
                  className="mt-6 inline-flex w-fit rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80"
                >
                  {section.action}
                </Link>
              )}
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
            Quick start
          </h2>

          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Continue building your career profile or add another
            portfolio project.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/profile"
              className="rounded-full border border-black/[.1] px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-100 dark:border-white/[.15] dark:text-zinc-50 dark:hover:bg-zinc-900"
            >
              View profile
            </Link>

            <Link
              href="/projects"
              className="rounded-full border border-black/[.1] px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-100 dark:border-white/[.15] dark:text-zinc-50 dark:hover:bg-zinc-900"
            >
              View portfolio
            </Link>

            <Link
              href="/projects/new"
              className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80"
            >
              Add project
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}