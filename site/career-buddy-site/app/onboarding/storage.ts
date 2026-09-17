import type { OnboardingFormData } from "./types";

const STORAGE_KEY = "careerlm:onboarding-profile";

/**
 * Placeholder for the real Career Profile save API (KAN-4), which doesn't
 * exist yet. Persists locally so the onboarding -> confirmation flow works
 * end-to-end today; swap the body for a fetch() once that endpoint lands.
 */
export async function saveOnboardingLocally(
  data: OnboardingFormData,
): Promise<void> {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Cache the parsed value so repeated calls return a referentially stable
// result when the underlying storage hasn't changed. Required for safe use
// as a useSyncExternalStore snapshot (React compares by reference).
let cachedRaw: string | null = null;
let cachedParsed: OnboardingFormData | null = null;

export function loadOnboardingLocally(): OnboardingFormData | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedParsed;

  cachedRaw = raw;
  try {
    cachedParsed = raw ? (JSON.parse(raw) as OnboardingFormData) : null;
  } catch {
    cachedParsed = null;
  }
  return cachedParsed;
}
