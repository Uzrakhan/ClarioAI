"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icon";
import { DocumentTable, PageHeading, SearchField } from "@/components/ui";
import { documents } from "@/lib/mock-data";

export default function DocumentsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [fileType, setFileType] = useState("All file types");
  const filtered = useMemo(() => documents.filter((doc) => {
    const matchesQuery = `${doc.name} ${doc.id}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = status === "All statuses" || doc.status === status;
    const matchesType = fileType === "All file types" || doc.kind === fileType;
    return matchesQuery && matchesStatus && matchesType;
  }), [query, status, fileType]);

  return <AppShell>
    <PageHeading eyebrow="Records" title="Document library" description="Find and review records gathered across your care circle." action={<a href="/upload" className="button button-primary"><Icon name="upload" size={15} /> Upload document</a>} />
    <section className="panel"><div className="panel-header"><div><h2 className="panel-title">All documents</h2><p className="panel-description">{filtered.length} of {documents.length} sample files</p></div><span className="mock-label">SAMPLE RECORDS</span></div><div className="toolbar" style={{ padding: "0 17px", margin: "13px 0" }}><SearchField value={query} onChange={setQuery} placeholder="Search documents" /><label><span className="sr-only">Filter by status</span><select className="select" value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option><option>Ready</option><option>In review</option><option>Processing</option></select></label><label><span className="sr-only">Filter by file type</span><select className="select" value={fileType} onChange={(event) => setFileType(event.target.value)}><option>All file types</option><option>PDF</option><option>JPG</option><option>PNG</option></select></label></div><DocumentTable rows={filtered} /></section>
  </AppShell>;
}
