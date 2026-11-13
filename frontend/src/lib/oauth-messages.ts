export type OAuthFailure = "cancelled" | "failed";

export function classifyOAuthFailure(error: string | null, errorCode: string | null): OAuthFailure | null {
  if (!error && !errorCode) return null;
  if (error === "access_denied" || errorCode === "access_denied") return "cancelled";
  return "failed";
}

export function oauthErrorMessage(value: string | null) {
  if (value === "cancelled") return "Google sign-in was cancelled. You can try again whenever you're ready.";
  if (value === "configuration") return "Google sign-in is not configured for this project yet. Please contact the project administrator.";
  if (value === "failed") return "We couldn't complete Google sign-in. Please try again.";
  return "";
}
