import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { classifyOAuthFailure } from "@/lib/oauth-messages";
import { safeRedirectPath } from "@/lib/safe-redirect";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const nextPath = safeRedirectPath(requestUrl.searchParams.get("next"));
  const failure = classifyOAuthFailure(requestUrl.searchParams.get("error"), requestUrl.searchParams.get("error_code"));
  if (failure) {
    return redirectToLogin(request, nextPath, failure);
  }

  const code = requestUrl.searchParams.get("code");
  if (!code) return redirectToLogin(request, nextPath, "failed");

  const config = getSupabasePublicConfig();
  if (!config) return redirectToLogin(request, nextPath, "configuration");

  const pendingCookies: Array<{ name: string; value: string; options: Parameters<NextResponse["cookies"]["set"]>[2] }> = [];
  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach((cookie) => pendingCookies.push(cookie));
      },
    },
  });

  let exchangeFailed = false;
  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    exchangeFailed = Boolean(error);
  } catch {
    exchangeFailed = true;
  }
  const response = exchangeFailed
    ? redirectToLogin(request, nextPath, "failed")
    : NextResponse.redirect(new URL(nextPath, request.url));

  pendingCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  return response;
}

function redirectToLogin(request: NextRequest, nextPath: string, reason: "cancelled" | "failed" | "configuration") {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("oauth", reason);
  if (nextPath !== "/dashboard") loginUrl.searchParams.set("next", nextPath);
  return NextResponse.redirect(loginUrl);
}
