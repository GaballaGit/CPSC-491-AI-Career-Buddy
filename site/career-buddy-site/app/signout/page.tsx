"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { getSupabaseClient } from "../../lib/supabase";

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    void getSupabaseClient().auth.signOut().finally(() =>
      router.replace("/signin")
    );
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-sm text-muted">
      Signing out...
    </main>
  );
}
