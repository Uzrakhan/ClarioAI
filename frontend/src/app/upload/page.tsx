"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icon";
import { PageHeading } from "@/components/ui";
import { patients } from "@/lib/mock-data";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ["application/pdf", "image/jpeg", "image/png"];
type SelectedFile = { name: string; size: number; type: string };

function prettySize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function UploadPage() {
  const [patientId, setPatientId] = useState("");
  const [file, setFile] = useState<SelectedFile | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewed, setPreviewed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPatientId(new URLSearchParams(window.location.search).get("patient") ?? "");
  }, []);

  function chooseFile(candidate?: File) {
    setError(""); setProgress(0); setPreviewed(false);
    if (!candidate) return;
    if (!ACCEPTED.includes(candidate.type)) { setFile(null); setError("Choose a PDF, JPEG or PNG file. This preview checks the browser-reported file type only."); return; }
    if (candidate.size === 0 || candidate.size > MAX_BYTES) { setFile(null); setError("The file must be between 1 byte and 10 MiB."); return; }
    setFile({ name: candidate.name, size: candidate.size, type: candidate.type });
  }

  function previewUpload() {
    if (!file || !patientId) return;
    setPreviewed(true); setProgress(18);
    const started = Date.now();
    const timer = window.setInterval(() => {
      const next = Math.min(100, Math.round(18 + ((Date.now() - started) / 1800) * 82));
      setProgress(next);
      if (next >= 100) window.clearInterval(timer);
    }, 120);
  }

  const patient = patients.find((item) => item.id === patientId);
  return <AppShell>
    <PageHeading eyebrow="Add to a patient record" title="Upload a document" description="Select a record and a supported file to preview the upload steps." />
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <section className="panel" style={{ padding: 19, marginBottom: 15 }}><label className="form-label" htmlFor="patient-select">Patient record</label><select id="patient-select" className="input" value={patientId} onChange={(event) => setPatientId(event.target.value)}><option value="">Select a patient</option>{patients.map((item) => <option value={item.id} key={item.id}>{item.name} · {item.relationship}</option>)}</select><div className="form-help">Select which sample patient record this document would be associated with.</div></section>
      <section className="panel" style={{ padding: 19 }}>
        <div className={`dropzone ${dragging ? "dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files[0]); }}>
          <span className="drop-icon"><Icon name="upload" size={20} /></span><p className="drop-title">Drop a file here, or choose from your device</p><p className="drop-copy">PDF, JPEG or PNG · up to 10 MiB</p><button className="button button-secondary" type="button" onClick={() => inputRef.current?.click()}>Choose file</button><input ref={inputRef} type="file" accept="application/pdf,image/jpeg,image/png" hidden onChange={(event) => chooseFile(event.target.files?.[0])} aria-label="Choose a PDF, JPEG or PNG file" />
        </div>
        {error && <p role="alert" style={{ color: "#9c493d", fontSize: 11, margin: "12px 2px 0" }}>{error}</p>}
        {file && <div className="file-selected"><div style={{ display: "flex", gap: 10, minWidth: 0, alignItems: "center" }}><span className="file-icon"><Icon name="file" size={16} /></span><span style={{ minWidth: 0 }}><span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 11, fontWeight: 620 }}>{file.name}</span><span className="file-meta">{file.type} · {prettySize(file.size)}</span></span></div><button className="icon-button" onClick={() => { setFile(null); setProgress(0); setPreviewed(false); }} aria-label="Remove selected file"><Icon name="x" size={16} /></button></div>}
        <div className="upload-disclaimer"><strong>Local preview only.</strong> File selection and size checks happen in this browser. No bytes are uploaded, stored, or sent to a server, and this screen does not perform the backend’s file-signature validation.</div>
        <div className="upload-controls"><span style={{ fontSize: 10, color: "var(--muted)" }}>{patient ? `Adding to ${patient.name}` : "Choose a patient to continue"}</span><button className="button button-primary" disabled={!file || !patientId} onClick={previewUpload}>Preview upload flow <Icon name="arrow" size={14} /></button></div>
        {previewed && <div role="status" aria-live="polite" style={{ marginTop: 18, padding: "14px 15px", border: "1px solid var(--line)", borderRadius: 7, background: "#fcfcfa" }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 11 }}><strong>{progress === 100 ? "Preview complete" : "Previewing upload steps"}</strong><span style={{ color: "var(--muted)" }}>{progress}%</span></div><div className="progress-track"><div className="progress-value" style={{ width: `${progress}%` }} /></div><p className="form-help" style={{ marginTop: 9 }}>{progress === 100 ? "This was a visual simulation only. The file was not uploaded." : "Simulated progress only — no network request is being made."}</p></div>}
      </section>
      <p className="form-help" style={{ textAlign: "center", marginTop: 15 }}>For this UI preview, use synthetic or non-sensitive files only. <Link href="/documents" style={{ color: "var(--green)", textDecoration: "underline" }}>Return to document library</Link>.</p>
    </div>
  </AppShell>;
}
