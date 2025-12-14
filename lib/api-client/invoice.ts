export async function fetchUnpaidInvoices() {
  const res = await fetch("/api/kasir/invoices");
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export async function payInvoice(invoiceId: string) {
  const res = await fetch("/api/kasir/pay", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invoice_id: invoiceId })
  });

  return res.json();
}
