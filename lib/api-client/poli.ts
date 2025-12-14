import type { Poli } from "@/lib/types";

export async function fetchPoli(): Promise<Poli[]> {
  const res = await fetch("/api/master/poli");
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}
