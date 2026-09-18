"use client";

import { useEffect, useState } from "react";

import {
  getProjects,
  type Project,
} from "../../lib/projects";

function formatStatus(status: Project["status"]) {
  return status === "in_progress"
    ? "In progress"
    : "Completed";
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
    <div className="min-h-screen bg-zinc-50 px-6 py-16 dark:bg-black">
      <main className="mx-auto w-full max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Portfolio Projects
          </h1>

          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Review the projects saved to your portfolio.
          </p>
        </div>

        {isLoading && (
          <div className="rounded-2xl border border-black/[.08] bg-white p-8 text-sm text-zinc-600 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-400">
            Loading projects...
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {errorMessage}
          </div>
        )}

        {!isLoading &&
          !errorMessage &&
          projects.length === 0 && (
            <div className="rounded-2xl border border-black/[.08] bg-white p-8 text-center dark:border-white/[.145] dark:bg-zinc-950">
              <h2 className="text-lg font-medium text-black dark:text-zinc-50">
                No projects yet
              </h2>

              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
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
                  className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
                      {project.title}
                    </h2>

                    <span className="shrink-0 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {formatStatus(project.status)}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    {project.description}
                  </p>

                  <div className="mt-5">
                    <h3 className="text-sm font-medium text-black dark:text-zinc-50">
                      Skills
                    </h3>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {project.skills_demonstrated.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {project.project_urls.length > 0 && (
                    <div className="mt-5">
                      <h3 className="text-sm font-medium text-black dark:text-zinc-50">
                        Links
                      </h3>

                      <ul className="mt-2 flex flex-col gap-1">
                        {project.project_urls.map((url) => (
                          <li key={url}>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="break-all text-sm text-blue-600 underline dark:text-blue-400"
                            >
                              {url}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="mt-6 text-xs text-zinc-500">
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