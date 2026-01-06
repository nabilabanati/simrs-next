import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface QueueTicketModalProps {
  queueNumber: string;
  registrationNo: string;
  nrm: string;
  patientName: string;
  poliName: string;
  doctorName: string;
  paymentMethod: string;
  price?: number;
  bpjsNumber?: string;
  insuranceNumber?: string;
  onClose: () => void;
}

export default function QueueTicketModal({
  queueNumber,
  registrationNo,
  nrm,
  patientName,
  poliName,
  doctorName,
  paymentMethod,
  price,
  bpjsNumber,
  insuranceNumber,
  onClose,
}: QueueTicketModalProps) {
  const [staffName, setStaffName] = useState('');

  useEffect(() => {
    const fetchStaffName = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single();
        
        if (userData) {
          setStaffName(userData.name);
        }
      }
    };
    fetchStaffName();
  }, []);

  const handlePrint = () => {
    // Only trigger browser print dialog when user explicitly clicks print
    window.print();
  };

  const cardNumber = paymentMethod.toUpperCase().includes('BPJS') 
    ? bpjsNumber 
    : paymentMethod.toUpperCase().includes('ASURANSI') 
    ? insuranceNumber 
    : '';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full mx-4 animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
        {/* Ticket Content */}
        <div className="p-6">
          {/* Header */}
          <div className="text-center pb-4 mb-4">
            <h2 className="text-base font-bold uppercase tracking-wider">LAYANAN KESEHATAN</h2>
            <p className="text-xs text-gray-600 mt-1">STRUK RAWAT JALAN</p>
          </div>

          {/* Queue Number - PROMINENT */}
          <div className="text-center border-2 border-gray-900 py-4 mb-4 rounded">
            <p className="text-xs font-medium text-gray-700 mb-1">Nomor Antrian Poli</p>
            <p className="text-3xl font-black text-gray-900 tracking-wider">{registrationNo.slice(-3)}</p>
          </div>

          {/* Registration Info */}
          <div className="space-y-1.5 text-xs mb-4">
            <div className="flex">
              <span className="w-36 text-gray-700">No. Registrasi</span>
              <span className="flex-1 text-gray-900">: {registrationNo}</span>
            </div>
            <div className="flex">
              <span className="w-36 text-gray-700">Tanggal Registrasi</span>
              <span className="flex-1 text-gray-900">: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Patient Info */}
          <div className="space-y-1.5 text-xs mb-4">
            <div className="flex">
              <span className="w-36 text-gray-700">NRM</span>
              <span className="flex-1 text-gray-900">: {nrm}</span>
            </div>
            <div className="flex">
              <span className="w-36 text-gray-700">Nama Pasien</span>
              <span className="flex-1 text-gray-900 uppercase">: {patientName}</span>
            </div>
          </div>

          {/* Poli & Doctor Info */}
          <div className="space-y-1.5 text-xs mb-4">
            <div className="flex">
              <span className="w-36 text-gray-700">Poliklinik</span>
              <span className="flex-1 text-gray-900">: {poliName}</span>
            </div>
            <div className="flex">
              <span className="w-36 text-gray-700">Dokter</span>
              <span className="flex-1 text-gray-900">: {doctorName}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="space-y-1.5 text-xs mb-4">
            <div className="flex">
              <span className="w-36 text-gray-700">Cara Bayar</span>
              <span className="flex-1 text-gray-900">: {paymentMethod}</span>
            </div>
            {paymentMethod.toUpperCase().includes('UMUM') && price ? (
              <div className="flex">
                <span className="w-36 text-gray-700">Harga</span>
                <span className="flex-1 text-gray-900">: Rp {price.toLocaleString('id-ID')}</span>
              </div>
            ) : paymentMethod.toUpperCase().includes('BPJS') && bpjsNumber ? (
              <div className="flex">
                <span className="w-36 text-gray-700">No. BPJS</span>
                <span className="flex-1 text-gray-900">: {bpjsNumber}</span>
              </div>
            ) : paymentMethod.toUpperCase().includes('ASURANSI') && insuranceNumber ? (
              <div className="flex">
                <span className="w-36 text-gray-700">No. Asuransi</span>
                <span className="flex-1 text-gray-900">: {insuranceNumber}</span>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="text-center pt-4 mt-4">
            <p className="text-xs text-gray-700 font-bold">Serahkan ke Poliklinik</p>
            <p className="text-xs text-gray-700">Harap menunggu panggilan</p>
            <p className="text-xs text-gray-700">Terima Kasih</p>
          </div>
        </div>

        {/* Print Styles */}
        <style>{`
          @media print {
            body, html {
              margin: 0;
              padding: 0;
              background: white;
            }
            .fixed, .z-50, .animate-in, .fade-in {
              position: static !important;
              z-index: auto !important;
              animation: none !important;
              background: white !important;
            }
            button, [role="button"] {
              display: none !important;
            }
            .print\\:block {
              display: block !important;
            }
            @page {
              size: 80mm 180mm;
              margin: 5mm;
            }
          }
        `}</style>

      </div>
    </div>
  );
}
