export async function createPrescription(payload: any) {
  const res = await fetch("/api/medical-records/soap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return res.json();
}

export async function fetchPrescriptionItems(prescriptionId: string) {
  const res = await fetch(`/api/prescriptions/items?prescription_id=${prescriptionId}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export async function updatePrescriptionStatus(id: string, status: string) {
  const res = await fetch("/api/pharmacy/dispense", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prescription_id: id, status })
  });

  return res.json();
}
