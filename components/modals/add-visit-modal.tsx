import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { type Patient } from '@/lib/patient-data';
import { fetchPoli, fetchDoctorsByPoli, fetchPenjamin } from '@/lib/api-client/index';
import type { Poli, Doctor } from '@/lib/types';
import { supabaseClient as supabase } from '@/lib/supabase/client';
import { generateRegistrationNumber } from '@/lib/utils/registration-number';

// Type for penjamin data (payment methods)
interface PaymentMethod {
  id: string;
  name?: string;
  nama?: string;
  tipe?: string;
}

interface AddVisitModalProps {
  patient: Patient;
  onClose: () => void;
  onSave: (visitData: {
    poliId: string;
    poliName: string;
    dokterId: string;
    dokterName: string;
    penjaminId: string;
    penjaminName: string;
    harga: number;
    kunjunganKe: number;
    keluhan: string;
  }) => void;
}

export default function AddVisitModal({ patient, onClose, onSave }: AddVisitModalProps) {
  const [selectedPoli, setSelectedPoli] = useState<Poli | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [harga, setHarga] = useState<number>(0);
  const [keluhan, setKeluhan] = useState(''); // Renamed from notes
  const [visitCount, setVisitCount] = useState<number>(1); // Default to 1 (new visit)
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // API data states
  const [polis, setPolis] = useState<Poli[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  // Quota data states
  const [quotaData, setQuotaData] = useState<any>(null);
  const [loadingQuota, setLoadingQuota] = useState(false);

  // Load data on mount
  useEffect(() => {
    console.log('[Modal] Received patient data:', patient);
    const loadData = async () => {
      try {
        setLoading(true);
        console.time('⏱️ Total Modal Loading Time');
        console.time('⏱️ Fetch All Data');

        // Run ALL queries in parallel for better performance
        const [polisData, paymentsData, visitCountResult, penjaminResult] = await Promise.all([
          fetchPoli(),
          fetchPenjamin(),
          // Count previous visits
          patient.id
            ? supabase.from('visits').select('*', { count: 'exact', head: true }).eq('patient_id', patient.id)
            : Promise.resolve({ count: 0, error: null }),
          // Fetch patient's default penjamin
          patient.id
            ? supabase.from('patient_penjamin').select('penjamin_id, penjamin(nama)').eq('patient_id', patient.id).single()
            : Promise.resolve({ data: null, error: null })
        ]);

        console.timeEnd('⏱️ Fetch All Data');
        console.log('[Modal] ✅ Polis loaded:', polisData?.length, 'items');
        console.log('[Modal] ✅ Payment methods loaded:', paymentsData?.length, 'items');

        setPolis(polisData);
        setPaymentMethods(paymentsData);

        // Set visit count
        if (visitCountResult.count !== null && !visitCountResult.error) {
          setVisitCount(visitCountResult.count + 1);
        }

        // Set default payment method
        if (!penjaminResult.error && penjaminResult.data) {
          console.log('[Modal] Patient penjamin:', penjaminResult.data);
          const matchedPayment = paymentsData.find((p: PaymentMethod) =>
            p.id === penjaminResult.data.penjamin_id ||
            (p.nama || p.name)?.toLowerCase() === (penjaminResult.data.penjamin as any)?.nama?.toLowerCase()
          );
          if (matchedPayment) {
            setSelectedPayment(matchedPayment);
            console.log('[Modal] Set default payment from penjamin:', matchedPayment);
          }
        } else if (patient.payment) {
          // Fallback to patient.payment field if exists
          const matchedPayment = paymentsData.find((p: PaymentMethod) =>
            (p.nama || p.name)?.toLowerCase().includes(patient.payment.toLowerCase()) ||
            patient.payment.toLowerCase().includes((p.nama || p.name)?.toLowerCase() || '')
          );
          if (matchedPayment) {
            setSelectedPayment(matchedPayment);
            console.log('[Modal] Set default payment from patient.payment:', matchedPayment);
          }
        }

        // Fetch quota data (non-blocking)
        fetchQuotaData();

        console.timeEnd('⏱️ Total Modal Loading Time');

      } catch (error) {
        console.error('[Modal] ❌ Error loading data:', error);
        console.timeEnd('⏱️ Total Modal Loading Time');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [patient.id]);

  // Fetch quota data
  const fetchQuotaData = async () => {
    setLoadingQuota(true);
    try {
      const res = await fetch('/api/loket/quota-status', {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setQuotaData(data.data);
        console.log('[Modal] Quota data loaded:', data.data);
      }
    } catch (error) {
      console.error('[Modal] Failed to fetch quota:', error);
    } finally {
      setLoadingQuota(false);
    }
  };

  // Load doctors when poli changes
  useEffect(() => {
    if (selectedPoli) {
      const loadDoctors = async () => {
        const doctorsData = await fetchDoctorsByPoli(selectedPoli.id);
        console.log('[Modal] Loaded doctors for', selectedPoli.nama, ':', doctorsData);
        setDoctors(doctorsData);
      };
      loadDoctors();
    } else {
      setDoctors([]);
    }
  }, [selectedPoli]);

  // Auto-generate harga when payment is UMUM - Flat rate 50,000 IDR
  useEffect(() => {
    if ((selectedPayment?.nama || selectedPayment?.name)?.toUpperCase().includes('UMUM')) {
      setHarga(50000); // Flat rate for all Umum patients
    } else {
      setHarga(0);
    }
  }, [selectedPayment]);

  const handlePoliChange = (poliId: string) => {
    const poli = polis.find(p => p.id === poliId);
    setSelectedPoli(poli || null);
    setSelectedDoctor(null);
    setErrors((prev) => ({ ...prev, poli: false }));
  };

  const handleDoctorChange = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    console.log('[Modal] Selected doctor:', doctor);
    setSelectedDoctor(doctor || null);
    setErrors((prev) => ({ ...prev, doctor: false }));
  };

  const handlePaymentChange = (paymentId: string) => {
    const payment = paymentMethods.find(p => p.id === paymentId);
    setSelectedPayment(payment || null);
    setErrors((prev) => ({ ...prev, payment: false }));
  };

  const validateForm = () => {
    const newErrors: Record<string, boolean> = {};
    if (!selectedPoli) newErrors.poli = true;
    if (!selectedDoctor) newErrors.doctor = true;
    if (!selectedPayment) newErrors.payment = true;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    console.log('[Modal] handleSave called');
    console.log('[Modal] Selected values:', { selectedPoli, selectedDoctor, selectedPayment });

    if (validateForm() && selectedPoli && selectedDoctor && selectedPayment) {
      console.log('[Modal] Validation passed, calling onSave');
      // No need to generate registration number - it's auto-generated by database trigger
      onSave({
        poliId: selectedPoli.id,
        poliName: selectedPoli.nama || '',
        dokterId: selectedDoctor.id,
        dokterName: selectedDoctor.nama || '',
        penjaminId: selectedPayment.id,
        penjaminName: selectedPayment.nama || selectedPayment.name || '',
        harga: harga,
        kunjunganKe: visitCount,
        keluhan: keluhan,
      });
    } else {
      console.log('[Modal] Validation failed');
      console.log('[Modal] Errors:', errors);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full shadow-2xl animate-in fade-in slide-in-from-bottom-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg sticky top-0 z-10">
          <h3 className="text-lg font-semibold text-center uppercase">
            KUNJUNGAN RAWAT JALAN BARU
          </h3>
        </div>

        {/* Form Content */}
        <div className="px-6 py-6">
          <div className="space-y-6">
            {/* Patient Info Section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-bold text-blue-600 mb-3 uppercase text-sm">
                INFORMASI PASIEN
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 uppercase">
                    Kunjungan Ke
                  </label>
                  <input
                    type="text"
                    value={visitCount}
                    readOnly
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-blue-50 font-bold text-blue-700 text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 uppercase">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={today}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 uppercase">
                    Nama Pasien
                  </label>
                  <input
                    type="text"
                    value={patient.nama || patient.name || '-'}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 uppercase">
                    NRM
                  </label>
                  <input
                    type="text"
                    value={patient.nrm || '-'}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Form Fields - 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Poli Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 uppercase">
                    Poliklinik <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedPoli?.id || ''}
                    onChange={(e) => handlePoliChange(e.target.value)}
                    disabled={loading}
                    className={`w-full py-2 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.poli ? 'border-red-500 ring-red-200' : 'border-gray-200'
                      } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  >
                    <option value="">{loading ? 'Loading...' : 'Pilih poliklinik'}</option>
                    {polis.map((p: Poli) => {
                      const quotaInfo = quotaData?.poli?.find((q: any) => q.id === p.id);
                      const isFullPoli = quotaInfo?.isFull || false;
                      const quotaText = quotaInfo
                        ? ` (${quotaInfo.available}/${quotaInfo.quota} tersisa)${isFullPoli ? ' - PENUH' : ''}`
                        : '';

                      return (
                        <option key={p.id} value={p.id} disabled={isFullPoli}>
                          {p.nama}{quotaText}
                        </option>
                      );
                    })}
                  </select>
                  {errors.poli && <p className="text-red-500 text-xs mt-1">Harap pilih poliklinik!</p>}
                </div>

                {/* Doctor Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 uppercase">
                    Dokter <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedDoctor?.id || ''}
                    onChange={(e) => handleDoctorChange(e.target.value)}
                    disabled={!selectedPoli}
                    className={`w-full py-2 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.doctor ? 'border-red-500 ring-red-200' : 'border-gray-200'
                      } ${!selectedPoli ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  >
                    <option value="">Pilih dokter</option>
                    {doctors.map((doc) => {
                      const quotaInfo = quotaData?.doctors?.find((q: any) => q.id === doc.id);
                      const isFullDoctor = quotaInfo?.isFull || false;
                      const quotaText = quotaInfo
                        ? ` (${quotaInfo.available}/${quotaInfo.quota} tersisa)${isFullDoctor ? ' - PENUH' : ''}`
                        : '';

                      return (
                        <option key={doc.id} value={doc.id} disabled={isFullDoctor}>
                          {doc.nama || doc.id}{quotaText}
                        </option>
                      );
                    })}
                  </select>
                  {errors.doctor && <p className="text-red-500 text-xs mt-1">Harap pilih dokter!</p>}
                  {selectedPoli && doctors.length === 0 && (
                    <p className="text-yellow-600 text-xs mt-1">Tidak ada dokter untuk poli ini</p>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Payment Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 uppercase">
                    Cara Bayar <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedPayment?.id || ''}
                    onChange={(e) => handlePaymentChange(e.target.value)}
                    disabled={loading}
                    className={`w-full py-2 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.payment ? 'border-red-500 ring-red-200' : 'border-gray-200'
                      } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  >
                    <option value="">{loading ? 'Loading...' : 'Pilih cara bayar'}</option>
                    {paymentMethods
                      .filter((pm) => {
                        const name = (pm.nama || pm.name || '').toUpperCase().trim();
                        // Exact match only untuk BPJS, UMUM, ASURANSI
                        return name === 'BPJS' || name === 'UMUM' || name === 'ASURANSI';
                      })
                      .map((pm) => (
                        <option key={pm.id} value={pm.id}>{pm.nama || pm.name}</option>
                      ))
                    }
                  </select>
                  {errors.payment && <p className="text-red-500 text-xs mt-1">Harap pilih cara bayar!</p>}
                </div>

                {/* Harga Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 uppercase">
                    Harga
                  </label>
                  <input
                    type="text"
                    value={harga > 0 ? `Rp ${harga.toLocaleString('id-ID')}` : '-'}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-100 cursor-not-allowed font-semibold text-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Keluhan (Notes) - Full Width */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 uppercase">
                Keluhan (Anamnesa Awal)
              </label>
              <textarea
                value={keluhan}
                onChange={(e) => setKeluhan(e.target.value)}
                placeholder="Masukkan keluhan utama pasien..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
              variant="outline"
            >
              Batal
            </Button>
            <Button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Simpan Kunjungan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
