import type { Patient } from "@/lib/types";

export async function searchPatients(keyword: string): Promise<Patient[]> {
  const res = await fetch(`/api/patients/search?keyword=${encodeURIComponent(keyword)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export async function fetchPatient(id: string): Promise<Patient | null> {
  const res = await fetch(`/api/patients?id=${id}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.data || null;
}

export async function createPatient(payload: Partial<Patient>) {
  const res = await fetch("/api/patients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error("Failed to create patient");
  return res.json();
}
