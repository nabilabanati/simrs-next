import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { type Patient } from '@/lib/patient-data';
import { fetchPoli, fetchDoctorsByClinic, fetchPaymentMethods } from '@/lib/api-client';
import type { Poli, Doctor, PaymentMethod } from '@/lib/api-client';
import { supabaseClient as supabase } from '@/lib/supabase/client';
import { generateRegistrationNumber } from '@/lib/utils/registration-number';

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

  // Load data on mount
  useEffect(() => {
    console.log('[Modal] Received patient data:', patient); // Debug log
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('[Modal] Loading data...');
        const [polisData, paymentsData] = await Promise.all([
          fetchPoli(),
          fetchPaymentMethods(),
        ]);
        
        setPolis(polisData);
        setPaymentMethods(paymentsData);
        
        // Count previous visits
        if (patient.id) {
            const { count, error } = await supabase
                .from('visits')
                .select('*', { count: 'exact', head: true })
                .eq('patient_id', patient.id);
            
            if (!error && count !== null) {
                setVisitCount(count + 1);
            }
        }

        // Fetch patient's default penjamin from patient_penjamin table
        if (patient.id) {
          const { data: penjaminData, error: penjaminError } = await supabase
            .from('patient_penjamin')
            .select('penjamin_id, penjamin(nama)')
            .eq('patient_id', patient.id)
            .single();
          
          if (!penjaminError && penjaminData) {
            console.log('[Modal] Patient penjamin:', penjaminData);
            // Find matching payment method
            const matchedPayment = paymentsData.find(p => 
              p.id === penjaminData.penjamin_id ||
              p.name.toLowerCase() === penjaminData.penjamin?.nama?.toLowerCase()
            );
            if (matchedPayment) {
              setSelectedPayment(matchedPayment);
              console.log('[Modal] Set default payment from penjamin:', matchedPayment);
            }
          } else if (patient.payment) {
            // Fallback to patient.payment field if exists
            const matchedPayment = paymentsData.find(p => 
              p.name.toLowerCase().includes(patient.payment.toLowerCase()) ||
              patient.payment.toLowerCase().includes(p.name.toLowerCase())
            );
            if (matchedPayment) {
              setSelectedPayment(matchedPayment);
              console.log('[Modal] Set default payment from patient.payment:', matchedPayment);
            }
          }
        }

      } catch (error) {
        console.error('[Modal] Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [patient.id]);

  // Load doctors when poli changes
  useEffect(() => {
    if (selectedPoli) {
      const loadDoctors = async () => {
        const doctorsData = await fetchDoctorsByClinic(selectedPoli.name);
        console.log('[Modal] Loaded doctors for', selectedPoli.name, ':', doctorsData);
        setDoctors(doctorsData);
      };
      loadDoctors();
    } else {
      setDoctors([]);
    }
  }, [selectedPoli]);

  // Auto-generate harga when payment is UMUM - Flat rate 90,000 IDR
  useEffect(() => {
    if (selectedPayment?.name.toUpperCase().includes('UMUM')) {
      setHarga(90000); // Flat rate for all Umum patients
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
    if (validateForm() && selectedPoli && selectedDoctor && selectedPayment) {
      // No need to generate registration number - it's auto-generated by database trigger
      onSave({
        poliId: selectedPoli.id,
        poliName: selectedPoli.name,
        dokterId: selectedDoctor.id,
        dokterName: selectedDoctor.name,
        penjaminId: selectedPayment.id,
        penjaminName: selectedPayment.name,
        harga: harga,
        kunjunganKe: visitCount,
        keluhan: keluhan,
      });
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
                    value={patient.name || patient.nama || '-'}
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
                    className={`w-full py-2 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.poli ? 'border-red-500 ring-red-200' : 'border-gray-200'
                    } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  >
                    <option value="">{loading ? 'Loading...' : 'Pilih poliklinik'}</option>
                    {polis.map((p: Poli) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
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
                    className={`w-full py-2 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.doctor ? 'border-red-500 ring-red-200' : 'border-gray-200'
                    } ${!selectedPoli ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  >
                    <option value="">Pilih dokter</option>
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name || doc.id}
                      </option>
                    ))}
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
                    className={`w-full py-2 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.payment ? 'border-red-500 ring-red-200' : 'border-gray-200'
                    }`}
                  >
                    <option value="">Pilih cara bayar</option>
                    {paymentMethods.map((pm) => (
                      <option key={pm.id} value={pm.id}>{pm.name}</option>
                    ))}
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
                  {selectedPayment?.name.toUpperCase().includes('UMUM') && harga > 0 && (
                    <p className="text-blue-600 text-xs mt-1">✓ Harga otomatis dari tarif poli</p>
                  )}
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
