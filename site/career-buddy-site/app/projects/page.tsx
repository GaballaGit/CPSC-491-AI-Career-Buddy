"use client";

import { useEffect, useState } from "react";

import { getProjects, type Project } from "../../lib/projects";

function formatStatus(status: Project["status"]) {
  return status === "in_progress" ? "In progress" : "Completed";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadProjects() {
      try {
        const result = await getProjects();
        setProjects(result);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to retrieve projects.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadProjects();
  }, []);

  return (
    <div className="min-h-screen bg-background px-6 py-16">
      <main className="mx-auto w-full max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Portfolio Projects
          </h1>

          <p className="mt-2 text-sm text-muted">
            Review the projects saved to your portfolio.
          </p>
        </div>

        {isLoading && (
          <div className="rounded-2xl border border-line bg-card p-8 text-sm text-muted">
            Loading projects...
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="rounded-2xl border border-danger-line bg-danger-soft p-6 text-sm text-danger">
            {errorMessage}
          </div>
        )}

        {!isLoading &&
          !errorMessage &&
          projects.length === 0 && (
          <div className="rounded-2xl border border-line bg-card p-8 text-center">
            <h2 className="text-lg font-medium text-foreground">
              No projects yet
            </h2>

            <p className="mt-2 text-sm text-muted">
              Projects you add to your portfolio will appear here.
            </p>
          </div>
        )}

        {!isLoading &&
          !errorMessage &&
          projects.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2">
            {projects.map((project) => (
              <article
                key={project.id}
                className="rounded-2xl border border-line bg-card p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-xl font-semibold text-foreground">
                    {project.title}
                  </h2>

                  <span className="shrink-0 rounded-full bg-background px-3 py-1 text-xs font-medium text-muted">
                    {formatStatus(project.status)}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-6 text-muted">
                  {project.description}
                </p>

                <div className="mt-5">
                  <h3 className="text-sm font-medium text-foreground">
                    Skills
                  </h3>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {project.skills_demonstrated.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-accent-soft px-3 py-1 text-xs text-accent"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {project.project_urls.length > 0 && (
                  <div className="mt-5">
                    <h3 className="text-sm font-medium text-foreground">
                      Links
                    </h3>

                    <ul className="mt-2 flex flex-col gap-1">
                      {project.project_urls.map((url) => (
                        <li key={url}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="break-all text-sm text-accent underline"
                          >
                            {url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="mt-6 text-xs text-muted">
                  Updated {formatDate(project.updated_at)}
                </p>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
