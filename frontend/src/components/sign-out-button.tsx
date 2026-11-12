"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function signOut() {
    setPending(true);
    setError("");
    try {
      const { error: signOutError } = await createClient().auth.signOut();
      if (signOutError) throw signOutError;
      router.replace("/login");
      router.refresh();
    } catch {
      setError("Couldn't sign out. Please try again.");
      setPending(false);
    }
  }

  return <div>
    <button className="sign-out-button" type="button" onClick={signOut} disabled={pending}>
      <Icon name="logout" size={15} />{pending ? "Signing out…" : "Sign out"}
    </button>
    {error && <p className="sign-out-error" role="alert">{error}</p>}
  </div>;
}
