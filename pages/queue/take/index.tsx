'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, TicketIcon, Building2 } from 'lucide-react';

export default function QueueTake() {
    const [queueData, setQueueData] = useState<{
        queue_number: number;
        loket_nama: string;
        message: string;
    } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleTakeQueue = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/queue/take', {
                method: 'POST',
            });

            const data = await response.json();

            if (response.ok) {
                setQueueData(data);
            } else {
                alert('Gagal mengambil nomor antrian: ' + data.error);
            }
        } catch (error) {
            console.error('Error taking queue:', error);
            alert('Terjadi kesalahan saat mengambil nomor antrian');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleReset = () => {
        setQueueData(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl shadow-2xl">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-800 text-white">
                    <div className="flex items-center justify-center space-x-3">
                        <Building2 className="w-8 h-8" />
                        <CardTitle className="text-2xl">RSUD SLAWI - Ambil Nomor Antrian</CardTitle>
                    </div>
                </CardHeader>

                <CardContent className="p-8">
                    {!queueData ? (
                        <div className="text-center space-y-6">
                            <div className="mb-8">
                                <TicketIcon className="w-32 h-32 mx-auto text-purple-600 mb-4" />
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                    Selamat Datang
                                </h2>
                                <p className="text-gray-600">
                                    Silakan ambil nomor antrian Anda dengan menekan tombol di bawah
                                </p>
                            </div>

                            <Button
                                onClick={handleTakeQueue}
                                disabled={loading}
                                className="w-full h-20 text-2xl font-bold bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                {loading ? 'Mengambil Nomor...' : 'AMBIL NOMOR ANTRIAN'}
                            </Button>

                            <div className="mt-8 p-4 bg-purple-50 rounded-lg">
                                <h3 className="font-semibold text-purple-800 mb-2">Petunjuk:</h3>
                                <ul className="text-sm text-gray-700 space-y-1 text-left">
                                    <li>• Tekan tombol "AMBIL NOMOR ANTRIAN"</li>
                                    <li>• Simpan nomor antrian Anda</li>
                                    <li>• Tunggu panggilan di ruang tunggu</li>
                                    <li>• Perhatikan layar display untuk nomor Anda</li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-6 print:space-y-4">
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">
                                    Nomor Antrian Anda
                                </h2>

                                <div className="bg-purple-100 rounded-lg p-8 mb-4">
                                    <div className="text-8xl font-black text-purple-600 mb-4">
                                        {String(queueData.queue_number).padStart(3, '0')}
                                    </div>
                                    <div className="text-2xl font-bold text-gray-800">
                                        {queueData.loket_nama}
                                    </div>
                                </div>

                                <p className="text-gray-600 mb-4">
                                    {queueData.message}
                                </p>

                                <div className="text-sm text-gray-500">
                                    {new Date().toLocaleString('id-ID', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </div>
                            </div>

                            <div className="flex gap-4 print:hidden">
                                <Button
                                    onClick={handlePrint}
                                    variant="outline"
                                    className="flex-1 h-14 text-lg"
                                >
                                    <Printer className="w-5 h-5 mr-2" />
                                    Cetak Tiket
                                </Button>
                                <Button
                                    onClick={handleReset}
                                    className="flex-1 h-14 text-lg bg-purple-600 hover:bg-purple-700"
                                >
                                    Ambil Nomor Lagi
                                </Button>
                            </div>

                            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg print:hidden">
                                <p className="text-sm text-yellow-800">
                                    <strong>Penting:</strong> Harap simpan nomor antrian Anda dan tunggu panggilan di ruang tunggu.
                                    Perhatikan layar display untuk nomor antrian Anda.
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Print Styles */}
            <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:space-y-4,
          .print\\:space-y-4 * {
            visibility: visible;
          }
          .print\\:space-y-4 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
        </div>
    );
}
