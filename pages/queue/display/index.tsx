'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Building2 } from 'lucide-react';

interface QueueCounter {
    id: string;
    loket_nama: string;
    current_queue: number;
    updated_at: string;
}

export default function QueueDisplay() {
    const [counters, setCounters] = useState<QueueCounter[]>([]);
    const [currentTime, setCurrentTime] = useState<Date>(new Date());
    const [lastCalled, setLastCalled] = useState<{ queue: number; loket: string } | null>(null);

    // Update time every second
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Fetch queue data every 2 seconds
    useEffect(() => {
        const fetchQueue = async () => {
            try {
                const response = await fetch('/api/queue/current');
                const data = await response.json();

                if (data.counters) {
                    // Find the counter with most recent update
                    const sorted = [...data.counters].sort((a, b) =>
                        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
                    );

                    if (sorted.length > 0 && sorted[0].current_queue > 0) {
                        const newest = sorted[0];
                        if (!lastCalled || lastCalled.queue !== newest.current_queue || lastCalled.loket !== newest.loket_nama) {
                            setLastCalled({ queue: newest.current_queue, loket: newest.loket_nama });
                            playAnnouncement(newest.current_queue, newest.loket_nama);
                        }
                    }

                    setCounters(data.counters);
                }
            } catch (error) {
                console.error('Error fetching queue:', error);
            }
        };

        fetchQueue();
        const interval = setInterval(fetchQueue, 2000);
        return () => clearInterval(interval);
    }, [lastCalled]);

    const numberToIndonesian = (num: number): string => {
        const units = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];
        const teens = ['sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas', 'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas'];
        const tens = ['', '', 'dua puluh', 'tiga puluh', 'empat puluh', 'lima puluh', 'enam puluh', 'tujuh puluh', 'delapan puluh', 'sembilan puluh'];

        if (num === 0) return 'nol';
        if (num < 10) return units[num];
        if (num === 10) return 'sepuluh';
        if (num === 11) return 'sebelas';
        if (num < 20) return teens[num - 10];
        if (num < 100) {
            const ten = Math.floor(num / 10);
            const unit = num % 10;
            return tens[ten] + (unit > 0 ? ' ' + units[unit] : '');
        }
        if (num < 1000) {
            const hundred = Math.floor(num / 100);
            const remainder = num % 100;
            let result = hundred === 1 ? 'seratus' : units[hundred] + ' ratus';
            if (remainder > 0) {
                result += ' ' + numberToIndonesian(remainder);
            }
            return result;
        }
        return String(num);
    };

    const playAnnouncement = (queueNum: number, loketName: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();

            const queueInIndonesian = numberToIndonesian(queueNum);
            const speech = new SpeechSynthesisUtterance(
                `Nomor antrian ${queueInIndonesian}, silakan menuju ${loketName}`
            );

            speech.lang = 'id-ID';
            speech.rate = 0.7;
            speech.pitch = 1;
            speech.volume = 1;

            const voices = window.speechSynthesis.getVoices();
            const indonesianVoice = voices.find(
                (voice) =>
                    voice.lang === 'id-ID' ||
                    voice.lang === 'id' ||
                    voice.name.toLowerCase().includes('indonesia')
            );

            if (indonesianVoice) {
                speech.voice = indonesianVoice;
            }

            setTimeout(() => {
                window.speechSynthesis.speak(speech);
            }, 200);
        }
    };

    const timeString = currentTime.toLocaleTimeString('id-ID', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    const dateString = currentTime.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    // Find current calling queue
    const currentCalling = lastCalled || { queue: 0, loket: '' };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
            {/* Header */}
            <header className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-5 shadow-lg">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <Building2 className="w-8 h-8" />
                        <h1 className="text-2xl font-bold">RSUD SLAWI</h1>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center space-x-2 justify-end">
                            <Clock className="w-5 h-5" />
                            <span className="text-lg font-semibold">{timeString}</span>
                        </div>
                        <div className="text-sm opacity-90">{dateString}</div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto p-4">
                {/* Current Queue Display */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                    <Card className="shadow-lg overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-5">
                            <CardTitle className="text-center text-xl">
                                NOMOR ANTRIAN DIPANGGIL
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-10 text-center">
                            <div className="text-8xl font-black text-purple-600 mb-6">
                                {String(currentCalling.queue).padStart(3, '0')}
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800">
                                MENUJU <span className="text-purple-600">{currentCalling.loket || '-'}</span>
                            </h3>
                        </CardContent>
                    </Card>

                    {/* Hospital Branding */}
                    <Card className="shadow-lg overflow-hidden bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                        <div className="text-center p-10">
                            <Building2 className="w-32 h-32 mx-auto text-purple-600 mb-4" />
                            <h2 className="text-3xl font-bold text-purple-800">RSUD SLAWI</h2>
                            <p className="text-purple-600 mt-2">Melayani Dengan Sepenuh Hati</p>
                        </div>
                    </Card>
                </div>

                {/* Counter Status Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    {counters.map((counter) => (
                        <Card
                            key={counter.id}
                            className={`shadow-lg overflow-hidden transition-all ${counter.loket_nama === currentCalling.loket &&
                                    counter.current_queue === currentCalling.queue
                                    ? 'ring-4 ring-purple-500 scale-105'
                                    : ''
                                }`}
                        >
                            <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4">
                                <CardTitle className="text-center font-bold text-base">
                                    {counter.loket_nama}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-10 text-center">
                                <div className="text-4xl font-black text-purple-600">
                                    {String(counter.current_queue).padStart(3, '0')}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Footer Message */}
                <div className="bg-purple-200 rounded-lg overflow-hidden">
                    <div className="py-4 px-4">
                        <div className="overflow-hidden">
                            <p className="text-purple-800 font-medium text-lg animate-marquee whitespace-nowrap inline-block">
                                Selamat datang di RSUD Slawi - Kami siap melayani Anda dengan sepenuh hati - Mohon tunggu panggilan antrian Anda - Terima kasih atas kesabaran Anda
                            </p>
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
