import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { type Patient } from '@/lib/patient-data';

interface ReceiptModalProps {
  patient: Patient;
  clinic: string;
  doctor: string;
  payment: string;
  onClose: () => void;
}

export default function ReceiptModal({
  patient,
  clinic,
  doctor,
  payment,
  onClose,
}: ReceiptModalProps) {
  const [regNumber, setRegNumber] = useState('');
  const [dateString, setDateString] = useState('');

  useEffect(() => {
    const today = new Date();
    const regNum = `DG-${today.getFullYear()}${String(today.getMonth() + 1).padStart(
      2,
      '0'
    )}${String(today.getDate()).padStart(2, '0')}-${String(patient.id).padStart(
      2,
      '0'
    )}`;
    const dateStr = today.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    setRegNumber(regNum);
    setDateString(dateStr);
  }, [patient.id]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg w-full max-w-sm shadow-2xl animate-in fade-in slide-in-from-bottom-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-lg">
          <h3 className="text-lg font-semibold text-center uppercase">
            STRUK RAWAT JALAN
          </h3>
        </div>

        {/* Receipt Content */}
        <div className="p-6">
          {/* Hospital Name */}
          <div className="text-center pb-4 mb-4 border-b border-dashed border-gray-300">
            <h4 className="text-lg font-bold text-gray-900">RSUD SLAWI</h4>
            <p className="text-sm font-semibold text-gray-600">STRUK RAWAT JALAN</p>
          </div>

          {/* Receipt Details */}
          <div className="space-y-3 text-sm">
            {/* Registration Number */}
            <div className="grid grid-cols-[auto_auto_1fr] gap-2">
              <span className="text-gray-700">No. Registrasi</span>
              <span className="text-gray-700">:</span>
              <span className="text-gray-900 font-medium">{regNumber}</span>
            </div>

            {/* Visit Date */}
            <div className="grid grid-cols-[auto_auto_1fr] gap-2">
              <span className="text-gray-700">Tanggal Kunjungan</span>
              <span className="text-gray-700">:</span>
              <span className="text-gray-900 font-medium">{dateString}</span>
            </div>

            {/* Separator */}
            <div className="border-t border-dashed border-gray-300 my-2"></div>

            {/* Patient NRM */}
            <div className="grid grid-cols-[auto_auto_1fr] gap-2">
              <span className="text-gray-700">NRM</span>
              <span className="text-gray-700">:</span>
              <span className="text-gray-900 font-medium">{patient.nrm}</span>
            </div>

            {/* Patient Name */}
            <div className="grid grid-cols-[auto_auto_1fr] gap-2">
              <span className="text-gray-700">Nama Pasien</span>
              <span className="text-gray-700">:</span>
              <span className="text-gray-900 font-medium">{patient.name}</span>
            </div>

            {/* Separator */}
            <div className="border-t border-dashed border-gray-300 my-2"></div>

            {/* Clinic */}
            <div className="grid grid-cols-[auto_auto_1fr] gap-2">
              <span className="text-gray-700">Poli Tujuan</span>
              <span className="text-gray-700">:</span>
              <span className="text-gray-900 font-medium">{clinic || '-'}</span>
            </div>

            {/* Doctor */}
            <div className="grid grid-cols-[auto_auto_1fr] gap-2">
              <span className="text-gray-700">Dokter Tujuan</span>
              <span className="text-gray-700">:</span>
              <span className="text-gray-900 font-medium">{doctor || '-'}</span>
            </div>

            {/* Payment Method */}
            <div className="grid grid-cols-[auto_auto_1fr] gap-2">
              <span className="text-gray-700">Cara Bayar</span>
              <span className="text-gray-700">:</span>
              <span className="text-gray-900 font-medium">{payment || '-'}</span>
            </div>
          </div>

          {/* Footer Message */}
          <div className="pt-4 mt-4 text-center text-xs text-gray-600 border-t border-dashed border-gray-300">
            <p>Harap membawa struk ini ke poli tujuan</p>
            <p>Terima kasih atas kunjungan Anda</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-sm text-gray-700 rounded-lg hover:bg-gray-50"
              variant="outline"
            >
              Tutup
            </Button>
            <Button
              onClick={handlePrint}
              className="flex-1 px-4 py-2 bg-blue-600 text-sm text-white rounded-lg hover:bg-blue-700"
            >
              Print Struk
            </Button>
          </div>

          {/* Click to close message */}
          <p className="text-center text-xs text-gray-400 mt-3">
            Klik di mana saja untuk menutup
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .fixed {
            position: static;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
