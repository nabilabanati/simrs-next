export interface Medicine {
  id: string;
  kode?: string;
  nama: string;
  harga: number;
  created_at?: string;
}

export interface MedicineStock {
  id: string;
  medicine_id: string;
  lokasi: string;
  qty: number;
  updated_at?: string;
}
