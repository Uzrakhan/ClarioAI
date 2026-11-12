import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/icon";
import type { MedicalDocument } from "@/lib/mock-data";
import { patientForDocument } from "@/lib/mock-data";

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1 className="page-title">{title}</h1><p className="page-subtitle">{description}</p></div>{action}</div>;
}

export function Status({ status }: { status: MedicalDocument["status"] }) {
  const style = status === "Ready" ? "status-ready" : status === "In review" ? "status-review" : "status-processing";
  return <span className={`status ${style}`}><span className="status-dot" />{status}</span>;
}

export function DocumentTable({ rows, showPatient = true }: { rows: MedicalDocument[]; showPatient?: boolean }) {
  if (!rows.length) return <div className="empty-state"><span className="empty-icon"><Icon name="file" size={19} /></span><p className="empty-title">No documents found</p><p className="empty-copy">Try adjusting your search, or add a document to this demo library.</p><Link className="button button-secondary" href="/upload">Go to upload preview</Link></div>;
  return <div className="table-wrap"><table className="data-table"><thead><tr><th>Document</th>{showPatient && <th>Patient</th>}<th>Uploaded</th><th>Status</th><th aria-label="Actions" /></tr></thead><tbody>{rows.map((doc) => {
    const patient = patientForDocument(doc);
    return <tr key={doc.id}><td><div className="file-cell"><span className="file-icon"><Icon name={doc.kind === "PDF" ? "file" : "image"} size={16} /></span><span>{doc.name}<span className="file-meta">{doc.kind} · {doc.size}</span></span></div></td>{showPatient && <td><Link href={`/patients/${doc.patientId}`} style={{ color: "#4e5c53" }}>{patient?.name ?? "Unknown patient"}</Link></td>}<td>{doc.date}</td><td><Status status={doc.status} /></td><td><Link className="icon-button" href={`/reports/${doc.id}`} aria-label={`Open summary for ${doc.name}`} title="Open sample AI summary"><Icon name="chevron" size={15} /></Link></td></tr>;
  })}</tbody></table></div>;
}

export function SearchField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="search-field"><span className="sr-only">{placeholder}</span><Icon name="search" size={16} /><input className="input" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}
