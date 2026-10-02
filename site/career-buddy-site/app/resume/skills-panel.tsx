import type { Skill } from "./types";

type Props =
  | { state: "loading" }
  | { state: "error"; message: string; onRetry: () => void }
  | { state: "ready"; skills: Skill[]; filename: string | null };

// Skills Panel - Loading, error, empty, and chip list states
export default function SkillsPanel(props: Props) {
  return (
    <section className="mt-12" aria-live="polite">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
        Detected skills
      </h2>

      {props.state === "loading" && (
        <div className="mt-4 flex flex-wrap gap-2" aria-busy="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="h-8 w-20 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800"
            />
          ))}
          <span className="sr-only">Loading skills…</span>
        </div>
      )}

      {props.state === "error" && (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-red-300 bg-red-50 px-5 py-4 dark:border-red-900 dark:bg-red-950/50">
          <p className="text-sm text-red-700 dark:text-red-300">
            {props.message}
          </p>
          <button
            type="button"
            onClick={props.onRetry}
            className="shrink-0 rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-white dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
          >
            Try again
          </button>
        </div>
      )}

      {props.state === "ready" && props.skills.length === 0 && (
        <div className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-white px-5 py-6 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          {props.filename
            ? (
              <>
                No skills found in{" "}
                <span className="font-mono">{props.filename}</span>. Make sure
                your resume lists tools and languages by name, for example in a
                Skills section, then upload it again.
              </>
            )
            : <>Upload your resume above to see the skills we find in it.</>}
        </div>
      )}

      {props.state === "ready" && props.skills.length > 0 && (
        <>
          <ul className="mt-4 flex flex-wrap gap-2">
            {props.skills.map((skill) => (
              <li
                key={skill.key}
                className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-300"
              >
                {skill.name}
              </li>
            ))}
          </ul>
          {props.filename && (
            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              {props.skills.length} skills from{" "}
              <span className="font-mono">{props.filename}</span>
            </p>
          )}
        </>
      )}
    </section>
  );
}
