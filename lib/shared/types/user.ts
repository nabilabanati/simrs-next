export interface User {
  id: string
  username: string
  password: string
  role: "admin" | "dokter" | "farmasi"
  poliId?: string
}
