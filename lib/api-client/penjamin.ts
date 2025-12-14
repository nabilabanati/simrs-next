export async function fetchPenjamin() {
  const res = await fetch("/api/master/penjamin");
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}
