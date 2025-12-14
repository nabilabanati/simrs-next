import type { Nurse } from "@/lib/types";

export async function fetchNurses(): Promise<Nurse[]> {
  const res = await fetch("/api/master/nurses");
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export async function fetchNursesByPoli(poliId: string): Promise<Nurse[]> {
  const res = await fetch(`/api/master/nurses?poli_id=${poliId}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}
