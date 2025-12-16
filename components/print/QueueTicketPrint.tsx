import React from 'react';

interface QueueTicketPrintProps {
  registrationNo: string;
  patientName: string;
  nrm: string;
  poli: string;
  doctor: string;
  date: string;
  time: string;
}

export function QueueTicketPrint({
  registrationNo,
  patientName,
  nrm,
  poli,
  doctor,
  date,
  time,
}: QueueTicketPrintProps) {
  return (
    <>
      <style>{`
        @media print {
          @page {
            size: 80mm 150mm;
            margin: 5mm;
          }
          body {
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="w-full max-w-[80mm] mx-auto p-4 border-2 border-dashed border-gray-800">
        {/* Header */}
        <div className="text-center border-b-2 border-gray-800 pb-3 mb-3">
          <h1 className="text-lg font-bold uppercase">RUMAH SAKIT</h1>
          <p className="text-sm">Antrian Poliklinik</p>
        </div>

        {/* Registration Number - Large */}
        <div className="text-center border-2 border-gray-800 py-4 mb-3 bg-gray-100">
          <p className="text-xs text-gray-600 mb-1">No. Registrasi</p>
          <p className="text-2xl font-bold tracking-wider">{registrationNo}</p>
        </div>

        {/* Patient Info */}
        <div className="space-y-2 text-sm mb-3">
          <div className="flex border-b border-gray-300 pb-1">
            <span className="w-20 font-semibold">NRM:</span>
            <span className="flex-1">{nrm}</span>
          </div>
          <div className="flex border-b border-gray-300 pb-1">
            <span className="w-20 font-semibold">Nama:</span>
            <span className="flex-1 uppercase">{patientName}</span>
          </div>
          <div className="flex border-b border-gray-300 pb-1">
            <span className="w-20 font-semibold">Poli:</span>
            <span className="flex-1">{poli}</span>
          </div>
          <div className="flex border-b border-gray-300 pb-1">
            <span className="w-20 font-semibold">Dokter:</span>
            <span className="flex-1">{doctor}</span>
          </div>
        </div>

        {/* Date & Time */}
        <div className="border-t-2 border-gray-800 pt-3 text-center">
          <p className="text-sm font-semibold">{date}</p>
          <p className="text-lg font-bold">{time}</p>
        </div>

        {/* Footer */}
        <div className="text-center mt-3 pt-3 border-t border-gray-300">
          <p className="text-xs text-gray-600">Harap menunggu panggilan</p>
          <p className="text-xs text-gray-600">Terima kasih</p>
        </div>
      </div>
    </>
  );
}
