"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Icon } from "@/components/icon";
import { useAuth } from "@/components/auth-provider";
import { SignOutButton } from "@/components/sign-out-button";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: "grid" as const },
  { label: "Patients", href: "/patients", icon: "users" as const },
  { label: "Documents", href: "/documents", icon: "file" as const },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const displayName = String(user?.user_metadata?.full_name || user?.email || "Your account");
  const initials = displayName.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "U";
  const current = pathname.startsWith("/dashboard") ? "Overview" : pathname.startsWith("/patients") ? "Patients" : pathname.startsWith("/documents") ? "Documents" : pathname.startsWith("/upload") ? "Upload" : "AI report";

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Main navigation">
        <Link href="/" className="brand" aria-label="ClarioAI home">
          <span className="brand-mark"><Icon name="activity" size={18} strokeWidth={2} /></span>
          <span><span className="brand-name">Clario<span style={{ color: "var(--green)" }}>AI</span></span><span className="brand-note">Care, made clearer</span></span>
        </Link>
        <p className="nav-caption">Workspace</p>
        <nav className="nav-list">
          {navItems.map((item) => <Link key={item.href} href={item.href} className={`nav-link ${isActive(pathname, item.href) ? "active" : ""}`} aria-current={isActive(pathname, item.href) ? "page" : undefined}><Icon name={item.icon} size={17} /><span>{item.label}</span></Link>)}
        </nav>
        <p className="nav-caption" style={{ marginTop: 29 }}>Manage</p>
        <nav className="nav-list">
          <Link href="/upload" className={`nav-link ${pathname.startsWith("/upload") ? "active" : ""}`}><Icon name="upload" size={17} /><span>Upload document</span></Link>
          <Link href="/reports/doc-5301" className={`nav-link ${pathname.startsWith("/reports") ? "active" : ""}`}><Icon name="spark" size={17} /><span>AI summaries</span></Link>
        </nav>
        <div className="sidebar-bottom">
          <div className="workspace-card"><div className="workspace-title"><Icon name="shield" size={15} /> Private workspace</div><p className="workspace-copy">Sample workspace for the ClarioAI interface preview. No patient data is connected.</p></div>
          <div className="profile-row"><span className="avatar">{initials}</span><span className="profile-copy"><span className="profile-name">{displayName}</span><span className="profile-role">Signed in</span></span></div>
          <SignOutButton />
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span>ClarioAI</span><span aria-hidden="true">/</span><strong>{current}</strong></div>
          <div className="topbar-right"><span className="mock-label">SAMPLE DATA</span><button className="icon-button" aria-label="Notifications (demo only)" title="Notifications are not connected"><Icon name="bell" size={17} /></button><span className="avatar" aria-label={displayName}>{initials}</span></div>
        </header>
        <main className="main-content">{children}</main>
      </div>

      <nav className="mobile-top" aria-label="Mobile navigation">
        {[...navItems, { label: "Upload", href: "/upload", icon: "upload" as const }].map((item) => <Link key={item.href} href={item.href} className={`mobile-nav-link ${isActive(pathname, item.href) ? "active" : ""}`}><Icon name={item.icon} size={17} /><span>{item.label}</span></Link>)}
      </nav>
    </div>
  );
}
