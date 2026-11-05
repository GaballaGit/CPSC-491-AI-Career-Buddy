// C40CS-67: signed-out users are redirected away from Career Profile pages.
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ProtectedRoute from "../components/ProtectedRoute";
import DashboardLayout from "../app/dashboard/layout";
import OnboardingLayout from "../app/onboarding/layout";
import ProfileLayout from "../app/profile/layout";
import ProjectsLayout from "../app/projects/layout";
import RoadmapLayout from "../app/roadmap/layout";

const { replace, getSession, unsubscribe, pathname } = vi.hoisted(() => ({
  replace: vi.fn(),
  getSession: vi.fn(),
  unsubscribe: vi.fn(),
  pathname: { current: "/profile" },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => pathname.current,
}));

vi.mock("../lib/supabase", () => ({
  getSupabaseClient: () => ({
    auth: {
      getSession,
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe } } }),
    },
  }),
}));

function signedOut() {
  getSession.mockResolvedValue({ data: { session: null }, error: null });
}

function signedIn() {
  getSession.mockResolvedValue({
    data: { session: { user: { id: "user-1" } } },
    error: null,
  });
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const layouts: Array<[string, (props: { children: ReactNode }) => ReactNode]> = [
  ["/profile", ProfileLayout],
  ["/profile/edit", ProfileLayout],
  ["/onboarding", OnboardingLayout],
  ["/roadmap", RoadmapLayout],
  ["/dashboard", DashboardLayout],
  ["/projects", ProjectsLayout],
];

describe("protected route layouts", () => {
  it.each(layouts)(
    "redirects a signed-out user from %s to sign in",
    async (path, Layout) => {
      pathname.current = path;
      signedOut();

      render(<Layout><p>Private content</p></Layout>);

      await waitFor(() =>
        expect(replace).toHaveBeenCalledWith(
          `/signin?callbackUrl=${encodeURIComponent(path)}`,
        ),
      );
      expect(screen.queryByText("Private content")).not.toBeInTheDocument();
    },
  );

  it.each(layouts)("shows %s to a signed-in user", async (path, Layout) => {
    pathname.current = path;
    signedIn();

    render(<Layout><p>Private content</p></Layout>);

    expect(await screen.findByText("Private content")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});

describe("ProtectedRoute", () => {
  it("shows a session check instead of the page while loading", () => {
    pathname.current = "/profile";
    getSession.mockReturnValue(new Promise(() => {}));

    render(<ProtectedRoute><p>Private content</p></ProtectedRoute>);

    expect(screen.getByText("Checking your session...")).toBeInTheDocument();
    expect(screen.queryByText("Private content")).not.toBeInTheDocument();
  });

  it("redirects when the session lookup returns an error", async () => {
    pathname.current = "/onboarding";
    getSession.mockResolvedValue({
      data: { session: null },
      error: new Error("session lookup failed"),
    });

    render(<ProtectedRoute><p>Private content</p></ProtectedRoute>);

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/signin?callbackUrl=%2Fonboarding"),
    );
    expect(screen.queryByText("Private content")).not.toBeInTheDocument();
  });
});
