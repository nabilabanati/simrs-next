import type { Doctor } from "@/lib/types";

export async function fetchDoctors(): Promise<Doctor[]> {
  const res = await fetch("/api/master/doctors", {
    credentials: 'include',
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export async function fetchDoctorsByPoli(poliId: string): Promise<Doctor[]> {
  const res = await fetch(`/api/master/doctors?poli_id=${poliId}`, {
    credentials: 'include',
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}
