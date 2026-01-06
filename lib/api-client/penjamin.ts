export async function fetchPenjamin() {
  const res = await fetch("/api/master/penjamin", {
    credentials: 'include',
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}
