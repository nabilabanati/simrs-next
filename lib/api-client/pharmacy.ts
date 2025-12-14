export async function fetchPharmacyOrders() {
  const res = await fetch("/api/pharmacy/orders");
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export async function updatePharmacyOrderStatus(payload: any) {
  const res = await fetch("/api/pharmacy/dispense", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return res.json();
}

export async function updateMedicineStock(payload: any) {
  const res = await fetch("/api/pharmacy/stock-update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return res.json();
}
