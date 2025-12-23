// Shared types for Doctor Dashboard

export interface DoctorVisit {
    id: string;
    no: number;
    noAntrian: string;
    noRegistrasi: string;
    tanggalKunjungan: string;
    nrm: string;
    nama: string;
    jenisKelamin: string;
    ttvStatus: "belum" | "sedang_dikerjakan" | "selesai";
    status: "waiting" | "completed";
}
