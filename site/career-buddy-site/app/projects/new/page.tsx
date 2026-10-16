"use client";

import { FormEvent, useState } from "react";

import { createProject, type ProjectStatus } from "../../../lib/projects";

export default function AddProjectPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [urls, setUrls] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("in_progress");

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
        error instanceof Error ? error.message : "Unable to create project.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen justify-center bg-background px-6 py-16">
      <main className="w-full max-w-2xl">
        <div className="rounded-2xl border border-line bg-card p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Add Project
          </h1>

          <p className="mt-2 text-sm text-muted">
            Add a portfolio project and the skills you demonstrated.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 flex flex-col gap-6"
          >
            <div className="flex flex-col gap-2">
              <label
                htmlFor="title"
                className="text-sm font-medium text-foreground"
              >
                Project title
              </label>

              <input
                id="title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                minLength={3}
                maxLength={100}
                required
                className="rounded-lg border border-line bg-card px-3 py-2 text-foreground outline-none focus:border-accent"
                placeholder="AI Career Coach"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="description"
                className="text-sm font-medium text-foreground"
              >
                Description
              </label>

              <textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
                rows={5}
                className="rounded-lg border border-line bg-card px-3 py-2 text-foreground outline-none focus:border-accent"
                placeholder="Describe what you built and what the project does."
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="skills"
                className="text-sm font-medium text-foreground"
              >
                Skills demonstrated
              </label>

              <input
                id="skills"
                type="text"
                value={skills}
                onChange={(event) => setSkills(event.target.value)}
                required
                className="rounded-lg border border-line bg-card px-3 py-2 text-foreground outline-none focus:border-accent"
                placeholder="TypeScript, React, PostgreSQL"
              />

              <p className="text-xs text-muted">
                Separate skills with commas.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="urls"
                className="text-sm font-medium text-foreground"
              >
                Project URLs
              </label>

              <input
                id="urls"
                type="text"
                value={urls}
                onChange={(event) => setUrls(event.target.value)}
                className="rounded-lg border border-line bg-card px-3 py-2 text-foreground outline-none focus:border-accent"
                placeholder="https://github.com/..., https://example.com"
              />

              <p className="text-xs text-muted">
                Optional. Separate multiple URLs with commas.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="status"
                className="text-sm font-medium text-foreground"
              >
                Status
              </label>

              <select
                id="status"
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as ProjectStatus,
                  )}
                className="rounded-lg border border-line bg-card px-3 py-2 text-foreground outline-none focus:border-accent"
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
              <p className="rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">
                {errorMessage}
              </p>
            )}

            {successMessage && (
              <p className="rounded-lg bg-success-soft px-4 py-3 text-sm text-success">
                {successMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Creating project..." : "Add project"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
