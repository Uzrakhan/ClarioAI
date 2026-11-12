"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function AuthFrame({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
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
        <span className="auth-icon"><Icon name="shield" size={19} /></span>
        <p className="eyebrow">Account access</p>
        <h1 id="auth-title">{title}</h1>
        <p className="auth-copy">{description}</p>
        {children}
      </section>
      <p className="auth-disclaimer">Use your account to access ClarioAI. Never share your password with anyone.</p>
    </main>
  );
}

export function PasswordResetRequestForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!isSupabaseConfigured()) {
      setError("Authentication is not configured yet. Add the two public Supabase settings to frontend/.env.local and restart the app.");
      return;
    }

    setPending(true);
    try {
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", "/reset-password/update");
      const { error: resetError } = await createClient().auth.resetPasswordForEmail(cleanEmail, { redirectTo: callback.toString() });
      if (resetError) throw resetError;
      setMessage("If an account matches that address, a reset link will arrive in your inbox.");
    } catch {
      setError("We couldn't send a reset link right now. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthFrame title="Reset your password" description="Enter the email address on your account. We’ll send a secure link if it matches.">
      <form className="auth-form" onSubmit={submit} noValidate>
        <div className="auth-field">
          <label className="form-label" htmlFor="reset-email">Email address</label>
          <input id="reset-email" className="input" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
        </div>
        {error && <p className="auth-message auth-message-error" role="alert">{error}</p>}
        {message && <p className="auth-message auth-message-success" role="status" aria-live="polite">{message}</p>}
        <button className="button button-primary auth-submit" type="submit" disabled={pending}>{pending ? "Sending…" : "Send reset link"}{!pending && <Icon name="arrow" size={14} />}</button>
      </form>
      <p className="auth-switch"><Link href="/login">Return to sign in</Link></p>
    </AuthFrame>
  );
}

export function PasswordUpdateForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Your password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    setPending(true);
    try {
      const { error: updateError } = await createClient().auth.updateUser({ password });
      if (updateError) throw updateError;
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("We couldn't update your password. Reopen the latest reset link and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthFrame title="Choose a new password" description="Set a new password for your ClarioAI account.">
      <form className="auth-form" onSubmit={submit} noValidate>
        <div className="auth-field">
          <label className="form-label" htmlFor="new-password">New password</label>
          <input id="new-password" className="input" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} />
        </div>
        <div className="auth-field">
          <label className="form-label" htmlFor="confirm-new-password">Confirm new password</label>
          <input id="confirm-new-password" className="input" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
        </div>
        <label className="auth-show-password"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} /> Show password</label>
        {error && <p className="auth-message auth-message-error" role="alert">{error}</p>}
        <button className="button button-primary auth-submit" type="submit" disabled={pending}>{pending ? "Updating…" : "Update password"}{!pending && <Icon name="arrow" size={14} />}</button>
      </form>
    </AuthFrame>
  );
}
