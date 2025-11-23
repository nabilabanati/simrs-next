export function randomId(prefix: string = "id") {
  return `${prefix}-${Math.random().toString(36).substring(2, 10)}`
}

export function generateQueueNumber(i: number) {
  return String(i).padStart(3, "0")
}

export function generateRegistration(poliId: string, queue: string) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  return `${poliId}-${today}-${queue}`
}
