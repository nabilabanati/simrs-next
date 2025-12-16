import React, { useEffect } from 'react';

interface QueueTicketModalProps {
  queueNumber: string;
  nrm: string;
  patientName: string;
  poliName: string;
  doctorName: string;
  onClose: () => void;
}

export default function QueueTicketModal({
  queueNumber,
  nrm,
  patientName,
  poliName,
  doctorName,
  onClose,
}: QueueTicketModalProps) {
  useEffect(() => {
    // Auto-close after 3 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
      <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full mx-4 animate-in zoom-in-95 duration-300">
        {/* Ticket Content */}
        <div className="p-6 border-4 border-dashed border-gray-800 rounded-lg">
          {/* Header */}
          <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
            <h2 className="text-xl font-bold uppercase">RUMAH SAKIT</h2>
            <p className="text-sm text-gray-600">Antrian Poliklinik</p>
          </div>

          {/* Queue Number - Large */}
          <div className="text-center border-2 border-gray-800 bg-gray-100 py-6 mb-4 rounded">
            <p className="text-xs text-gray-600 mb-2">Nomor Antrian</p>
            <p className="text-6xl font-bold text-blue-600">{queueNumber}</p>
            <p className="text-sm font-semibold text-gray-700 mt-2">{poliName}</p>
          </div>

          {/* Patient Info */}
          <div className="space-y-2 text-sm mb-4">
            <div className="flex border-b border-gray-300 pb-2">
              <span className="w-20 font-semibold text-gray-700">NRM:</span>
              <span className="flex-1 text-gray-900">{nrm}</span>
            </div>
            <div className="flex border-b border-gray-300 pb-2">
              <span className="w-20 font-semibold text-gray-700">Nama:</span>
              <span className="flex-1 text-gray-900 uppercase">{patientName}</span>
            </div>
            <div className="flex border-b border-gray-300 pb-2">
              <span className="w-20 font-semibold text-gray-700">Dokter:</span>
              <span className="flex-1 text-gray-900">{doctorName}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center border-t-2 border-gray-800 pt-4">
            <p className="text-sm font-semibold text-gray-900">
              {new Date().toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <p className="text-lg font-bold text-gray-900">
              {new Date().toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              WIB
            </p>
            <p className="text-xs text-gray-600 mt-3">Harap menunggu panggilan</p>
            <p className="text-xs text-gray-600">Terima kasih</p>
          </div>
        </div>

        {/* Auto-close indicator */}
        <div className="px-6 py-3 bg-gray-50 rounded-b-lg">
          <p className="text-xs text-center text-gray-500">
            Modal akan tertutup otomatis dalam 3 detik...
          </p>
        </div>
      </div>
    </div>
  );
}
