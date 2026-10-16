import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import JobDetail from "../components/job-detail";
import type { Job, JobMatchStatus } from "../lib/jobs";

const { getJob } = vi.hoisted(() => ({ getJob: vi.fn() }));
vi.mock("../lib/jobs", () => ({ getJob }));

const job: Job = {
  id: "job-1",
  title: "Frontend Engineer",
  description: "Build accessible products.",
  category: "Engineering",
  required_skills: [{ name: "React" }, { name: "TypeScript" }],
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
};

function renderResult(matchStatus: JobMatchStatus, value: Job = job) {
  getJob.mockResolvedValue({ job: value, matchStatus });
  return render(<JobDetail id="job-1" />);
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("JobDetail", () => {
  it("shows loading while the job is being fetched", () => {
    getJob.mockReturnValue(new Promise(() => {}));
    render(<JobDetail id="job-1" />);
    expect(screen.getByText("Loading role…")).toBeInTheDocument();
  });

  it("shows an error when loading fails", async () => {
    getJob.mockRejectedValue(new Error("Unable to load job."));
    render(<JobDetail id="job-1" />);
    expect(await screen.findByText("Unable to load job.")).toBeInTheDocument();
  });

  it("shows the sign-in prompt for signed-out users", async () => {
    renderResult("signed_out");
    expect(await screen.findByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/signin");
  });

  it("prompts users without a profile to complete onboarding", async () => {
    renderResult("profile_missing");
    expect(await screen.findByRole("link", { name: "Complete onboarding" })).toHaveAttribute("href", "/onboarding");
  });

  it("renders matched and missing skills with the match score", async () => {
    renderResult("available", {
      ...job,
      match: { score: 50, matched: [{ name: "React" }], missing: [{ name: "TypeScript" }] },
    });
    expect(await screen.findByText("50% match")).toBeInTheDocument();
    expect(screen.getByText("Matched skills")).toBeInTheDocument();
    expect(screen.getByText("Missing skills")).toBeInTheDocument();
    expect(screen.getAllByText("React").length).toBeGreaterThan(0);
    expect(screen.getAllByText("TypeScript").length).toBeGreaterThan(0);
  });

  it("renders empty match lists and optional match data safely", async () => {
    renderResult("available", {
      ...job,
      required_skills: [],
      match: { score: 0, matched: [], missing: [] },
    });
    expect(await screen.findByText("No required skills matched yet.")).toBeInTheDocument();
    expect(screen.getByText("You have all listed required skills.")).toBeInTheDocument();
  });

  it("shows the required skills on the job detail", async () => {
    renderResult("signed_out");
    await waitFor(() => expect(screen.getByRole("heading", { name: "Frontend Engineer" })).toBeInTheDocument());
    expect(screen.getByText("Engineering")).toBeInTheDocument();
    expect(screen.getByText("Build accessible products.")).toBeInTheDocument();
  });
});
