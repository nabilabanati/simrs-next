'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Eye,
  Edit2,
  Trash2,
  Plus,
  Download,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from 'lucide-react';
import { MASTER_PATIENTS } from '@/lib/dummy/master/patients';
import type { PatientData } from '@/lib/shared/types/patient';

interface Patient {
  id: string;
  nrm: string;
  nama: string;
  nik: string;
  tanggalLahir: string;
  tempatLahir: string;
  jenisKelamin: string;
  noTelpPJ?: string;
  golonganDarah: string;
  statusNikah: string;
  pekerjaan: string;
  catatanKhusus: string;
  alamat: string;
  penanggungJawab: string;
  namaPJ: string;
  pekerjaanPJ: string;
  penjamin: string;
  status: string;
  nama_instansi?: string;
  nomor_surat?: string;
  asalRujukan?: string;
  noRujukan?: string;
  kunjunganTerakhir?: string;
  layananTerakhir?: string;
  tanggalTerdaftar: string;
}

const ROWS_PER_PAGE = 15;

export default function PatientListPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPenjamin, setFilterPenjamin] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [deletePatientId, setDeletePatientId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Load patients from master data on mount
  useEffect(() => {
    setPatients(MASTER_PATIENTS as Patient[]);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('div[class*="relative"]')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Calculate age from date
  const calculateAge = (tanggalLahir: string): number => {
    let birthDate: Date;
    
    // Handle both formats: "YYYY-MM-DD" and "DD Bulan YYYY"
    if (tanggalLahir.includes('-')) {
      // Format: "YYYY-MM-DD"
      birthDate = new Date(tanggalLahir);
    } else {
      // Format: "DD Bulan YYYY"
      const months: { [key: string]: number } = {
        Januari: 0, Februari: 1, Maret: 2, April: 3,
        Mei: 4, Juni: 5, Juli: 6, Agustus: 7,
        September: 8, Oktober: 9, November: 10, Desember: 11,
      };

      const parts = tanggalLahir.split(' ');
      const day = parseInt(parts[0]);
      const month = months[parts[1]];
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

  // Filter patients
  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const statusMatch = !filterStatus || patient.status.toLowerCase() === filterStatus.toLowerCase();
      const penjaminMatch = !filterPenjamin || patient.penjamin.toLowerCase() === filterPenjamin.toLowerCase();
      const genderMatch = !filterGender || patient.jenisKelamin === filterGender;
      const searchMatch = !searchInput ||
        patient.nrm.toLowerCase().includes(searchInput.toLowerCase()) ||
        patient.nama.toLowerCase().includes(searchInput.toLowerCase()) ||
        patient.nik.toLowerCase().includes(searchInput.toLowerCase());

      return statusMatch && penjaminMatch && genderMatch && searchMatch;
    });
  }, [patients, filterStatus, filterPenjamin, filterGender, searchInput]);

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const paginatedPatients = filteredPatients.slice(startIndex, startIndex + ROWS_PER_PAGE);

  const handleResetFilter = () => {
    setFilterStatus('');
    setFilterPenjamin('');
    setFilterGender('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setSearchInput('');
    setCurrentPage(1);
  };

  const handleViewDetail = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowDetailModal(true);
  };

  const handleDeleteClick = (nrm: string) => {
    setDeletePatientId(nrm);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    // Handle delete action
    setShowDeleteModal(false);
    setDeletePatientId(null);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['NO.', 'NRM', 'NAMA PASIEN', 'NIK', 'UMUR', 'JK', 'NO TELP', 'PENJAMIN', 'STATUS'];
    const rows = filteredPatients.map((patient, idx) => [
      startIndex + idx + 1,
      patient.nrm,
      patient.nama,
      patient.nik,
      calculateAge(patient.tanggalLahir),
      patient.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan',
      patient.noTelpPJ || '-',
      patient.penjamin,
      patient.status,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pasien_${new Date().getTime()}.csv`;
    link.click();
  };

  // Export to Excel
  const exportToExcel = () => {
    const headers = ['NO.', 'NRM', 'NAMA PASIEN', 'NIK', 'UMUR', 'JK', 'NO TELP', 'PENJAMIN', 'STATUS'];
    const rows = filteredPatients.map((patient, idx) => [
      startIndex + idx + 1,
      patient.nrm,
      patient.nama,
      patient.nik,
      calculateAge(patient.tanggalLahir),
      patient.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan',
      patient.noTelpPJ || '-',
      patient.penjamin,
      patient.status,
    ]);

    let html = '<table border="1"><tr>';
    headers.forEach(header => {
      html += `<th>${header}</th>`;
    });
    html += '</tr>';

    rows.forEach(row => {
      html += '<tr>';
      row.forEach(cell => {
        html += `<td>${cell}</td>`;
      });
      html += '</tr>';
    });
    html += '</table>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pasien_${new Date().getTime()}.xls`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">DATA PASIEN</CardTitle>
              <div className="flex gap-3">
                <Button
                  onClick={() => router.push('/pasien/create')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Pasien
                </Button>
                <Button
                  onClick={exportToExcel}
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Excel
                </Button>
                <Button
                  onClick={exportToCSV}
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  CSV
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Filters */}
            <div className="bg-white rounded-lg border p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                {/* Status */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">STATUS</Label>
                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">SEMUA</option>
                    <option value="Aktif">Aktif</option>
                    <option value="Non-Aktif">Tidak Aktif</option>
                  </select>
                </div>

                {/* Penjamin */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">PENJAMIN</Label>
                  <select
                    value={filterPenjamin}
                    onChange={(e) => {
                      setFilterPenjamin(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Semua Penjamin</option>
                    <option value="UMUM">UMUM</option>
                    <option value="BPJS">BPJS</option>
                    <option value="Asuransi">Asuransi</option>
                    <option value="Jamkesda">Jamkesda</option>
                  </select>
                </div>

                {/* Gender */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">JENIS KELAMIN</Label>
                  <select
                    value={filterGender}
                    onChange={(e) => {
                      setFilterGender(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Semua</option>
                    <option value="L">LAKI-LAKI</option>
                    <option value="P">PEREMPUAN</option>
                  </select>
                </div>

                {/* Date Range */}
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium mb-2 block">TANGGAL REGISTRASI</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600">s.d.</span>
                    <Input
                      type="date"
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Search and Reset */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label className="text-sm font-medium mb-2 block">Pencarian</Label>
                  <Input
                    type="text"
                    placeholder="Cari NRM, Nama, ..."
                    value={searchInput}
                    onChange={(e) => {
                      setSearchInput(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleResetFilter}
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-blue-50">
                  <TableRow>
                    <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">AKSI</TableHead>
                    <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">NO. RM</TableHead>
                    <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">NAMA PASIEN</TableHead>
                    <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">NIK</TableHead>
                    <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">UMUR</TableHead>
                    <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">JK</TableHead>
                    <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">NO TELP</TableHead>
                    <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">PENJAMIN</TableHead>
                    <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">STATUS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPatients.length > 0 ? (
                    paginatedPatients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell className="px-6 py-4">
                          <div className="relative">
                            <button
                              onClick={() => setOpenDropdownId(openDropdownId === patient.id ? null : patient.id)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded inline-flex items-center"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            
                            {openDropdownId === patient.id && (
                              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                <button
                                  onClick={() => {
                                    handleViewDetail(patient);
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 border-b border-gray-100"
                                >
                                  <Eye className="w-4 h-4" />
                                  Lihat
                                </button>
                                <button
                                  onClick={() => {
                                    router.push(`/pasien/edit?nrm=${patient.nrm}`);
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 border-b border-gray-100"
                                >
                                  <Edit2 className="w-4 h-4" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    handleDeleteClick(patient.nrm);
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Hapus
                                </button>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 font-medium text-gray-900">{patient.nrm}</TableCell>
                        <TableCell className="px-6 py-4 text-gray-900">{patient.nama}</TableCell>
                        <TableCell className="px-6 py-4 text-gray-900">{patient.nik}</TableCell>
                        <TableCell className="px-6 py-4 text-gray-900">{calculateAge(patient.tanggalLahir)} tahun</TableCell>
                        <TableCell className="px-6 py-4 text-gray-900">
                          {patient.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-gray-900">{patient.noTelpPJ}</TableCell>
                        <TableCell className="px-6 py-4 text-gray-900">{patient.penjamin}</TableCell>
                        <TableCell className="px-6 py-4">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              patient.status === 'Aktif'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {patient.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="px-6 py-4 text-center text-gray-500">
                        Tidak ada data pasien
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Menampilkan {startIndex + 1} - {Math.min(startIndex + ROWS_PER_PAGE, filteredPatients.length)} dari{' '}
                  {filteredPatients.length} data
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const page = currentPage <= 3 ? i + 1 : currentPage + i - 2;
                    return (
                      page <= totalPages && (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      )
                    );
                  })}
                  {totalPages > 5 && currentPage < totalPages - 2 && <span className="px-2 text-gray-500">...</span>}
                  {totalPages > 5 && (
                    <Button
                      variant={currentPage === totalPages ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                    >
                      {totalPages}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedPatient && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b sticky top-0 bg-white flex justify-between items-start">
              <div>
                <CardTitle>{selectedPatient.nama}</CardTitle>
                <p className="text-sm text-gray-500 mt-2">
                  NRM. {selectedPatient.nrm} | Terdaftar: {selectedPatient.tanggalTerdaftar}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetailModal(false)}
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-2">
                  <p><strong>NIK:</strong> {selectedPatient.nik}</p>
                  <p><strong>Tanggal Lahir:</strong> {selectedPatient.tanggalLahir}</p>
                  <p><strong>Tempat Lahir:</strong> {selectedPatient.tempatLahir}</p>
                  <p><strong>Jenis Kelamin:</strong> {selectedPatient.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                  <p><strong>No. Telp PJ:</strong> {selectedPatient.noTelpPJ}</p>
                  <p><strong>Golongan Darah:</strong> {selectedPatient.golonganDarah}</p>
                  <p><strong>Status Nikah:</strong> {selectedPatient.statusNikah}</p>
                  <p><strong>Pekerjaan:</strong> {selectedPatient.pekerjaan}</p>
                  <p><strong>Catatan Khusus:</strong> {selectedPatient.catatanKhusus}</p>
                  <p><strong>Alamat:</strong> {selectedPatient.alamat}</p>
                </div>
                <div className="space-y-2">
                  <p><strong>Penanggung Jawab:</strong> {selectedPatient.penanggungJawab}</p>
                  <p><strong>Nama PJ:</strong> {selectedPatient.namaPJ}</p>
                  <p><strong>Pekerjaan PJ:</strong> {selectedPatient.pekerjaanPJ}</p>
                  <p><strong>Penjamin:</strong> {selectedPatient.penjamin}</p>
                  <p><strong>Nama Instansi:</strong> {selectedPatient.nama_instansi}</p>
                  <p><strong>No. Surat Penjamin:</strong> {selectedPatient.nomor_surat}</p>
                  <p><strong>Asal Rujukan:</strong> {selectedPatient.asalRujukan}</p>
                  <p><strong>No. Surat Rujukan:</strong> {selectedPatient.noRujukan}</p>
                  <p><strong>Riwayat Kunjungan:</strong> {selectedPatient.kunjunganTerakhir}</p>
                  <p><strong>Layanan Terakhir:</strong> {selectedPatient.layananTerakhir}</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t no-print">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailModal(false)}
                >
                  Tutup
                </Button>
                <Button
                  onClick={() => window.print()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  🖨 Print Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <style jsx>{`
        @media print {
          .no-print {
            display: none;
          }
          .fixed {
            position: static !important;
            background: white !important;
          }
          .z-50 {
            z-index: auto !important;
          }
          .bg-black\/50 {
            background: white !important;
          }
          body {
            margin: 0;
            padding: 20px;
          }
        }
      `}</style>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" />
                  </svg>
                </div>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Anda Yakin Akan Menghapus Data Pasien Ini?</h2>
              <p className="text-sm text-gray-500 mt-1">Aksi ini akan menghapus Data Pasien dari Database</p>
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Hapus
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
