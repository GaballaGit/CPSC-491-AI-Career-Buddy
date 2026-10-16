import type { Skill } from "../../lib/resume";

type Props =
  | { state: "loading" }
  | { state: "error"; message: string; onRetry: () => void }
  | { state: "ready"; skills: Skill[]; filename: string | null };

// Skills Panel - Loading, error, empty, and chip list states
export default function SkillsPanel(props: Props) {
  return (
    <section className="mt-12" aria-live="polite">
      <h2 className="text-lg font-semibold text-foreground">
        Detected skills
      </h2>

      {props.state === "loading" && (
        <div className="mt-4 flex flex-wrap gap-2" aria-busy="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="h-8 w-20 animate-pulse rounded-full bg-line"
            />
          ))}
          <span className="sr-only">Loading skills…</span>
        </div>
      )}

      {props.state === "error" && (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-danger-line bg-danger-soft px-5 py-4">
          <p className="text-sm text-danger">
            {props.message}
          </p>
          <button
            type="button"
            onClick={props.onRetry}
            className="shrink-0 rounded-full border border-danger-line px-3 py-1.5 text-xs font-semibold text-danger hover:bg-card"
          >
            Try again
          </button>
        </div>
      )}

      {props.state === "ready" && props.skills.length === 0 && (
        <div className="mt-4 rounded-xl border border-dashed border-line bg-card px-5 py-6 text-sm text-muted">
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
                className="rounded-full border border-line bg-accent-soft px-3 py-1.5 text-sm font-medium text-accent"
              >
                {skill.name}
              </li>
            ))}
          </ul>
          {props.filename && (
            <p className="mt-3 text-xs text-muted">
              {props.skills.length} skills from{" "}
              <span className="font-mono">{props.filename}</span>
            </p>
          )}
        </>
      )}
    </section>
  );
}
