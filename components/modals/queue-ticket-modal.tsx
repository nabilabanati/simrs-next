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

    // Auto-close after 5 seconds (simulate receipt display)
    const closeTimer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => {
      clearTimeout(closeTimer);
    };
  }, []);

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      const cardNumber = paymentMethod.toUpperCase().includes('BPJS') 
        ? bpjsNumber 
        : paymentMethod.toUpperCase().includes('ASURANSI') 
        ? insuranceNumber 
        : '';

      printWindow.document.write(`
        <html>
        <head>
          <title>Bukti Registrasi - ${registrationNo}</title>
          <style>
            @page { size: 80mm auto; margin: 5mm; }
            body { font-family: 'Courier New', monospace; margin: 0; padding: 10px; font-size: 11px; }
            .ticket { padding: 15px 10px; }
            .header { text-align: center; padding-bottom: 15px; margin-bottom: 15px; }
            .header h2 { margin: 0; font-size: 14px; letter-spacing: 2px; }
            .header p { margin: 3px 0 0 0; font-size: 11px; }
            .queue-box { text-align: center; border: 2px solid #000; padding: 12px; margin: 15px 0; }
            .queue-box p:first-child { font-size: 11px; margin: 0 0 5px 0; }
            .queue-box p:last-child { font-size: 28px; font-weight: bold; margin: 0; letter-spacing: 3px; }
            .info-row { display: flex; margin: 5px 0; }
            .info-row .label { width: 140px; }
            .info-row .value { flex: 1; }

            .footer { text-align: center; padding-top: 15px; margin-top: 15px; }
            .footer p { margin: 3px 0; font-size: 10px; }
            .staff-info { text-align: center; margin: 15px 0 0 0; padding-top: 10px; border-top: 1px dashed #000; }
            .staff-info p { margin: 3px 0; font-size: 10px; }
            .staff-info .title { font-weight: bold; }
            .staff-info .name { margin-top: 25px; border-bottom: 1px solid #000; display: inline-block; min-width: 150px; padding-bottom: 2px; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <h2>LAYANAN KESEHATAN</h2>
              <p>STRUK RAWAT JALAN</p>
            </div>
            
            <div class="queue-box">
              <p>Nomor Antrian Poli</p>
              <p>${registrationNo.slice(-3)}</p>
            </div>

            <div class="info-row">
              <span class="label">No. Registrasi</span>
              <span class="value">: ${registrationNo}</span>
            </div>
            <div class="info-row">
              <span class="label">Tanggal Registrasi</span>
              <span class="value">: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>

            <div class="info-row">
              <span class="label">NRM</span>
              <span class="value">: ${nrm}</span>
            </div>
            <div class="info-row">
              <span class="label">Nama Pasien</span>
              <span class="value">: ${patientName.toUpperCase()}</span>
            </div>

            <div class="divider"></div>

            <div class="info-row">
              <span class="label">Poliklinik</span>
              <span class="value">: ${poliName}</span>
            </div>
            <div class="info-row">
              <span class="label">Dokter</span>
              <span class="value">: ${doctorName}</span>
            </div>

            <div class="divider"></div>

            <div class="info-row">
              <span class="label">Cara Bayar</span>
              <span class="value">: ${paymentMethod}</span>
            </div>
            ${paymentMethod.toUpperCase().includes('UMUM') && price 
              ? `<div class="info-row"><span class="label">Harga</span><span class="value">: Rp ${price.toLocaleString('id-ID')}</span></div>` 
              : paymentMethod.toUpperCase().includes('BPJS') && bpjsNumber
              ? `<div class="info-row"><span class="label">No. BPJS</span><span class="value">: ${bpjsNumber}</span></div>`
              : paymentMethod.toUpperCase().includes('ASURANSI') && insuranceNumber
              ? `<div class="info-row"><span class="label">No. Asuransi</span><span class="value">: ${insuranceNumber}</span></div>`
              : ''}

            <div class="footer">
              <p>Serahkan ke Poliklinik</p>
              <p>Harap menunggu panggilan</p>
              <p>Terima Kasih</p>
            </div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
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

      </div>
    </div>
  );
}
