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
import { supabaseClient as supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Patient {
  id: string;
  nrm: string;
  nama: string;
  nik: string;
  tanggal_lahir: string;
  tempat_lahir: string;
  jenis_kelamin: string;
  no_telp?: string;
  golongan_darah: string;
  status_nikah: string;
  pekerjaan: string;
  catatan_khusus: string;
  alamat: string;
  penanggung_jawab: string;
  nama_pj: string;
  pekerjaan_pj: string;
  created_at: string;
  patient_penjamin?: Array<{
    penjamin: {
      nama: string;
    };
  }>;
}

const ROWS_PER_PAGE = 15;

export default function PatientListPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Fetch patients from Supabase
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select(`
          *,
          patient_penjamin(
            penjamin:penjamin_id(nama)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Gagal memuat data pasien');
    } finally {
      setLoading(false);
    }
  };

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
      const penjaminName = patient.patient_penjamin?.[0]?.penjamin?.nama || 'UMUM';
      const penjaminMatch = !filterPenjamin || penjaminName.toLowerCase() === filterPenjamin.toLowerCase();
      const genderMatch = !filterGender || patient.jenis_kelamin === filterGender;
      const searchMatch = !searchInput ||
        patient.nrm.toLowerCase().includes(searchInput.toLowerCase()) ||
        patient.nama.toLowerCase().includes(searchInput.toLowerCase()) ||
        patient.nik.toLowerCase().includes(searchInput.toLowerCase());

      return penjaminMatch && genderMatch && searchMatch;
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
    const headers = ['NO.', 'NRM', 'NAMA PASIEN', 'NIK', 'UMUR', 'JK', 'NO TELP', 'PENJAMIN'];
    const rows = filteredPatients.map((patient, idx) => [
      startIndex + idx + 1,
      patient.nrm,
      patient.nama,
      patient.nik,
      calculateAge(patient.tanggal_lahir),
      patient.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan',
      patient.no_telp || '-',
      patient.patient_penjamin?.[0]?.penjamin?.nama || 'UMUM',
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
    const headers = ['NO.', 'NRM', 'NAMA PASIEN', 'NIK', 'UMUR', 'JK', 'NO TELP', 'PENJAMIN'];
    const rows = filteredPatients.map((patient, idx) => [
      startIndex + idx + 1,
      patient.nrm,
      patient.nama,
      patient.nik,
      calculateAge(patient.tanggal_lahir),
      patient.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan',
      patient.no_telp || '-',
      patient.patient_penjamin?.[0]?.penjamin?.nama || 'UMUM',
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
                        <TableCell className="px-6 py-4 text-gray-900">{calculateAge(patient.tanggal_lahir)} tahun</TableCell>
                        <TableCell className="px-6 py-4 text-gray-900">
                          {patient.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-gray-900">{patient.no_telp || '-'}</TableCell>
                        <TableCell className="px-6 py-4 text-gray-900">
                          {patient.patient_penjamin?.[0]?.penjamin?.nama || 'UMUM'}
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
                  NRM. {selectedPatient.nrm} | Terdaftar: {new Date(selectedPatient.created_at).toLocaleDateString('id-ID')}
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
                  <p><strong>Tanggal Lahir:</strong> {selectedPatient.tanggal_lahir}</p>
                  <p><strong>Tempat Lahir:</strong> {selectedPatient.tempat_lahir}</p>
                  <p><strong>Jenis Kelamin:</strong> {selectedPatient.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                  <p><strong>No. Telp:</strong> {selectedPatient.no_telp || '-'}</p>
                  <p><strong>Golongan Darah:</strong> {selectedPatient.golongan_darah}</p>
                  <p><strong>Status Nikah:</strong> {selectedPatient.status_nikah}</p>
                  <p><strong>Pekerjaan:</strong> {selectedPatient.pekerjaan}</p>
                  <p><strong>Catatan Khusus:</strong> {selectedPatient.catatan_khusus || '-'}</p>
                  <p><strong>Alamat:</strong> {selectedPatient.alamat}</p>
                </div>
                <div className="space-y-2">
                  <p><strong>Penanggung Jawab:</strong> {selectedPatient.penanggung_jawab}</p>
                  <p><strong>Nama PJ:</strong> {selectedPatient.nama_pj}</p>
                  <p><strong>Pekerjaan PJ:</strong> {selectedPatient.pekerjaan_pj}</p>
                  <p><strong>Penjamin:</strong> {selectedPatient.patient_penjamin?.[0]?.penjamin?.nama || 'UMUM'}</p>
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
