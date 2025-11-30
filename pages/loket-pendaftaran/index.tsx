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
import {
  RotateCcw,
  Volume2,
  SkipForward,
  Plus,
  ChevronDown,
  Eye,
  Clock,
} from 'lucide-react';
import { patientData, type Patient } from '@/lib/patient-data';
import { fetchClinics, fetchAllDoctors, fetchPaymentMethods } from '@/lib/api-client';
import type { Clinic } from '@/pages/api/clinics';
import type { Doctor } from '@/pages/api/doctors';
import type { PaymentMethod } from '@/pages/api/payment-methods';
import AddVisitModal from '@/components/modals/add-visit-modal';

export default function RegistrationDeskPage() {
  const router = useRouter();
  const [filteredData, setFilteredData] = useState<Patient[]>(patientData);
  const [currentQueue, setCurrentQueue] = useState(1);
  const [currentLoket, setCurrentLoket] = useState(1);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // Filter states
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [filterClinic, setFilterClinic] = useState('');
  const [filterDoctor, setFilterDoctor] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // API data states
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // Load API data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [clinicsData, doctorsData, paymentsData] = await Promise.all([
          fetchClinics(),
          fetchAllDoctors(),
          fetchPaymentMethods(),
        ]);
        setClinics(clinicsData);
        setDoctors(doctorsData);
        setPaymentMethods(paymentsData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState({
    clinic: '',
    doctor: '',
    payment: '',
  });

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Apply filters
  const applyFilter = () => {
    let filtered = patientData.filter((patient) => {
      let matches = true;

      // Date range filter
      if (dateFrom || dateTo) {
        const [day, month, year] = patient.date.split('/');
        const patientDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          if (patientDate < fromDate) matches = false;
        }

        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (patientDate > toDate) matches = false;
        }
      }

      // Payment filter
      if (filterPayment && patient.payment !== filterPayment) matches = false;

      // Clinic filter
      if (filterClinic && patient.clinic !== filterClinic) matches = false;

      // Doctor filter
      if (filterDoctor && patient.doctor !== filterDoctor) matches = false;

      // Search filter
      if (searchInput) {
        const search = searchInput.toLowerCase().trim();
        const searchMatch =
          patient.nrm.toLowerCase().includes(search) ||
          patient.name.toLowerCase().includes(search) ||
          patient.nik.toLowerCase().includes(search);
        if (!searchMatch) matches = false;
      }

      return matches;
    });

    setFilteredData(filtered);
  };

  // Reset filters
  const resetFilter = () => {
    setDateFrom('');
    setDateTo('');
    setFilterPayment('');
    setFilterClinic('');
    setFilterDoctor('');
    setSearchInput('');
    setFilteredData(patientData);
  };

  // Queue functions
  const handleCallNext = () => {
    if (currentQueue >= 50) {
      alert('Antrian sudah mencapai batas maksimal hari ini.');
      return;
    }
    const nextQueue = currentQueue + 1;
    setCurrentQueue(nextQueue);
    announceQueue(nextQueue);
    broadcastQueueUpdate(nextQueue);
  };

  const handleRepeatCall = () => {
    if (currentQueue < 1) {
      alert('Belum ada antrian yang dipanggil.');
      return;
    }
    announceQueue(currentQueue);
    broadcastQueueUpdate(currentQueue);
  };

  const handleResetQueue = () => {
    if (confirm('Yakin ingin reset antrian? Semua data antrian akan dikembalikan ke awal.')) {
      setCurrentQueue(1);
      broadcastQueueUpdate(1);
      alert('Antrian telah direset ke nomor 001.');
    }
  };

  const announceQueue = (queueNum: number) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const queueInIndonesian = numberToIndonesian(queueNum);
      const loketInIndonesian = numberToIndonesian(currentLoket);
      const speech = new SpeechSynthesisUtterance(
        `Nomor antrian ${queueInIndonesian}, silakan menuju loket ${loketInIndonesian}`
      );
      speech.lang = 'id-ID';
      speech.rate = 0.7;
      window.speechSynthesis.speak(speech);
    }
  };

  const numberToIndonesian = (num: number): string => {
    const units = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];
    const teens = ['sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas', 'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas'];
    const tens = ['', '', 'dua puluh', 'tiga puluh', 'empat puluh', 'lima puluh', 'enam puluh', 'tujuh puluh', 'delapan puluh', 'sembilan puluh'];

    if (num === 0) return 'nol';
    if (num < 10) return units[num];
    if (num === 10) return 'sepuluh';
    if (num === 11) return 'sebelas';
    if (num < 20) return teens[num - 10];
    if (num < 100) {
      const ten = Math.floor(num / 10);
      const unit = num % 10;
      return tens[ten] + (unit > 0 ? ' ' + units[unit] : '');
    }
    return String(num);
  };

  const broadcastQueueUpdate = (queueNum: number) => {
    const updateData = {
      currentNumber: queueNum,
      loket: currentLoket,
      timestamp: Date.now(),
    };

    // Broadcast via localStorage
    localStorage.setItem('dashboardQueueUpdate', JSON.stringify(updateData));

    // Dispatch custom event for real-time update
    window.dispatchEvent(
      new CustomEvent('queueUpdate', {
        detail: updateData,
      })
    );
  };

  const handleAddVisit = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData((prev) => ({
      ...prev,
      payment: patient.payment,
    }));
    setShowAddModal(true);
  };

  const handleSaveVisit = (clinic: string, doctor: string, payment: string) => {
    setFormData({ clinic, doctor, payment });
    setShowAddModal(false);
    setShowReceiptModal(true);
  };

  const timeString = currentTime.toLocaleTimeString('id-ID', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const dateString = currentTime.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case 'Pulang':
        return 'bg-blue-100 text-blue-800';
      case 'Pindah Poli':
        return 'bg-yellow-100 text-yellow-800';
      case 'Rawat Inap':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Filter Section and Queue Display */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
            {/* Filter Section */}
            <div className="xl:col-span-2 bg-blue-50 p-4 lg:p-6 rounded-lg border border-blue-200">
              <h2 className="text-lg font-bold text-blue-600 mb-6">FILTER DATA</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mb-6">
                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium mb-2">TANGGAL REGISTRASI</label>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600 font-medium">s.d.</span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Payment Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">CARA BAYAR</label>
                  <select
                    value={filterPayment}
                    onChange={(e) => setFilterPayment(e.target.value)}
                    className="w-full py-3 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Semua</option>
                    {paymentMethods.map((pm) => (
                      <option key={pm.id} value={pm.name}>{pm.name}</option>
                    ))}
                  </select>
                </div>

                {/* Clinic Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">POLIKLINIK</label>
                  <select
                    value={filterClinic}
                    onChange={(e) => setFilterClinic(e.target.value)}
                    className="w-full py-3 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Semua</option>
                    {clinics.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Doctor Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">DOKTER</label>
                  <select
                    value={filterDoctor}
                    onChange={(e) => setFilterDoctor(e.target.value)}
                    className="w-full py-3 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Semua</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search and Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Ketik NRM, Nama Pasien, atau NIK"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full py-3 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={applyFilter}
                    className="px-4 lg:px-6 py-2 bg-green-100 text-green-600 border border-green-300 hover:bg-green-200 text-sm font-medium"
                    variant="outline"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                    Cari
                  </Button>
                  <Button
                    onClick={resetFilter}
                    className="px-4 lg:px-6 py-2 bg-red-100 text-red-600 border border-red-300 hover:bg-red-200 text-sm font-medium"
                    variant="outline"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    Reset
                  </Button>
                </div>
              </div>
            </div>

            {/* Queue Display */}
            <div className="bg-blue-50 border border-blue-200 p-4 lg:p-6 rounded-lg flex flex-col justify-center items-center min-h-[250px]">
              <div className="text-left mb-6 w-full">
                <p className="text-sm text-gray-600 font-medium">
                  Sisa Antrian Loket
                  <span className="font-bold text-blue-600 ml-2">{currentLoket}</span>
                  <span className="mx-2">:</span>
                  <span className="font-bold text-blue-600">{50 - currentQueue}</span>
                </p>
              </div>

              <div className="text-center mb-8">
                <div className="text-8xl lg:text-9xl font-bold text-blue-600 tracking-wider">
                  {String(currentQueue).padStart(3, '0')}
                </div>
              </div>

              <div className="flex justify-center gap-3 lg:gap-4">
                <Button
                  onClick={handleResetQueue}
                  className="w-20 h-12 lg:w-24 lg:h-14 bg-red-600 hover:bg-red-700 text-white"
                  title="Reset Antrian"
                >
                  <RotateCcw className="w-6 h-6" />
                </Button>
                <Button
                  onClick={handleRepeatCall}
                  className="w-20 h-12 lg:w-24 lg:h-14 bg-blue-600 hover:bg-blue-700 text-white"
                  title="Panggil Antrian"
                >
                  <Volume2 className="w-6 h-6" />
                </Button>
                <Button
                  onClick={handleCallNext}
                  className="w-20 h-12 lg:w-24 lg:h-14 bg-green-600 hover:bg-green-700 text-white"
                  title="Antrian Selanjutnya"
                >
                  <SkipForward className="w-6 h-6" />
                </Button>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-xl font-bold text-blue-600 uppercase">
              DATA PASIEN RAWAT JALAN
            </h2>
            <Button onClick={() => router.push('/pasien/create')} className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Pasien
            </Button>
          </div>

          {/* Patient Table */}
          <Card className="border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-blue-50">
                  <tr className="text-left text-xs font-semibold text-gray-700 uppercase">
                    <th className="px-6 py-3 font-bold text-gray-800">NO</th>
                    <th className="px-6 py-3 font-bold text-gray-800">AKSI</th>
                    <th className="px-6 py-3 font-bold text-gray-800">TANGGAL</th>
                    <th className="px-6 py-3 font-bold text-gray-800">NRM</th>
                    <th className="px-6 py-3 font-bold text-gray-800">NAMA PASIEN</th>
                    <th className="px-6 py-3 font-bold text-gray-800">NIK</th>
                    <th className="px-6 py-3 font-bold text-gray-800">J.K.</th>
                    <th className="px-6 py-3 font-bold text-gray-800">POLIKLINIK</th>
                    <th className="px-6 py-3 font-bold text-gray-800">DOKTER PJ</th>
                    <th className="px-6 py-3 font-bold text-gray-800">CARA BAYAR</th>
                    <th className="px-6 py-3 font-bold text-gray-800">TINDAK LANJUT</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 text-sm text-gray-700">
                  {filteredData.map((patient, idx) => (
                    <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 text-center">{idx + 1}</td>
                      <td className="px-6 py-3 text-center">
                        <div className="relative group inline-block">
                          <button className="px-3 py-2 text-blue-600 hover:bg-blue-200 rounded text-xs flex items-center gap-1">
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <div className="absolute left-0 top-full hidden group-hover:block bg-white min-w-48 shadow-lg border rounded-lg z-50 mt-1">
                            <button
                              onClick={() => handleAddVisit(patient)}
                              className="w-full flex items-center gap-3 py-2 px-3 text-blue-800 hover:bg-blue-100 text-sm text-left"
                            >
                              <Plus className="w-4 h-4" />
                              Tambah Kunjungan
                            </button>
                            <button className="w-full flex items-center gap-3 py-2 px-3 text-blue-800 hover:bg-blue-100 text-sm text-left">
                              <Eye className="w-4 h-4" />
                              Lihat Detail
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3">{patient.date}</td>
                      <td className="px-6 py-3 font-medium">{patient.nrm}</td>
                      <td className="px-6 py-3">{patient.name}</td>
                      <td className="px-6 py-3">{patient.nik}</td>
                      <td className="px-6 py-3 text-center">{patient.gender}</td>
                      <td className="px-6 py-3">{patient.clinic}</td>
                      <td className="px-6 py-3">{patient.doctor}</td>
                      <td className="px-6 py-3">{patient.payment}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium ${getActionBadgeClass(patient.action)}`}>
                          {patient.action}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 border-t bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600">
                Menampilkan 1-{filteredData.length} dari {filteredData.length} data
              </p>
              <div className="flex space-x-1">
                <button className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border rounded">‹</button>
                <button className="px-3 py-2 text-sm bg-blue-500 text-white rounded">1</button>
                <button className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900 border rounded">2</button>
                <button className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900 border rounded">3</button>
                <button className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">...</button>
                <button className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900 border rounded">10</button>
                <button className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border rounded">›</button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && selectedPatient && (
        <AddVisitModal
          patient={selectedPatient}
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveVisit}
        />
      )}

      {/* {showReceiptModal && selectedPatient && (
        <ReceiptModal
          patient={selectedPatient}
          clinic={formData.clinic}
          doctor={formData.doctor}
          payment={formData.payment}
          onClose={() => setShowReceiptModal(false)}
        />
      )} */}
    </div>
  );
}
