import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { type Patient } from '@/lib/patient-data';
import { fetchClinics, fetchDoctorsByClinic, fetchPaymentMethods } from '@/lib/api-client';
import type { Clinic } from '@/pages/api/clinics';
import type { Doctor } from '@/pages/api/doctors';
import type { PaymentMethod } from '@/pages/api/payment-methods';

interface AddVisitModalProps {
  patient: Patient;
  onClose: () => void;
  onSave: (clinic: string, doctor: string, payment: string) => void;
}

export default function AddVisitModal({ patient, onClose, onSave }: AddVisitModalProps) {
  const [clinic, setClinic] = useState('');
  const [doctor, setDoctor] = useState('');
  const [payment, setPayment] = useState<string>(patient.payment);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // API data states
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [clinicsData, paymentsData] = await Promise.all([
          fetchClinics(),
          fetchPaymentMethods(),
        ]);
        setClinics(clinicsData);
        setPaymentMethods(paymentsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Load doctors when clinic changes
  useEffect(() => {
    if (clinic) {
      const loadDoctors = async () => {
        const doctorsData = await fetchDoctorsByClinic(clinic);
        setDoctors(doctorsData);
      };
      loadDoctors();
    } else {
      setDoctors([]);
    }
  }, [clinic]);

  const availableDoctors = doctors;

  const handleClinicChange = (value: string) => {
    setClinic(value);
    setDoctor('');
    setErrors((prev) => ({ ...prev, clinic: false }));
  };

  const handleDoctorChange = (value: string) => {
    setDoctor(value);
    setErrors((prev) => ({ ...prev, doctor: false }));
  };

  const handlePaymentChange = (value: string) => {
    setPayment(value);
    setErrors((prev) => ({ ...prev, payment: false }));
  };

  const validateForm = () => {
    const newErrors: Record<string, boolean> = {};
    if (!clinic) newErrors.clinic = true;
    if (!doctor) newErrors.doctor = true;
    if (!payment) newErrors.payment = true;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(clinic, doctor, payment);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-2xl animate-in fade-in slide-in-from-bottom-5">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
          <h3 className="text-lg font-semibold text-center uppercase">
            KUNJUNGAN RAWAT JALAN BARU
          </h3>
        </div>

        {/* Form Content */}
        <div className="px-10 py-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-blue-600 mb-4 uppercase">
                KUNJUNGAN KE-4
              </h4>
            </div>

            {/* Date Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 uppercase">
                TANGGAL KUNJUNGAN
              </label>
              <input
                type="date"
                value={today}
                readOnly
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-100 cursor-not-allowed"
              />
            </div>

            {/* Clinic Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 uppercase">
                POLIKLINIK <span className="text-red-500">*</span>
              </label>
              <select
                value={clinic}
                onChange={(e) => handleClinicChange(e.target.value)}
                disabled={loading}
                className={`w-full py-3 px-4 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.clinic ? 'border-red-500 ring-red-200' : 'border-gray-200'
                } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              >
                <option value="">{loading ? 'Loading...' : 'Pilih poliklinik di sini'}</option>
                {clinics.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
              {errors.clinic && <p className="text-red-500 text-xs mt-1">Harap pilih poliklinik!</p>}
            </div>

            {/* Doctor Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 uppercase">
                DOKTER <span className="text-red-500">*</span>
              </label>
              <select
                value={doctor}
                onChange={(e) => handleDoctorChange(e.target.value)}
                disabled={!clinic}
                className={`w-full py-3 px-4 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.doctor ? 'border-red-500 ring-red-200' : 'border-gray-200'
                } ${!clinic ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              >
                <option value="">Pilih dokter di sini</option>
                {availableDoctors.map((doc) => (
                  <option key={doc.id} value={doc.name}>{doc.name}</option>
                ))}
              </select>
              {errors.doctor && <p className="text-red-500 text-xs mt-1">Harap pilih dokter!</p>}
            </div>

            {/* Payment Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 uppercase">
                CARA BAYAR <span className="text-red-500">*</span>
              </label>
              <select
                value={payment}
                onChange={(e) => handlePaymentChange(e.target.value)}
                className={`w-full py-3 px-4 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.payment ? 'border-red-500 ring-red-200' : 'border-gray-200'
                }`}
              >
                <option value="">Pilih cara bayar</option>
                {paymentMethods.map((pm) => (
                  <option key={pm.id} value={pm.name}>{pm.name}</option>
                ))}
              </select>
              {errors.payment && <p className="text-red-500 text-xs mt-1">Harap pilih cara bayar!</p>}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 uppercase">
                KETERANGAN
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Opsional"
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-6">
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
