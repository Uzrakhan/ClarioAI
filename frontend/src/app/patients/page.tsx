"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icon";
import { PageHeading, SearchField } from "@/components/ui";
import { patients as samplePatients, type Patient } from "@/lib/mock-data";

export default function PatientsPage() {
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [patients, setPatients] = useState(samplePatients);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("Family member");
  const filtered = useMemo(() => patients.filter((patient) => `${patient.name} ${patient.relationship}`.toLowerCase().includes(query.toLowerCase())), [patients, query]);

  function addPatient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const initials = trimmed.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
    const patient: Patient = { id: `demo-${Date.now()}`, name: trimmed, initials, relationship, age: 0, lastActivity: "Just now", documents: 0, note: "Added in this local preview" };
    setPatients((current) => [patient, ...current]);
    setName("");
    setShowForm(false);
  }

  return <AppShell>
    <PageHeading eyebrow="Care circle" title="Patients" description="People whose health records you help keep in order." action={<button className="button button-primary" onClick={() => setShowForm(true)}><Icon name="plus" size={15} /> Add patient</button>} />
    <div className="toolbar"><SearchField value={query} onChange={setQuery} placeholder="Search by patient or relationship" /><span style={{ color: "var(--muted)", fontSize: 11 }}>{filtered.length} {filtered.length === 1 ? "patient" : "patients"}</span></div>
    {filtered.length ? <div className="patient-grid">{filtered.map((patient) => {
      const href = patient.id.startsWith("demo-") ? `/patients/${patient.id}?name=${encodeURIComponent(patient.name)}&relationship=${encodeURIComponent(patient.relationship)}` : `/patients/${patient.id}`;
      return <Link className="panel patient-card" href={href} key={patient.id}><div className="patient-card-top"><span className="patient-avatar">{patient.initials}</span><span style={{ color: "#839087" }}><Icon name="chevron" size={16} /></span></div><h2 className="patient-name">{patient.name}</h2><div className="patient-rel">{patient.relationship}{patient.age ? ` · ${patient.age} years` : ""}</div><div className="patient-details"><span>{patient.documents} documents</span><span>Active {patient.lastActivity}</span></div></Link>;
    })}</div> : <div className="panel empty-state"><span className="empty-icon"><Icon name="users" size={19} /></span><p className="empty-title">No patients match that search</p><p className="empty-copy">Try another name or relationship.</p></div>}
    {showForm && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="add-patient-title"><div className="modal-head"><div><h2 className="modal-title" id="add-patient-title">Add a patient</h2><p className="modal-copy">This profile exists only in this browser preview.</p></div><button className="icon-button" onClick={() => setShowForm(false)} aria-label="Close form"><Icon name="x" size={17} /></button></div><form onSubmit={addPatient}><div className="form-field"><label className="form-label" htmlFor="patient-name">Full name</label><input id="patient-name" className="input" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Taylor Morgan" required autoFocus /></div><div className="form-field"><label className="form-label" htmlFor="patient-relationship">Relationship</label><select id="patient-relationship" className="input" value={relationship} onChange={(event) => setRelationship(event.target.value)}><option>Family member</option><option>Self</option><option>Parent</option><option>Child</option><option>Other</option></select></div><p className="notice" style={{ margin: "4px 0 16px" }}>Use synthetic names only. The form does not save to ClarioAI or a backend.</p><div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="button button-primary">Add to preview</button></div></form></section></div>}
  </AppShell>;
}
