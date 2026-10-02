"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

import { getSupabaseClient } from "../lib/supabase";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseClient();

    async function checkSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      if (error || !data.session) {
        const callbackUrl = encodeURIComponent(pathname || "/dashboard");

        router.replace(`/signin?callbackUrl=${callbackUrl}`);
        return;
      }

      setCheckingSession(false);
    }

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) {
        return;
      }

      if (!session) {
        const callbackUrl = encodeURIComponent(pathname || "/dashboard");

        router.replace(`/signin?callbackUrl=${callbackUrl}`);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Checking your session...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
