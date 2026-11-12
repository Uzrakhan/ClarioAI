import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icon";
import { DocumentTable, PageHeading } from "@/components/ui";
import { documents, patients } from "@/lib/mock-data";

export default function DashboardPage() {
  const ready = documents.filter((doc) => doc.status === "Ready").length;
  return <AppShell>
    <PageHeading eyebrow="Tuesday, October 21, 2026" title="Good morning, Jordan" description="A clear view of the care records your family has gathered." action={<Link href="/upload" className="button button-primary"><Icon name="plus" size={15} /> Add a document</Link>} />
    <section className="stats-grid" aria-label="Workspace overview">
      <article className="panel stat-card"><div className="stat-top"><span>Patients</span><span className="stat-icon"><Icon name="users" size={16} /></span></div><div className="stat-value">{patients.length}</div><div className="stat-foot">In your demo workspace</div></article>
      <article className="panel stat-card"><div className="stat-top"><span>Documents</span><span className="stat-icon"><Icon name="file" size={16} /></span></div><div className="stat-value">{documents.length}</div><div className="stat-foot">Across all patient records</div></article>
      <article className="panel stat-card"><div className="stat-top"><span>Ready to review</span><span className="stat-icon"><Icon name="check" size={16} /></span></div><div className="stat-value">{ready}</div><div className="stat-foot">Sample status only</div></article>
    </section>
    <div className="dashboard-grid">
      <section className="panel" aria-labelledby="recent-documents-heading"><div className="panel-header"><div><h2 id="recent-documents-heading" className="panel-title">Recent documents</h2><p className="panel-description">Latest activity across your patient records</p></div><Link href="/documents" className="button button-quiet">View library <Icon name="arrow" size={14} /></Link></div><DocumentTable rows={documents.slice(0, 5)} /></section>
      <aside className="panel" aria-labelledby="quick-actions-heading"><div className="panel-header"><div><h2 id="quick-actions-heading" className="panel-title">Quick actions</h2><p className="panel-description">Keep records organized</p></div></div><div className="quick-actions"><Link href="/patients" className="quick-action"><span className="quick-action-icon"><Icon name="users" size={16} /></span><span><span className="quick-action-title">Add a patient</span><span className="quick-action-copy">Create a profile in this local preview</span></span></Link><Link href="/upload" className="quick-action"><span className="quick-action-icon"><Icon name="upload" size={16} /></span><span><span className="quick-action-title">Upload a document</span><span className="quick-action-copy">Review the upload flow with a sample file</span></span></Link></div><p className="notice">This workspace uses synthetic sample data. Uploads, AI summaries and patient changes are not saved or sent to a server.</p></aside>
    </div>
  </AppShell>;
}
