export interface Doctor {
  id: string;
  user_id: string;
  nama?: string;       // join ke users.nama
  spesialis?: string;
  sip?: string;
  created_at?: string;

  // optional relasi poli (melalui doctor_poli)
  poli_ids?: string[];
  poli_names?: string[];
}
