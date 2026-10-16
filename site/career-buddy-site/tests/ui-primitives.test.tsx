import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={href} {...props}>{children}</a>
  ),
}));
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import StateMessage from "../components/ui/StateMessage";

describe("shared UI primitives", () => {
  it("renders a button with its label and default primary styling", () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toHaveClass("bg-foreground");
  });

  it("renders a linked button with the requested destination", () => {
    render(<Button href="/jobs" variant="secondary">Browse jobs</Button>);
    expect(screen.getByRole("link", { name: "Browse jobs" })).toHaveAttribute("href", "/jobs");
    expect(screen.getByRole("link")).toHaveClass("border-line");
  });

  it("passes attributes and children through to Card", () => {
    render(<Card aria-label="Job card" data-testid="job-card">Job details</Card>);
    expect(screen.getByTestId("job-card")).toHaveAttribute("aria-label", "Job card");
    expect(screen.getByText("Job details")).toBeInTheDocument();
  });

  it("renders PageHeader title, optional eyebrow, description, and actions", () => {
    render(<PageHeader title="Jobs" eyebrow="Explore" description="Find your next role" actions={<Button href="/jobs/new">Add job</Button>} />);
    expect(screen.getByRole("heading", { level: 1, name: "Jobs" })).toBeInTheDocument();
    expect(screen.getByText("Explore")).toBeInTheDocument();
    expect(screen.getByText("Find your next role")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add job" })).toHaveAttribute("href", "/jobs/new");
  });

  it("renders a state message and optional action", () => {
    render(<StateMessage title="No jobs" description="Try again later" action={<button>Retry</button>} />);
    expect(screen.getByRole("heading", { name: "No jobs" })).toBeInTheDocument();
    expect(screen.getByText("Try again later")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
