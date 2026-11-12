"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { safeRedirectPath } from "@/lib/safe-redirect";

type AuthFormProps = { mode: "login" | "signup" };

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getLoginErrorMessage(code?: string) {
  if (code === "email_not_confirmed") {
    return "Please verify your email using the link we sent before signing in. You can request another confirmation email by signing up again.";
  }
  if (code === "invalid_credentials" || code === "bad_auth_credentials") {
    return "The email or password is incorrect. Check your details and try again.";
  }
  return "We couldn't sign you in right now. Check your connection and try again.";
}

function getSignupErrorMessage(code?: string) {
  if (code === "email_exists" || code === "user_already_exists") {
    return "An account may already use this email. Try signing in or use Forgot password.";
  }
  if (code === "weak_password") {
    return "Choose a stronger password that meets your Supabase password requirements.";
  }
  return "We couldn't create your account right now. Check your details and try again.";
}

export function AuthForm({ mode }: AuthFormProps) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("setup") === "required") {
      setError("Authentication is not configured yet. Add the two public Supabase settings to frontend/.env.local and restart the app.");
    } else if (params.get("message") === "confirmation") {
      setSuccess("Your confirmation link could not be completed. Request a fresh link or sign in if your email is already confirmed.");
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const cleanEmail = email.trim().toLowerCase();
    if (isSignup && fullName.trim().length < 2) {
      setError("Enter your full name to continue.");
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Your password must be at least 8 characters.");
      return;
    }
    if (isSignup && password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    if (!isSupabaseConfigured()) {
      setError("Authentication is not configured yet. Add the two public Supabase settings to frontend/.env.local and restart the app.");
      return;
    }

    setPending(true);
    try {
      const supabase = createClient();
      if (isSignup) {
        const callback = new URL("/auth/callback", window.location.origin);
        callback.searchParams.set("next", "/dashboard");
        const { data, error: signupError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { full_name: fullName.trim() },
            emailRedirectTo: callback.toString(),
          },
        });

        if (signupError) {
          setError(getSignupErrorMessage(signupError.code));
          return;
        }
        if (data.session) {
          router.replace(safeRedirectPath(new URLSearchParams(window.location.search).get("next")));
          router.refresh();
          return;
        }
        setSuccess("Check your inbox for a confirmation link. Verify your email to finish creating your account. If you already have an account, sign in or use Forgot password.");
        return;
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (loginError) {
        setError(getLoginErrorMessage(loginError.code));
        return;
      }
      router.replace(safeRedirectPath(new URLSearchParams(window.location.search).get("next")));
      router.refresh();
    } catch {
      setError(isSignup ? getSignupErrorMessage() : getLoginErrorMessage());
    } finally {
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

        <form className="auth-form" onSubmit={submit} noValidate>
          {isSignup && (
            <div className="auth-field">
              <label className="form-label" htmlFor="full-name">Full name</label>
              <input id="full-name" className="input" type="text" autoComplete="name" required maxLength={120} value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your name" />
            </div>
          )}
          <div className="auth-field">
            <label className="form-label" htmlFor="email">Email address</label>
            <input id="email" className="input" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
          </div>
          <div className="auth-field">
            <label className="form-label" htmlFor="password">Password</label>
            <input id="password" className="input" type={showPassword ? "text" : "password"} autoComplete={isSignup ? "new-password" : "current-password"} required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isSignup ? "At least 8 characters" : "Enter your password"} />
            {isSignup && <span className="auth-field-hint">Use at least 8 characters.</span>}
          </div>
          {isSignup ? (
            <div className="auth-field">
              <label className="form-label" htmlFor="confirm-password">Confirm password</label>
              <input id="confirm-password" className="input" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Re-enter your password" />
            </div>
          ) : (
            <div className="auth-forgot"><Link href="/reset-password">Forgot password?</Link></div>
          )}
          <label className="auth-show-password"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} /> Show password</label>
          {error && <p className="auth-message auth-message-error" role="alert">{error}</p>}
          {success && <p className="auth-message auth-message-success" role="status" aria-live="polite">{success}</p>}
          <button className="button button-primary auth-submit" type="submit" disabled={pending}>
            {pending ? (isSignup ? "Creating account…" : "Signing in…") : (isSignup ? "Create account" : "Sign in")}
            {!pending && <Icon name="arrow" size={14} />}
          </button>
        </form>

        <p className="auth-switch">{isSignup ? "Already have an account?" : "New to ClarioAI?"} <Link href={isSignup ? "/login" : "/signup"}>{isSignup ? "Sign in" : "Create an account"}</Link></p>
      </section>
      <p className="auth-disclaimer">Use your account to access ClarioAI. Never share your password with anyone.</p>
    </main>
  );
}
