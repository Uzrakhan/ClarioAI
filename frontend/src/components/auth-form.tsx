"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { oauthErrorMessage } from "@/lib/oauth-messages";

type AuthFormProps = { mode: "login" | "signup" };

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" width="19" height="19">
      <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.7c3.9-3.6 6-8.8 6-15Z" />
      <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.7-5.1c-1.9 1.3-4.1 2-6.8 2-5.2 0-9.7-3.5-11.3-8.2H5.8v5.2A20 20 0 0 0 24 44Z" />
      <path fill="#FBBC05" d="M12.7 27.9a12 12 0 0 1 0-7.7V15H5.8a20 20 0 0 0 0 18.1l6.9-5.2Z" />
      <path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3.1l5.9-5.9A19.7 19.7 0 0 0 24 4 20 20 0 0 0 5.8 15l6.9 5.2C14.3 15.5 18.8 12 24 12Z" />
    </svg>
  );
}

export function AuthForm({ mode }: AuthFormProps) {
  const isSignup = mode === "signup";
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("setup") === "required") {
      setError("Authentication is not configured yet. Add the public Supabase settings to frontend/.env.local and restart the app.");
      return;
    }
    setError(oauthErrorMessage(params.get("oauth")));
  }, []);

  async function continueWithGoogle() {
    setError("");
    if (!isSupabaseConfigured()) {
      setError("Authentication is not configured yet. Add the public Supabase settings to frontend/.env.local and restart the app.");
      return;
    }

    setPending(true);
    try {
      const nextPath = safeRedirectPath(new URLSearchParams(window.location.search).get("next"));
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", nextPath);
      const { error: oauthError } = await createClient().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callback.toString() },
      });

      if (oauthError) {
        setError("Google sign-in could not be started. Please try again.");
        setPending(false);
      }
    } catch {
      setError("We couldn't connect to Google sign-in. Check your connection and try again.");
      setPending(false);
    }
  }

  return (
    <main className="auth-page">
      <header className="auth-topbar">
        <Link href="/" className="public-brand" aria-label="ClarioAI home">
          <span className="brand-mark"><Icon name="activity" size={18} strokeWidth={2} /></span>
          <span>Clario<span>AI</span></span>
        </Link>
        <Link className="auth-home-link" href="/">Back to home</Link>
      </header>

      <section className="auth-card panel" aria-labelledby="auth-title">
        <span className="auth-icon"><Icon name={isSignup ? "users" : "shield"} size={19} /></span>
        <p className="eyebrow">Account access</p>
        <h1 id="auth-title">{isSignup ? "Create your ClarioAI account" : "Welcome back"}</h1>
        <p className="auth-copy">{isSignup ? "A thoughtful place to keep care records organized." : "Sign in to return to your care workspace."}</p>

        {error && <p className="auth-message auth-message-error" role="alert">{error}</p>}
        <button className="button auth-google-button" type="button" onClick={continueWithGoogle} disabled={pending}>
          <GoogleMark />
          <span>{pending ? "Connecting to Google…" : "Continue with Google"}</span>
        </button>
        <p className="auth-provider-note">Continue securely with your Google account. ClarioAI uses Supabase to manage your session.</p>
        <p className="auth-switch">{isSignup ? "Already have an account?" : "New to ClarioAI?"} <Link href={isSignup ? "/login" : "/signup"}>{isSignup ? "Sign in" : "Create an account"}</Link></p>
      </section>
      <p className="auth-disclaimer">Use your account to access ClarioAI. Never share your Google password with anyone.</p>
    </main>
  );
}
