export async function getQueue(loket: string) {
  const res = await fetch(`/api/queue/counter?loket=${loket}`);
  return res.json();
}

export async function nextQueue(loket: string) {
  const res = await fetch("/api/queue/next", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loket })
  });

  return res.json();
}

export async function resetQueue(loket: string) {
  const res = await fetch("/api/queue/reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loket })
  });

  return res.json();
}
