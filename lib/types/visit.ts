export interface Visit {
  id: string;
  patient_id: string;
  poli_id: string | null;
  dokter_id: string | null;

  no_reg: string;
  status: "menunggu" | "dipanggil" | "sedang_diperiksa" | "selesai";

  ttv_status: "belum" | "sedang_dikerjakan" | "selesai";
  ttv_done: boolean;

  created_at?: string;
}
