export interface PharmacyOrder {
  id: string;
  prescription_id: string;
  no_order: string;
  status: "waiting" | "packing" | "done";
  created_at?: string;
}

export interface Prescription {
  id: string;
  visit_id: string;
  created_by: string;
  no_order: string;
  status: "pending" | "ready" | "dispensed";
  created_at?: string;
}

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  medicine_id?: string | null;
  nama_obat: string;
  qty: number;
  satuan: string;
  instruksi: string;
}
