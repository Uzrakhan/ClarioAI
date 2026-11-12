const LOCAL_ORIGIN = "https://clarioai.local";
const AUTH_PATHS = new Set(["/login", "/signup", "/auth/callback"]);

export function safeRedirectPath(candidate: string | null | undefined, fallback = "/dashboard") {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) return fallback;

  try {
    const target = new URL(candidate, LOCAL_ORIGIN);
    if (target.origin !== LOCAL_ORIGIN || AUTH_PATHS.has(target.pathname)) return fallback;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return fallback;
  }
}
