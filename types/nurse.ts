// Shared types for Nurse Dashboard

export interface Patient {
    id: string;
    nrm: string;
    nama: string;
    nik: string;
    tanggal_lahir: string;
    jenis_kelamin: string;
}

export interface Poli {
    id: string;
    nama: string;
}

export interface Triase {
    id: string;
    perawat_id: string;
    tensi: string;
    nadi: number;
    suhu: number;
    spo2: number;
    resp: number;
    catatan: string;
}

export interface Visit {
    id: string;
    no_reg: string;
    status: string;
    ttv_status: string;
    ttv_done: boolean;
    created_at: string;
    patient: Patient;
    poli: Poli;
    triase?: Triase;
}

export interface TTVFormData {
    tensi: string;
    nadi: string;
    suhu: string;
    spo2: string;
    resp: string;
    catatan: string;
}
