import { createClient } from "@/lib/supabase/client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/** Call the FastAPI backend with the current Supabase access token.
 * The backend verifies the token and derives the user identity itself.
 */
export async function authenticatedApiFetch(path: string, init: RequestInit = {}) {
  const target = new URL(path, API_BASE_URL);
  const base = new URL(API_BASE_URL);
  if (target.origin !== base.origin) {
    throw new Error("Authenticated API requests must target the configured backend origin.");
  }

  const { data, error } = await createClient().auth.getSession();
  const accessToken = data.session?.access_token;
  if (error || !accessToken) {
    throw new Error("Sign in again to continue.");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  return fetch(target, {
    ...init,
    headers,
    credentials: "omit",
    cache: "no-store",
  });
}

export type BackendCurrentUser = { id: string };

export async function getBackendCurrentUser() {
  const response = await authenticatedApiFetch("/auth/me");
  if (!response.ok) {
    throw new Error(response.status === 401
      ? "Your session is no longer valid. Please sign in again."
      : "The ClarioAI API could not verify your session.");
  }
  return response.json() as Promise<BackendCurrentUser>;
}
