import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { safeRedirectPath } from "@/lib/safe-redirect";

function redirectWithRefreshedCookies(response: NextResponse, destination: URL) {
  const redirect = NextResponse.redirect(destination);
  for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = response.headers.get(header);
    if (value) redirect.headers.set(header, value);
  }
  return redirect;
}

function isProtectedPath(pathname: string) {
  return ["/dashboard", "/patients", "/documents", "/upload", "/reports", "/reset-password/update"]
    .some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const protectedPath = isProtectedPath(pathname);
  const authPage = pathname === "/login" || pathname === "/signup";
  const config = getSupabasePublicConfig();

  if (!config) {
    if (!protectedPath) return NextResponse.next({ request });
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("setup", "required");
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  let authenticated = false;
  try {
    const { data, error } = await supabase.auth.getClaims();
    authenticated = !error && typeof data?.claims?.sub === "string";
  } catch {
    // Fail closed for protected pages if session verification is unavailable.
    authenticated = false;
  }

  if (protectedPath && !authenticated) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return redirectWithRefreshedCookies(response, loginUrl);
  }

  if (authPage && authenticated) {
    const nextPath = safeRedirectPath(request.nextUrl.searchParams.get("next"));
    return redirectWithRefreshedCookies(response, new URL(nextPath, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/patients/:path*",
    "/documents/:path*",
    "/upload/:path*",
    "/reports/:path*",
    "/login",
    "/signup",
    "/reset-password/:path*",
    "/auth/callback",
  ],
};
