"use client";

import { FormEvent, useState } from "react";

import {
  createProject,
  type ProjectStatus,
} from "../../../lib/projects";

export default function AddProjectPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [urls, setUrls] = useState("");
  const [status, setStatus] =
    useState<ProjectStatus>("in_progress");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const skillsDemonstrated = skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    const projectUrls = urls
      .split(",")
      .map((url) => url.trim())
      .filter(Boolean);

    try {
      setIsSubmitting(true);

      const project = await createProject({
        title,
        description,
        skills_demonstrated: skillsDemonstrated,
        project_urls: projectUrls,
        status,
      });

      setSuccessMessage(
        `Project "${project.title}" was created successfully.`,
      );

      setTitle("");
      setDescription("");
      setSkills("");
      setUrls("");
      setStatus("in_progress");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create project.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <main className="w-full max-w-2xl">
        <div className="rounded-2xl border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950">
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Add Project
          </h1>

          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Add a portfolio project and the skills you demonstrated.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 flex flex-col gap-6"
          >
            <div className="flex flex-col gap-2">
              <label
                htmlFor="title"
                className="text-sm font-medium text-black dark:text-zinc-50"
              >
                Project title
              </label>

              <input
                id="title"
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                minLength={3}
                maxLength={100}
                required
                className="rounded-lg border border-black/[.12] bg-white px-3 py-2 text-black outline-none focus:border-black dark:border-white/[.2] dark:bg-zinc-900 dark:text-zinc-50"
                placeholder="AI Career Coach"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="description"
                className="text-sm font-medium text-black dark:text-zinc-50"
              >
                Description
              </label>

              <textarea
                id="description"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                required
                rows={5}
                className="rounded-lg border border-black/[.12] bg-white px-3 py-2 text-black outline-none focus:border-black dark:border-white/[.2] dark:bg-zinc-900 dark:text-zinc-50"
                placeholder="Describe what you built and what the project does."
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="skills"
                className="text-sm font-medium text-black dark:text-zinc-50"
              >
                Skills demonstrated
              </label>

              <input
                id="skills"
                type="text"
                value={skills}
                onChange={(event) =>
                  setSkills(event.target.value)
                }
                required
                className="rounded-lg border border-black/[.12] bg-white px-3 py-2 text-black outline-none focus:border-black dark:border-white/[.2] dark:bg-zinc-900 dark:text-zinc-50"
                placeholder="TypeScript, React, PostgreSQL"
              />

              <p className="text-xs text-zinc-500">
                Separate skills with commas.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="urls"
                className="text-sm font-medium text-black dark:text-zinc-50"
              >
                Project URLs
              </label>

              <input
                id="urls"
                type="text"
                value={urls}
                onChange={(event) =>
                  setUrls(event.target.value)
                }
                className="rounded-lg border border-black/[.12] bg-white px-3 py-2 text-black outline-none focus:border-black dark:border-white/[.2] dark:bg-zinc-900 dark:text-zinc-50"
                placeholder="https://github.com/..., https://example.com"
              />

              <p className="text-xs text-zinc-500">
                Optional. Separate multiple URLs with commas.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="status"
                className="text-sm font-medium text-black dark:text-zinc-50"
              >
                Status
              </label>

              <select
                id="status"
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as ProjectStatus,
                  )
                }
                className="rounded-lg border border-black/[.12] bg-white px-3 py-2 text-black outline-none focus:border-black dark:border-white/[.2] dark:bg-zinc-900 dark:text-zinc-50"
              >
                <option value="in_progress">
                  In progress
                </option>
                <option value="completed">
                  Completed
                </option>
              </select>
            </div>

            {errorMessage && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {errorMessage}
              </p>
            )}

            {successMessage && (
              <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-300">
                {successMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? "Creating project..."
                : "Add project"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}