export interface Nurse {
  id: string;
  user_id: string;
  nama?: string;        // join from users
  created_at?: string;

  // optional relasi
  poli_ids?: string[];
  poli_names?: string[];
}
