import type { Doctor } from "@/lib/types";

export async function fetchDoctors(): Promise<Doctor[]> {
  const res = await fetch("/api/master/doctors");
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export async function fetchDoctorsByPoli(poliId: string): Promise<Doctor[]> {
  const res = await fetch(`/api/master/doctors?poli_id=${poliId}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}
