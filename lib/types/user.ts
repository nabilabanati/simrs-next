export interface User {
  id: string;
  username: string;
  nama: string;
  role: "superadmin" | "admin" | "loket" | "dokter" | "nurse" | "farmasi" | "kasir";
  created_at?: string;
}
