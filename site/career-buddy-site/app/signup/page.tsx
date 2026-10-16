"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { getSupabaseClient } from "../../lib/supabase";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    const { data, error } = await getSupabaseClient().auth.signUp({
      email,
      password,
      options: {
        data: name.trim() ? { name: name.trim() } : undefined,
      },
    });

    setIsSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data.session) {
      router.push("/onboarding");
      return;
    }

    setMessage("Check your email to confirm your account, then sign in.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-line bg-card p-8"
      >
        <h1 className="text-2xl font-semibold text-foreground">
          Create account
        </h1>
        <p className="mt-2 text-sm text-muted">
          Supabase Auth stores your account and session securely.
        </p>

        <label className="mt-6 block text-sm font-medium text-foreground">
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-lg border border-line bg-card px-3 py-2 text-foreground outline-none focus:border-accent"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-foreground">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-lg border border-line bg-card px-3 py-2 text-foreground outline-none focus:border-accent"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-foreground">
          Password
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-lg border border-line bg-card px-3 py-2 text-foreground outline-none focus:border-accent"
          />
        </label>

        {error && <p className="mt-4 text-sm text-danger">{error}</p>}
        {message && <p className="mt-4 text-sm text-success">{message}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 w-full rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Sign up"}
        </button>

        <p className="mt-4 text-sm text-muted">
          Have an account?{" "}
          <Link className="underline" href="/signin">Sign in</Link>
        </p>
      </form>
    </main>
  );
}
