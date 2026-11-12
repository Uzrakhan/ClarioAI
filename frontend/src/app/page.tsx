import Link from "next/link";
import { DashboardPreview } from "@/components/dashboard-preview";
import { Icon } from "@/components/icon";

const features = [
  { icon: "folder" as const, number: "01", title: "A home for every record", copy: "Keep lab results, visit notes, prescriptions and imaging together in an orderly library." },
  { icon: "users" as const, number: "02", title: "Care circles, clearly organized", copy: "Create a separate patient profile for each person whose records you help manage." },
  { icon: "spark" as const, number: "03", title: "More understandable reports", copy: "A future AI summary experience is designed to help explain document language in plain terms, with appropriate clinical review." },
];

const steps = [
  { number: "01", title: "Add a patient", copy: "Create a profile for yourself or someone whose records you help organize." },
  { number: "02", title: "Bring reports together", copy: "Add supported medical documents to the right patient record." },
  { number: "03", title: "Review with more context", copy: "Explore document details and, when available, a clear summary to discuss with a care professional." },
];

export default function HomePage() {
  return (
    <main id="top" className="marketing-page">
      <header className="public-header">
        <div className="public-header-inner">
          <Link href="/" className="public-brand" aria-label="ClarioAI home"><span className="brand-mark"><Icon name="activity" size={18} strokeWidth={2} /></span><span>Clario<span>AI</span></span></Link>
          <nav className="public-nav" aria-label="Main navigation"><a href="#features">Features</a><a href="#how-it-works">How it works</a><a href="#privacy">Privacy</a><Link href="/dashboard">Dashboard</Link></nav>
          <div className="public-actions"><Link className="sign-in-link" href="/login">Sign in</Link><Link className="button button-primary" href="/signup">Get started <Icon name="arrow" size={14} /></Link></div>
          <details className="mobile-menu"><summary aria-label="Open navigation menu"><span /><span /><span /></summary><nav aria-label="Mobile navigation"><a href="#features">Features</a><a href="#how-it-works">How it works</a><a href="#privacy">Privacy</a><Link href="/dashboard">Dashboard</Link><Link href="/login">Sign in</Link><Link href="/signup">Get started</Link></nav></details>
        </div>
      </header>

      <section className="marketing-hero">
        <div className="hero-copy">
          <p className="marketing-eyebrow"><span className="eyebrow-rule" /> A clearer way to manage care records</p>
          <h1>Medical records,<br /><em>in one clear place.</em></h1>
          <p className="hero-description">ClarioAI helps you organize medical documents for the people you care about and make complex reports easier to review.</p>
          <div className="hero-actions"><Link className="button button-primary hero-cta" href="/signup">Get started <Icon name="arrow" size={15} /></Link><Link className="hero-secondary" href="/dashboard"><span className="play-mark"><Icon name="grid" size={14} /></span>Explore the dashboard</Link></div>
          <div className="hero-trust"><span><Icon name="shield" size={15} /> Private-by-design direction</span><span className="trust-divider" /><span>Product preview · Synthetic data</span></div>
        </div>
        <div className="hero-preview-wrap"><div className="preview-orbit orbit-one" /><div className="preview-orbit orbit-two" /><DashboardPreview /></div>
      </section>

      <section id="demo" className="demo-section" aria-labelledby="demo-heading">
        <div className="demo-section-heading">
          <div>
            <p className="marketing-eyebrow"><span className="eyebrow-rule" /> See ClarioAI in action</p>
            <h2 id="demo-heading">A closer look at<br /><em>the product preview.</em></h2>
          </div>
          <p>Walk through the dashboard, patient profiles and document library using the ClarioAI interface and synthetic sample records.</p>
        </div>
        <div className="demo-video-frame">
          <video controls playsInline preload="metadata" poster="/videos/clarioai-product-demo-poster.jpg" aria-label="ClarioAI product walkthrough video">
            <source src="/videos/clarioai-product-demo.mp4" type="video/mp4" />
            Your browser does not support embedded video. You can open the product demo video directly.
          </video>
        </div>
        <p className="demo-video-note"><Icon name="info" size={14} /> Product walkthrough recorded from the current interface. Upload is a local preview only; AI summaries are not shown as working.</p>
      </section>

      <section id="features" className="marketing-section features-section">
        <div className="section-heading"><p className="marketing-eyebrow"><span className="eyebrow-rule" /> Made for the details that matter</p><h2>Less searching.<br /><em>More understanding.</em></h2><p>Health information often arrives in pieces. ClarioAI is being designed to make those pieces easier to keep together and revisit.</p></div>
        <div className="feature-grid">{features.map((feature) => <article className="feature-item" key={feature.number}><div className="feature-top"><span className="feature-icon"><Icon name={feature.icon} size={19} /></span><span className="feature-number">{feature.number}</span></div><h3>{feature.title}</h3><p>{feature.copy}</p></article>)}</div>
        <p className="feature-note"><Icon name="info" size={14} /> AI summaries are a product direction and currently shown as placeholders in the demo.</p>
      </section>

      <section id="how-it-works" className="marketing-section how-section">
        <div className="how-heading"><div><p className="marketing-eyebrow"><span className="eyebrow-rule" /> A simple place to begin</p><h2>From scattered files<br />to a <em>clearer picture.</em></h2></div><p>Keep the steps familiar. Keep the information close at hand.</p></div>
        <div className="steps-grid">{steps.map((step, index) => <article className="step-item" key={step.number}><div className="step-marker"><span>{step.number}</span>{index < steps.length - 1 && <i aria-hidden="true" />}</div><h3>{step.title}</h3><p>{step.copy}</p></article>)}</div>
      </section>

      <section id="privacy" className="privacy-section">
        <div className="privacy-mark"><Icon name="shield" size={22} /></div>
        <div className="privacy-copy"><p className="marketing-eyebrow"><span className="eyebrow-rule" /> Thoughtful by design</p><h2>Health records deserve<br /><em>a careful home.</em></h2><p>ClarioAI is being designed around private documents, authenticated access and patient-level ownership checks. The storage and access workflow is still under development; this preview does not store or protect real medical records.</p><Link className="privacy-link" href="/dashboard">See the product preview <Icon name="arrow" size={14} /></Link></div>
        <div className="privacy-card"><div className="privacy-card-head"><span className="privacy-lock"><Icon name="shield" size={17} /></span><span>Design principles</span></div><div className="privacy-principle"><Icon name="check" size={15} /><span>Private storage is the intended default</span></div><div className="privacy-principle"><Icon name="check" size={15} /><span>Patient ownership checks are part of the design</span></div><div className="privacy-principle"><Icon name="clock" size={15} /><span>Production security controls are not yet implemented</span></div><p>This is a roadmap description, not a claim that these controls are live.</p></div>
      </section>

      <section className="closing-cta"><div><p className="marketing-eyebrow"><span className="eyebrow-rule" /> Keep care information close</p><h2>Start with a more organized record.</h2><p>Explore the ClarioAI interface using sample data.</p></div><Link className="button button-primary" href="/dashboard">Open the demo dashboard <Icon name="arrow" size={14} /></Link></section>

      <footer id="footer" className="public-footer"><div className="footer-top"><Link href="/" className="public-brand"><span className="brand-mark"><Icon name="activity" size={18} strokeWidth={2} /></span><span>Clario<span>AI</span></span></Link><p>Care, made clearer.</p><nav aria-label="Footer navigation"><Link href="/dashboard">Dashboard</Link><Link href="/patients">Patients</Link><Link href="/documents">Documents</Link><a href="#features">Features</a><a href="#privacy">Privacy</a><Link href="/login">Sign in</Link></nav></div><div className="footer-bottom"><span>© 2026 ClarioAI · Product preview</span><span>Sample data only. Not for clinical use.</span></div></footer>
    </main>
  );
}
