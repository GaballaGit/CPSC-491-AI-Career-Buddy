"use client";

import { useEffect, useState } from "react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import { getCareerProfile, type CareerProfile } from "../../lib/careerProfile";
import { getProjects } from "../../lib/projects";
import { EXPERIENCE_LEVELS } from "../onboarding/options";
import type { ExperienceLevel } from "../onboarding/types";

function experienceLabel(value: ExperienceLevel): string {
  return (
    EXPERIENCE_LEVELS.find((level) => level.value === value)?.label ?? "Not set"
  );
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileUnavailable, setProfileUnavailable] = useState(false);

  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsUnavailable, setProjectsUnavailable] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        setProfile(await getCareerProfile());
      } catch {
        setProfileUnavailable(true);
      } finally {
        setProfileLoading(false);
      }
    }

    void loadProfile();
  }, []);

  useEffect(() => {
    async function loadProjectCount() {
      try {
        const projects = await getProjects();
        setProjectCount(projects.length);
      } catch {
        setProjectsUnavailable(true);
      } finally {
        setProjectsLoading(false);
      }
    }

    void loadProjectCount();
  }, []);

  const profileStatus = profileLoading
    ? "Loading..."
    : profileUnavailable
      ? "Unavailable"
      : "Not set";

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <PageHeader
        eyebrow="Career Buddy"
        title="Dashboard"
        description="Manage your career profile, portfolio projects, and career-readiness tools from one place."
      />

      <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <p className="text-sm text-muted">Target career</p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {profile?.target_career ?? profileStatus}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-muted">Experience level</p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {profile
              ? experienceLabel(profile.experience_level)
              : profileStatus}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-muted">Profile skills</p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {profile
              ? profile.skills.length
              : profileLoading || profileUnavailable
                ? profileStatus
                : 0}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-muted">Portfolio projects</p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {projectsLoading
              ? "Loading..."
              : projectsUnavailable
                ? "Unavailable"
                : (projectCount ?? 0)}
          </p>
        </Card>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="flex min-h-56 flex-col">
          <h2 className="text-lg font-semibold text-foreground">
            Career Profile
          </h2>

          {profile ? (
            <div className="mt-3 flex-1 text-sm leading-6 text-muted">
              <p>
                Target:{" "}
                <span className="font-medium text-foreground">
                  {profile.target_career}
                </span>
              </p>

              <p>
                Experience:{" "}
                <span className="font-medium text-foreground">
                  {experienceLabel(profile.experience_level)}
                </span>
              </p>

              <p>
                Skills:{" "}
                <span className="font-medium text-foreground">
                  {profile.skills.length}
                </span>
              </p>
            </div>
          ) : (
            <p className="mt-3 flex-1 text-sm leading-6 text-muted">
              {profileLoading
                ? "Loading your career profile..."
                : profileUnavailable
                  ? "Career profile is currently unavailable."
                  : "Complete onboarding to create your career profile."}
            </p>
          )}

          <Button
            href={profile ? "/profile" : "/onboarding"}
            className="mt-6 w-fit"
          >
            {profile ? "View profile" : "Start onboarding"}
          </Button>
        </Card>

        <Card className="flex min-h-56 flex-col">
          <h2 className="text-lg font-semibold text-foreground">
            Portfolio Projects
          </h2>

          <div className="mt-3 flex-1 text-sm leading-6 text-muted">
            {projectsLoading ? (
              <p>Loading portfolio data...</p>
            ) : projectsUnavailable ? (
              <p>Project data is currently unavailable.</p>
            ) : (
              <p>
                You have{" "}
                <span className="font-medium text-foreground">
                  {projectCount ?? 0}
                </span>{" "}
                saved {(projectCount ?? 0) === 1 ? "project" : "projects"} in
                your portfolio.
              </p>
            )}
          </div>

          <Button href="/projects" className="mt-6 w-fit">
            View projects
          </Button>
        </Card>

        <Card className="flex min-h-56 flex-col">
          <h2 className="text-lg font-semibold text-foreground">Add Project</h2>

          <p className="mt-3 flex-1 text-sm leading-6 text-muted">
            Add another project to your portfolio and document the skills you
            used.
          </p>

          <Button href="/projects/new" className="mt-6 w-fit">
            Add project
          </Button>
        </Card>

        <Card className="flex min-h-56 flex-col">
          <h2 className="text-lg font-semibold text-foreground">Resume</h2>

          <p className="mt-3 flex-1 text-sm leading-6 text-muted">
            Resume analysis and career-readiness feedback will appear here.
          </p>

          <span className="mt-6 inline-flex w-fit rounded-full bg-background px-4 py-2 text-sm font-medium text-muted">
            Coming soon
          </span>
        </Card>

        <Card className="flex min-h-56 flex-col">
          <h2 className="text-lg font-semibold text-foreground">Jobs</h2>

          <p className="mt-3 flex-1 text-sm leading-6 text-muted">
            Job matching and saved job opportunities will appear here.
          </p>

          <span className="mt-6 inline-flex w-fit rounded-full bg-background px-4 py-2 text-sm font-medium text-muted">
            Coming soon
          </span>
        </Card>

        <Card className="flex min-h-56 flex-col">
          <h2 className="text-lg font-semibold text-foreground">Roadmap</h2>

          <p className="mt-3 flex-1 text-sm leading-6 text-muted">
            Your personalized career roadmap and progress will appear here.
          </p>

          <span className="mt-6 inline-flex w-fit rounded-full bg-background px-4 py-2 text-sm font-medium text-muted">
            Coming soon
          </span>
        </Card>
      </section>

      <Card className="mt-10">
        <h2 className="text-lg font-semibold text-foreground">Quick start</h2>

        <p className="mt-2 text-sm text-muted">
          Continue building your career profile or add another portfolio
          project.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button href="/profile" variant="secondary">
            View profile
          </Button>

          <Button href="/projects" variant="secondary">
            View portfolio
          </Button>

          <Button href="/projects/new">Add project</Button>
        </div>
      </Card>
    </main>
  );
}
