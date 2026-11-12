import Link from "next/link";
import { DocumentTable } from "@/components/ui";
import { documents, patients } from "@/lib/mock-data";
import { Icon } from "@/components/icon";

export function DashboardPreview() {
  const ready = documents.filter((document) => document.status === "Ready").length;
  return (
    <div className="product-window" aria-label="ClarioAI dashboard preview using synthetic sample data">
      <div className="product-window-bar"><div className="window-dots" aria-hidden="true"><i /><i /><i /></div><span className="window-address">app.clarioai.local / dashboard</span><span className="preview-badge">DEMO</span></div>
      <div className="preview-app">
        <aside className="preview-sidebar" aria-hidden="true"><span className="preview-brand-mark"><Icon name="activity" size={15} /></span><span className="preview-side-item selected"><Icon name="grid" size={14} /> Overview</span><span className="preview-side-item"><Icon name="users" size={14} /> Patients</span><span className="preview-side-item"><Icon name="file" size={14} /> Documents</span></aside>
        <div className="preview-content">
          <div className="preview-toolbar"><span>ClarioAI / Overview</span><span className="preview-user">JD</span></div>
          <div className="preview-heading"><div><span className="preview-kicker">YOUR CARE CIRCLE</span><h3>Good morning, Jordan</h3><p>A clear view of the records you’ve gathered.</p></div><span className="preview-demo-tag">Synthetic data</span></div>
          <div className="preview-stats"><div><span>Patients</span><strong>{patients.length}</strong></div><div><span>Documents</span><strong>{documents.length}</strong></div><div><span>Ready to review</span><strong>{ready}</strong></div></div>
          <section className="panel preview-documents"><div className="panel-header"><div><h4 className="panel-title">Recent documents</h4><p className="panel-description">Latest activity across patient records</p></div><Link href="/dashboard" className="preview-view-link">Open dashboard <Icon name="arrow" size={12} /></Link></div><DocumentTable rows={documents.slice(0, 3)} showPatient={false} /></section>
          <p className="preview-footnote">Preview content is illustrative. No records are connected.</p>
        </div>
      </div>
    </div>
  );
}
