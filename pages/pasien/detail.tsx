'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
} from 'lucide-react';
import { MASTER_PATIENTS } from '@/lib/dummy/master/patients';
import type { PatientData } from '@/lib/shared/types/patient';

interface Patient extends Omit<PatientData, 'status'> {
  status?: 'Aktif' | 'Nonaktif';
}

interface VisitHistory {
  id: number;
  tanggalTindakan: string;
  lokasiPelayanan: string;
  namaTindakan: string;
  dokterPJ: string;
  catatanMedis: string;
  statusTindakan: string;
  detil?: {
    diagnosis: string;
    tekananDarah: string;
    nadi: string;
    suhu: string;
    beratBadan: string;
    tinggiTadan: string;
    keluhanUtama: string;
    pemeriksaanFisik: string;
    resepObat: string;
    anjuran: string;
  };
}

const VISIT_HISTORY: { [key: string]: VisitHistory[] } = {
  '000001': [
    {
      id: 1,
      tanggalTindakan: '18 Juni 2025',
      lokasiPelayanan: 'Poli Umum',
      namaTindakan: 'Pemeriksaan Fisik',
      dokterPJ: 'dr. Julian Amato',
      catatanMedis: 'Tensi cukup tinggi, Hipertensi',
      statusTindakan: 'Dirujuk ke Poli Penyakit Dalam',
      detil: {
        diagnosis: 'Hipertensi Primer (I10)',
        tekananDarah: '160/95 mmHg',
        nadi: '88 bpm',
        suhu: '36.5°C',
        beratBadan: '75 kg',
        tinggiTadan: '170 cm',
        keluhanUtama: 'Sakit kepala, pusing terutama pagi hari',
        pemeriksaanFisik: 'Pasien tampak sakit ringan, kesadaran compos mentis',
        resepObat: 'Amlodipine 5mg 1x1, Captopril 25mg 2x1',
        anjuran: 'Diet rendah garam, olahraga teratur, kontrol 2 minggu',
      },
    },
    {
      id: 2,
      tanggalTindakan: '18 Juli 2025',
      lokasiPelayanan: 'Poli Penyakit Dalam',
      namaTindakan: 'Pemeriksaan Fisik',
      dokterPJ: 'dr. Sho',
      catatanMedis: 'Tensi sudah terkontrol',
      statusTindakan: 'Pulang',
      detil: {
        diagnosis: 'Hipertensi Terkontrol',
        tekananDarah: '130/80 mmHg',
        nadi: '78 bpm',
        suhu: '36.2°C',
        beratBadan: '73 kg',
        tinggiTadan: '170 cm',
        keluhanUtama: 'Tidak ada keluhan khusus',
        pemeriksaanFisik: 'Pasien tampak sehat, tekanan darah terkontrol',
        resepObat: 'Lanjut Amlodipine 5mg 1x1',
        anjuran: 'Diet rendah garam, olahraga teratur, kontrol 3 bulan lagi',
      },
    },
  ],
  '000002': [
    {
      id: 1,
      tanggalTindakan: '20 Juni 2025',
      lokasiPelayanan: 'Poli Gigi',
      namaTindakan: 'Pembersihan Gigi',
      dokterPJ: 'drg. Andi Prasetyo, Sp.KG',
      catatanMedis: 'Pembersihan karang gigi',
      statusTindakan: 'Pulang',
      detil: {
        diagnosis: 'Karies Gigi',
        tekananDarah: '120/80 mmHg',
        nadi: '72 bpm',
        suhu: '36.5°C',
        beratBadan: '60 kg',
        tinggiTadan: '165 cm',
        keluhanUtama: 'Sakit gigi',
        pemeriksaanFisik: 'Terdapat karies pada gigi posterior',
        resepObat: 'Sikat gigi teratur, hindari makanan manis',
        anjuran: 'Kontrol 6 bulan',
      },
    },
  ],
};

const calculateAge = (tanggalLahir: string): number => {
  let birthDate: Date;
  
  if (tanggalLahir.includes('-')) {
    birthDate = new Date(tanggalLahir);
  } else {
    const months: { [key: string]: number } = {
      'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5,
      'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11,
    };
    const parts = tanggalLahir.split(' ');
    const day = parseInt(parts[0]);
    const month = months[parts[1]] || 0;
    const year = parseInt(parts[2]);
    birthDate = new Date(year, month, day);
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const getStatusBadgeColor = (status: string) => {
  if (status.includes('Dirujuk') || status.includes('Pindah')) {
    return 'bg-blue-100 text-blue-800';
  }
  if (status.includes('Pulang')) {
    return 'bg-green-100 text-green-800';
  }
  if (status.includes('Rawat')) {
    return 'bg-red-100 text-red-800';
  }
  return 'bg-gray-100 text-gray-800';
};

export default function PatientDetailPage() {
  const router = useRouter();
  const { nrm } = router.query;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visitHistory, setVisitHistory] = useState<VisitHistory[]>([]);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<VisitHistory | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [filteredVisits, setFilteredVisits] = useState<VisitHistory[]>([]);

  const ITEMS_PER_PAGE = 10;

  // Load patient data
  useEffect(() => {
    if (!nrm) return;

    const foundPatient = MASTER_PATIENTS.find((p) => p.nrm === nrm) as Patient;
    if (foundPatient) {
      setPatient({
        ...foundPatient,
        status: 'Aktif',
      });

      const history = VISIT_HISTORY[nrm as string] || [];
      setVisitHistory(history);
      setFilteredVisits(history);
    }
  }, [nrm]);

  // Filter visits
  useEffect(() => {
    let filtered = visitHistory;

    if (searchInput) {
      const search = searchInput.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.namaTindakan.toLowerCase().includes(search) ||
          v.dokterPJ.toLowerCase().includes(search) ||
          v.lokasiPelayanan.toLowerCase().includes(search)
      );
    }

    if (dateFilter) {
      filtered = filtered.filter((v) => v.tanggalTindakan === dateFilter);
    }

    setFilteredVisits(filtered);
    setCurrentPage(1);
  }, [searchInput, dateFilter, visitHistory]);

  const toggleRowExpand = (id: number) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const openDetailModal = (visit: VisitHistory) => {
    setSelectedVisit(visit);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedVisit(null);
  };

  const resetFilters = () => {
    setSearchInput('');
    setDateFilter('');
    setCurrentPage(1);
  };

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const paginatedVisits = filteredVisits.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const totalPages = Math.ceil(filteredVisits.length / ITEMS_PER_PAGE);

  const age = calculateAge(patient.tanggalLahir);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-6 py-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <a href="/" className="hover:text-gray-900">
              Home
            </a>
            <span>›</span>
            <a href="/pasien" className="hover:text-gray-900">
              Loket Pendaftaran
            </a>
            <span>›</span>
            <span className="text-gray-900 font-medium">Detail Pasien</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Patient Info Card */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-start justify-between pb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-semibold text-gray-800">
                    {patient.nama}
                  </h1>
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
                    {patient.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-1">NRM: {patient.nrm}</p>
                <p className="text-sm text-gray-500">
                  Tanggal Terdaftar: {patient.tanggalTerdaftar || patient.tanggalLahir}
                </p>
              </div>
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Kembali
              </Button>
            </CardHeader>

            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Column 1 - Identitas */}
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-bold text-gray-700 block mb-1">
                    No. Reg
                  </Label>
                  <p className="text-sm text-gray-600">
                    REG-{patient.tanggalLahir.replace(/\//g, '').replace(/-/g, '')}-
                    {patient.nrm}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-bold text-gray-700 block mb-1">
                    NIK
                  </Label>
                  <p className="text-sm text-gray-600">{patient.nik}</p>
                </div>
                <div>
                  <Label className="text-xs font-bold text-gray-700 block mb-1">
                    Tgl. Lahir / Umur
                  </Label>
                  <p className="text-sm text-gray-600">
                    {patient.tanggalLahir} / {age} tahun
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-bold text-gray-700 block mb-1">
                    Jenis Kelamin
                  </Label>
                  <p className="text-sm text-gray-600">
                    {patient.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-bold text-gray-700 block mb-1">
                    Alamat
                  </Label>
                  <p className="text-sm text-gray-600">{patient.alamat}</p>
                </div>
              </div>

              {/* Column 2 - Pelayanan */}
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-bold text-gray-700 block mb-1">
                    Dokter PJ
                  </Label>
                  <p className="text-sm text-gray-600">
                    {patient.layananTerakhir || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-bold text-gray-700 block mb-1">
                    Jenis
                  </Label>
                  <p className="text-sm text-gray-600">{patient.penjamin}</p>
                </div>
                <div>
                  <Label className="text-xs font-bold text-gray-700 block mb-1">
                    Asal Rujukan
                  </Label>
                  <p className="text-sm text-gray-600">
                    {patient.asalRujukan || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-bold text-gray-700 block mb-1">
                    No. Rujukan
                  </Label>
                  <p className="text-sm text-gray-600">
                    {patient.noRujukan || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-bold text-gray-700 block mb-1">
                    No. BPJS / No. SEP
                  </Label>
                  <p className="text-sm text-gray-600">
                    {patient.penjamin === 'BPJS' ? '0001234567890' : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-bold text-gray-700 block mb-1">
                    Alergi
                  </Label>
                  <p className="text-sm text-gray-600">Tidak ada</p>
                </div>
                <div>
                  <Label className="text-xs font-bold text-gray-700 block mb-1">
                    Penyakit Khusus
                  </Label>
                  <p className="text-sm text-gray-600">
                    {patient.catatanKhusus || 'Tidak ada'}
                  </p>
                </div>
              </div>

              {/* Column 3 - Penanggung Jawab */}
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-bold text-gray-700 block mb-1">
                    Penanggung Jawab
                  </Label>
                  <p className="text-sm text-gray-600">{patient.namaPJ}</p>
                </div>
                <div>
                  <Label className="text-xs font-bold text-gray-700 block mb-1">
                    No. Telp PJ
                  </Label>
                  <p className="text-sm text-gray-600">
                    {patient.noTelpPJ || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-bold text-gray-700 block mb-1">
                    Hubungan dengan Pasien
                  </Label>
                  <p className="text-sm text-gray-600">Keluarga</p>
                </div>
                <div className="text-xs text-gray-500 pt-4 border-t">
                  * Untuk mengganti data Penanggung Jawab silahkan hubungi
                  pendaftran
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visit History Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Data Tindakan</h2>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-medium text-gray-700 mb-2 block">
                    Cari Tindakan / Dokter / Lokasi
                  </Label>
                  <Input
                    placeholder="Cari"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700 mb-2 block">
                    Tanggal Tindakan
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="text-sm"
                    />
                    <Button
                      onClick={resetFilters}
                      variant="outline"
                      className="text-sm"
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-start text-xs font-bold text-gray-800 uppercase w-12">
                        No.
                      </th>
                      <th className="px-4 py-3 text-start text-xs font-bold text-gray-800 uppercase">
                        Tanggal Tindakan
                      </th>
                      <th className="px-4 py-3 text-start text-xs font-bold text-gray-800 uppercase">
                        Lokasi Pelayanan
                      </th>
                      <th className="px-4 py-3 text-start text-xs font-bold text-gray-800 uppercase">
                        Nama Tindakan
                      </th>
                      <th className="px-4 py-3 text-start text-xs font-bold text-gray-800 uppercase">
                        Dokter PJ
                      </th>
                      <th className="px-4 py-3 text-start text-xs font-bold text-gray-800 uppercase">
                        Catatan Medis
                      </th>
                      <th className="px-4 py-3 text-start text-xs font-bold text-gray-800 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedVisits.map((visit, idx) => (
                      <tr key={visit.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {visit.tanggalTindakan}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {visit.lokasiPelayanan}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {visit.namaTindakan}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {visit.dokterPJ}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">
                              {visit.catatanMedis.substring(0, 30)}
                              {visit.catatanMedis.length > 30 ? '...' : ''}
                            </span>
                            {visit.detil && (
                              <button
                                onClick={() => toggleRowExpand(visit.id)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <ChevronDown
                                  className={`w-4 h-4 transition-transform ${
                                    expandedRows.includes(visit.id)
                                      ? 'rotate-180'
                                      : ''
                                  }`}
                                />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                              visit.statusTindakan
                            )}`}
                          >
                            {visit.statusTindakan}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Expanded Detail Rows */}
              {paginatedVisits.map((visit) =>
                expandedRows.includes(visit.id) && visit.detil ? (
                  <div
                    key={`detail-${visit.id}`}
                    className="mt-4 p-4 bg-gray-50 rounded-lg text-sm"
                  >
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="mb-2">
                          <strong>Diagnosis:</strong> {visit.detil.diagnosis}
                        </p>
                        <p className="mb-2">
                          <strong>Tekanan Darah:</strong>{' '}
                          {visit.detil.tekananDarah}
                        </p>
                        <p className="mb-2">
                          <strong>Nadi:</strong> {visit.detil.nadi}
                        </p>
                        <p className="mb-2">
                          <strong>Suhu:</strong> {visit.detil.suhu}
                        </p>
                      </div>
                      <div>
                        <p className="mb-2">
                          <strong>Berat Badan:</strong>{' '}
                          {visit.detil.beratBadan}
                        </p>
                        <p className="mb-2">
                          <strong>Tinggi Badan:</strong>{' '}
                          {visit.detil.tinggiTadan}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="mb-2">
                        <strong>Keluhan Utama:</strong> {visit.detil.keluhanUtama}
                      </p>
                      <p className="mb-2">
                        <strong>Pemeriksaan Fisik:</strong>{' '}
                        {visit.detil.pemeriksaanFisik}
                      </p>
                      <p className="mb-2">
                        <strong>Resep Obat:</strong> {visit.detil.resepObat}
                      </p>
                      <p className="mb-2">
                        <strong>Anjuran:</strong> {visit.detil.anjuran}
                      </p>
                    </div>
                    <button
                      onClick={() => openDetailModal(visit)}
                      className="text-blue-600 hover:underline text-sm mt-3"
                    >
                      Lihat Detail Lengkap
                    </button>
                  </div>
                ) : null
              )}

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Menampilkan{' '}
                  {filteredVisits.length > 0
                    ? (currentPage - 1) * ITEMS_PER_PAGE + 1
                    : 0}{' '}
                  -{' '}
                  {Math.min(
                    currentPage * ITEMS_PER_PAGE,
                    filteredVisits.length
                  )}{' '}
                  dari {filteredVisits.length} data
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() =>
                      setCurrentPage((p) => Math.max(1, p - 1))
                    }
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <Button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        variant={
                          currentPage === page ? 'default' : 'outline'
                        }
                        size="sm"
                        className="min-w-10"
                      >
                        {page}
                      </Button>
                    )
                  )}
                  <Button
                    onClick={() =>
                      setCurrentPage((p) =>
                        Math.min(totalPages, p + 1)
                      )
                    }
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedVisit && selectedVisit.detil && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lg">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">
                Detail Pemeriksaan
              </h2>
              <button
                onClick={closeDetailModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Tanggal:</strong>
                  </p>
                  <p className="text-sm text-gray-900">
                    {selectedVisit.tanggalTindakan}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Lokasi:</strong>
                  </p>
                  <p className="text-sm text-gray-900">
                    {selectedVisit.lokasiPelayanan}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Tindakan:</strong>
                  </p>
                  <p className="text-sm text-gray-900">
                    {selectedVisit.namaTindakan}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Dokter PJ:</strong>
                  </p>
                  <p className="text-sm text-gray-900">
                    {selectedVisit.dokterPJ}
                  </p>
                </div>
              </div>

              <div className="mb-6 pb-6 border-b">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Hasil Pemeriksaan
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Diagnosis</p>
                    <p className="text-sm text-gray-900">
                      {selectedVisit.detil.diagnosis}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Tekanan Darah</p>
                    <p className="text-sm text-gray-900">
                      {selectedVisit.detil.tekananDarah}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Nadi</p>
                    <p className="text-sm text-gray-900">
                      {selectedVisit.detil.nadi}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Suhu</p>
                    <p className="text-sm text-gray-900">
                      {selectedVisit.detil.suhu}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Berat Badan</p>
                    <p className="text-sm text-gray-900">
                      {selectedVisit.detil.beratBadan}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Tinggi Badan</p>
                    <p className="text-sm text-gray-900">
                      {selectedVisit.detil.tinggiTadan}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Catatan Medis
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Keluhan Utama</p>
                    <p className="text-sm text-gray-900">
                      {selectedVisit.detil.keluhanUtama}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">
                      Pemeriksaan Fisik
                    </p>
                    <p className="text-sm text-gray-900">
                      {selectedVisit.detil.pemeriksaanFisik}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Resep Obat</p>
                    <p className="text-sm text-gray-900">
                      {selectedVisit.detil.resepObat}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Anjuran</p>
                    <p className="text-sm text-gray-900">
                      {selectedVisit.detil.anjuran}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <Button
                onClick={closeDetailModal}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
