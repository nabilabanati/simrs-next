import type { Visit } from "@/lib/types";

export async function createVisit(payload: any) {
  const res = await fetch("/api/visits/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error("Failed to create visit");
  return res.json();
}

export async function fetchVisits(params?: any): Promise<Visit[]> {
  const query = params ? "?" + new URLSearchParams(params).toString() : "";
  const res = await fetch(`/api/visits/list${query}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export async function finishVisit(id: string) {
  const res = await fetch("/api/visits/finish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ visit_id: id })
  });

  return res.json();
}

export async function lockTTV(visitId: string, nurseId: string) {
  const res = await fetch("/api/visits/lock-ttv", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ visit_id: visitId, nurse_id: nurseId })
  });

  return res.json();
}

export async function submitTTV(payload: any) {
  const res = await fetch("/api/visits/input-ttv", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return res.json();
}
