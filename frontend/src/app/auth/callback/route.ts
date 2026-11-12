import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/safe-redirect";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  const code = url.searchParams.get("code");
  const nextPath = safeRedirectPath(url.searchParams.get("next"));

  if (!code) {
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("message", "confirmation");
    return NextResponse.redirect(url);
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return NextResponse.redirect(new URL(nextPath, request.url));
  } catch {
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("message", "confirmation");
    return NextResponse.redirect(url);
  }
}
