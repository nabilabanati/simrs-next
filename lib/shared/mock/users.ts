import type { User } from "@/lib/shared/types"

export const USERS: User[] = [
  {
    id: "u1",
    username: "admin@simrs.com",
    password: "admin123",
    role: "admin",
  },
  {
    id: "u2",
    username: "dokter@simrs.com",
    password: "dokter123",
    role: "dokter",
    poliId: "PD", // Penyakit Dalam
  },
  {
    id: "u3",
    username: "farmasi@simrs.com",
    password: "farmasi123",
    role: "farmasi",
  },
]
