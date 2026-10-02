"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

import { getSupabaseClient } from "../lib/supabase";
import Button from "./ui/Button";

interface AppShellProps {
  children: ReactNode;
}

const navigation = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Profile", href: "/profile" },
  { label: "Resume", href: "/resume" },
  { label: "Jobs", href: "/" },
  { label: "Portfolio", href: "/projects" },
  { label: "Roadmap", href: "/roadmap" },
];

function isCurrentSection(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/" || pathname.startsWith("/jobs/");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let active = true;

    try {
      const supabase = getSupabaseClient();

      void supabase.auth.getSession().then(({ data }) => {
        if (!active) return;

        setSignedIn(Boolean(data.session));
        setAuthReady(true);
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!active) return;

        setSignedIn(Boolean(session));
        setAuthReady(true);
      });

      return () => {
        active = false;
        subscription.unsubscribe();
      };
    } catch {
      queueMicrotask(() => {
        if (active) {
          setAuthReady(true);
        }
      });

      return () => {
        active = false;
      };
    }
  }, []);

  async function handleSignOut() {
    try {
      await getSupabaseClient().auth.signOut();
    } finally {
      setSignedIn(false);
      router.push("/signin");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight text-foreground"
            >
              Career Buddy
            </Link>

            <div className="lg:hidden">
              {authReady &&
                (signedIn ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleSignOut}
                  >
                    Sign out
                  </Button>
                ) : (
                  <Button href="/signin" variant="secondary">
                    Sign in
                  </Button>
                ))}
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-4">
            <nav
              aria-label="Main navigation"
              className="flex min-w-0 flex-1 gap-1 overflow-x-auto"
            >
              {navigation.map((item) => {
                const current = isCurrentSection(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    className={`shrink-0 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                      current
                        ? "bg-foreground text-background"
                        : "text-muted hover:bg-background hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="hidden shrink-0 lg:block">
              {authReady &&
                (signedIn ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleSignOut}
                  >
                    Sign out
                  </Button>
                ) : (
                  <Button href="/signin" variant="secondary">
                    Sign in
                  </Button>
                ))}
            </div>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
