import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icon";
import { DocumentTable, PageHeading } from "@/components/ui";
import { documents, patients } from "@/lib/mock-data";

export default async function PatientDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ name?: string | string[]; relationship?: string | string[] }> }) {
  const { id } = await params;
  const query = await searchParams;
  const patient = patients.find((item) => item.id === id) ?? (typeof query.name === "string" && query.name.trim() ? {
    id,
    name: query.name.trim(),
    initials: query.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join(""),
    relationship: typeof query.relationship === "string" ? query.relationship : "Family member",
    age: 0,
    lastActivity: "Just now",
    documents: 0,
    note: "Added in this local preview",
  } : undefined);
  if (!patient) notFound();
  const patientDocs = documents.filter((doc) => doc.patientId === patient.id);
  return <AppShell>
    <PageHeading eyebrow="Patient record" title={patient.name} description="A consolidated view of this patient’s information and documents." action={<Link href={`/upload?patient=${patient.id}`} className="button button-primary"><Icon name="upload" size={15} /> Upload document</Link>} />
    <div className="patient-overview"><section className="panel patient-info"><span className="patient-avatar">{patient.initials}</span><div style={{ flex: 1 }}><h2 className="info-name">{patient.name}</h2><div className="info-sub">{patient.relationship}{patient.age ? ` · ${patient.age} years old` : ""}</div><div className="info-fields"><div><div className="info-field-label">Documents</div><div className="info-field-value">{patient.documents} on file</div></div><div><div className="info-field-label">Last activity</div><div className="info-field-value">{patient.lastActivity}</div></div><div><div className="info-field-label">Record note</div><div className="info-field-value">{patient.note}</div></div></div></div></section><section className="panel" style={{ padding: 18 }}><div className="eyebrow" style={{ marginBottom: 8 }}>Workspace status</div><div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12, fontWeight: 620 }}><span className="stat-icon"><Icon name="shield" size={16} /></span>Private demo record</div><p className="panel-description" style={{ lineHeight: 1.6, marginTop: 10 }}>This sample profile is not connected to authentication, a database, or a care provider.</p></section></div>
    <section className="panel"><div className="panel-header"><div><h2 className="panel-title">Medical documents</h2><p className="panel-description">Documents associated with {patient.name}</p></div><Link href={`/upload?patient=${patient.id}`} className="button button-secondary"><Icon name="plus" size={14} /> Add document</Link></div><DocumentTable rows={patientDocs} showPatient={false} /></section>
  </AppShell>;
}
