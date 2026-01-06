'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Building2, Calendar, User } from 'lucide-react';

interface DoctorSchedule {
  id: number;
  nama: string;
  spesialisasi: string;
  poli: string;
  jamMulai: string;
  jamSelesai: string;
  status: 'Praktek' | 'Libur' | 'Darurat';
}

// Dummy data jadwal dokter
const DUMMY_SCHEDULES: DoctorSchedule[] = [
  {
    id: 1,
    nama: 'Dr. Ahmad Fauzi, Sp.U',
    spesialisasi: 'Spesialis Urologi',
    poli: 'POLI UMUM',
    jamMulai: '08:00',
    jamSelesai: '14:00',
    status: 'Praktek',
  },
  {
    id: 2,
    nama: 'Dr. Siti Nurhaliza, drg',
    spesialisasi: 'Dokter Gigi',
    poli: 'POLI GIGI',
    jamMulai: '08:00',
    jamSelesai: '12:00',
    status: 'Praktek',
  },
  {
    id: 3,
    nama: 'Dr. Budi Santoso, Sp.OG',
    spesialisasi: 'Spesialis Obstetri & Ginekologi',
    poli: 'POLI KIA/KB',
    jamMulai: '09:00',
    jamSelesai: '15:00',
    status: 'Praktek',
  },
  {
    id: 4,
    nama: 'Dr. Rina Wijaya, Sp.A',
    spesialisasi: 'Spesialis Anak',
    poli: 'POLI ANAK',
    jamMulai: '08:00',
    jamSelesai: '13:00',
    status: 'Praktek',
  },
  {
    id: 5,
    nama: 'Dr. Hendra Gunawan, Sp.M',
    spesialisasi: 'Spesialis Mata',
    poli: 'POLI MATA',
    jamMulai: '10:00',
    jamSelesai: '16:00',
    status: 'Praktek',
  },
  {
    id: 6,
    nama: 'Dr. Maya Kusuma, Sp.THT',
    spesialisasi: 'Spesialis THT',
    poli: 'POLI THT',
    jamMulai: '08:00',
    jamSelesai: '14:00',
    status: 'Praktek',
  },
  {
    id: 7,
    nama: 'Dr. Rudi Hartono, Sp.KK',
    spesialisasi: 'Spesialis Kulit & Kelamin',
    poli: 'POLI KULIT & KELAMIN',
    jamMulai: '09:00',
    jamSelesai: '15:00',
    status: 'Praktek',
  },
  {
    id: 8,
    nama: 'Dr. Dewi Lestari, Sp.PD',
    spesialisasi: 'Spesialis Penyakit Dalam',
    poli: 'POLI PENYAKIT DALAM',
    jamMulai: '08:00',
    jamSelesai: '14:00',
    status: 'Praktek',
  },
  {
    id: 9,
    nama: 'Dr. Agus Setiawan, Sp.B',
    spesialisasi: 'Spesialis Bedah',
    poli: 'POLI BEDAH',
    jamMulai: '13:00',
    jamSelesai: '17:00',
    status: 'Praktek',
  },
  {
    id: 10,
    nama: 'Dr. Fitri Handayani, Sp.KJ',
    spesialisasi: 'Spesialis Kesehatan Jiwa',
    poli: 'POLI JIWA',
    jamMulai: '08:00',
    jamSelesai: '12:00',
    status: 'Libur',
  },
];

export default function DoctorScheduleDisplay() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [schedules] = useState<DoctorSchedule[]>(DUMMY_SCHEDULES);

  // Initialize time on client-side only to prevent hydration error
  useEffect(() => {
    setCurrentTime(new Date());
  }, []);

  // Update time every second
  useEffect(() => {
    if (!currentTime) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [currentTime]);

  const timeString =
    currentTime?.toLocaleTimeString('id-ID', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) || '--:--:--';

  const dateString =
    currentTime?.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }) || '-';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Praktek':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'Libur':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'Darurat':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 font-inter">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 shadow-xl">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Building2 className="w-10 h-10" />
              <div>
                <h1 className="text-3xl font-bold">LAYANAN KESEHATAN</h1>
                <p className="text-blue-100 text-sm mt-1">Informasi Jadwal Praktek Dokter</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-3 justify-end mb-1">
                <Clock className="w-6 h-6" />
                <span className="text-3xl font-bold">{timeString}</span>
              </div>
              <div className="flex items-center space-x-2 justify-end text-blue-100">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">{dateString}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-6">
        {/* Title Section */}
        <div className="mb-6">
          <Card className="shadow-lg border-l-4 border-l-blue-600">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 text-center">
                JADWAL PRAKTEK DOKTER HARI INI
              </h2>
            </CardContent>
          </Card>
        </div>

        {/* Doctor Schedule Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.map((schedule) => (
            <Card
              key={schedule.id}
              className={`shadow-lg hover:shadow-xl transition-all duration-300 ${
                schedule.status === 'Praktek'
                  ? 'border-l-4 border-l-green-500'
                  : schedule.status === 'Libur'
                  ? 'border-l-4 border-l-red-500 opacity-75'
                  : 'border-l-4 border-l-yellow-500'
              }`}
            >
              <CardHeader className="bg-gradient-to-r from-blue-50 to-white pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2 flex-1">
                    <User className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <CardTitle className="text-lg font-bold text-gray-800 leading-tight">
                      {schedule.nama}
                    </CardTitle>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                      schedule.status
                    )} whitespace-nowrap ml-2`}
                  >
                    {schedule.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                    Spesialisasi
                  </p>
                  <p className="text-sm text-gray-700 font-medium">
                    {schedule.spesialisasi}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                    Poliklinik
                  </p>
                  <p className="text-sm text-blue-600 font-bold">{schedule.poli}</p>
                </div>
                {schedule.status === 'Praktek' && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                      Jam Praktek
                    </p>
                    <div className="flex items-center justify-center space-x-2 bg-blue-50 rounded-lg p-3">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <span className="text-xl font-bold text-blue-700">
                        {schedule.jamMulai}
                      </span>
                      <span className="text-gray-400">-</span>
                      <span className="text-xl font-bold text-blue-700">
                        {schedule.jamSelesai}
                      </span>
                    </div>
                  </div>
                )}
                {schedule.status === 'Libur' && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-center text-sm text-red-600 font-semibold">
                      Dokter tidak praktek hari ini
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer Message */}
        <div className="mt-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg overflow-hidden shadow-lg">
            <div className="py-4 px-6">
              <div className="overflow-hidden">
                <p className="text-white font-medium text-lg animate-marquee whitespace-nowrap inline-block">
                  Untuk informasi lebih lanjut, silakan hubungi bagian pendaftaran atau loket
                  informasi - Terima kasih atas kunjungan Anda - Semoga lekas sembuh
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Marquee Animation */}
      <style jsx>{`
        @keyframes marquee {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(-100%);
          }
        }

        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
