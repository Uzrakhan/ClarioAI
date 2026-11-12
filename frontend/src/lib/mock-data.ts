export type Patient = {
  id: string;
  name: string;
  initials: string;
  relationship: string;
  age: number;
  lastActivity: string;
  documents: number;
  note: string;
};

export type DocumentStatus = "Ready" | "In review" | "Processing";
export type MedicalDocument = {
  id: string;
  name: string;
  kind: "PDF" | "JPG" | "PNG";
  patientId: string;
  date: string;
  status: DocumentStatus;
  size: string;
};

export const patients: Patient[] = [
  { id: "pt-1042", name: "Eleanor Brooks", initials: "EB", relationship: "Mother", age: 68, lastActivity: "Today", documents: 8, note: "Primary care records and recent lab work" },
  { id: "pt-1038", name: "Martin Brooks", initials: "MB", relationship: "Father", age: 71, lastActivity: "Yesterday", documents: 5, note: "Cardiology notes and medication history" },
  { id: "pt-1029", name: "Sofia Brooks", initials: "SB", relationship: "Daughter", age: 12, lastActivity: "Oct 18, 2026", documents: 3, note: "Immunization and pediatric records" },
  { id: "pt-1017", name: "Nina Patel", initials: "NP", relationship: "Self", age: 42, lastActivity: "Oct 16, 2026", documents: 12, note: "Annual checkup and diagnostic reports" },
  { id: "pt-1008", name: "Arthur Brooks", initials: "AB", relationship: "Grandfather", age: 83, lastActivity: "Oct 12, 2026", documents: 6, note: "Discharge summaries and imaging reports" },
];

export const documents: MedicalDocument[] = [
  { id: "doc-5301", name: "Annual blood panel", kind: "PDF", patientId: "pt-1042", date: "Oct 21, 2026", status: "Ready", size: "1.8 MB" },
  { id: "doc-5298", name: "Cardiology follow-up", kind: "PDF", patientId: "pt-1038", date: "Oct 20, 2026", status: "In review", size: "2.4 MB" },
  { id: "doc-5291", name: "Prescription — October", kind: "JPG", patientId: "pt-1042", date: "Oct 19, 2026", status: "Ready", size: "840 KB" },
  { id: "doc-5287", name: "Immunization record", kind: "PDF", patientId: "pt-1029", date: "Oct 18, 2026", status: "Ready", size: "620 KB" },
  { id: "doc-5280", name: "Discharge summary", kind: "PDF", patientId: "pt-1008", date: "Oct 17, 2026", status: "Processing", size: "3.1 MB" },
  { id: "doc-5274", name: "Thyroid ultrasound", kind: "PNG", patientId: "pt-1017", date: "Oct 16, 2026", status: "Ready", size: "4.2 MB" },
  { id: "doc-5269", name: "Metabolic panel", kind: "PDF", patientId: "pt-1042", date: "Oct 14, 2026", status: "In review", size: "1.2 MB" },
  { id: "doc-5262", name: "Visit notes", kind: "PDF", patientId: "pt-1038", date: "Oct 12, 2026", status: "Ready", size: "940 KB" },
];

export function patientForDocument(document: MedicalDocument) {
  return patients.find((patient) => patient.id === document.patientId);
}
