import React from 'react';

interface PatientIdentityPrintProps {
  nrm: string;
  name: string;
  birthPlace: string;
  birthDate: string;
  gender: string;
  address: string;
  phone: string;
  bloodType?: string;
}

export function PatientIdentityPrint({
  nrm,
  name,
  birthPlace,
  birthDate,
  gender,
  address,
  phone,
  bloodType,
}: PatientIdentityPrintProps) {
  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A6 landscape;
            margin: 5mm;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="w-full max-w-[148mm] h-[105mm] mx-auto border-4 border-blue-600 rounded-lg p-4">
        {/* Header */}
        <div className="text-center border-b-4 border-blue-600 pb-3 mb-4">
          <h1 className="text-2xl font-bold text-blue-600 uppercase">
            KARTU IDENTITAS PASIEN
          </h1>
          <p className="text-sm text-gray-600">Rumah Sakit XYZ</p>
        </div>

        {/* Content */}
        <div className="grid grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-600 uppercase">No. Rekam Medis</label>
              <p className="text-2xl font-bold text-blue-600">{nrm}</p>
            </div>
            <div>
              <label className="text-xs text-gray-600 uppercase">Nama Lengkap</label>
              <p className="text-lg font-semibold uppercase">{name}</p>
            </div>
            <div>
              <label className="text-xs text-gray-600 uppercase">Tempat, Tanggal Lahir</label>
              <p className="text-sm">{birthPlace}, {birthDate}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-600 uppercase">Jenis Kelamin</label>
                <p className="text-sm font-medium">{gender === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
              </div>
              {bloodType && (
                <div>
                  <label className="text-xs text-gray-600 uppercase">Gol. Darah</label>
                  <p className="text-sm font-medium">{bloodType}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-600 uppercase">Alamat</label>
              <p className="text-sm leading-relaxed">{address}</p>
            </div>
            <div>
              <label className="text-xs text-gray-600 uppercase">No. Telepon</label>
              <p className="text-sm font-medium">{phone}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-4 right-4 text-right">
          <p className="text-xs text-gray-500">Dicetak: {new Date().toLocaleDateString('id-ID')}</p>
        </div>
      </div>
    </>
  );
}
