'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Building2 } from 'lucide-react';

interface CounterQueueData {
    status: 'active' | 'inactive';
    currentNumber: number;
    remaining: number;
}

export default function CounterQueueDisplay() {
    const [currentQueue, setCurrentQueue] = useState<number>(1);
    const [currentCounter, setCurrentCounter] = useState<number>(1);
    const [counterQueues, setCounterQueues] = useState<Record<number, CounterQueueData>>({
        1: { status: 'active', currentNumber: 1, remaining: 49 },
        2: { status: 'active', currentNumber: 0, remaining: 0 },
        3: { status: 'active', currentNumber: 0, remaining: 0 },
        4: { status: 'active', currentNumber: 0, remaining: 0 },
        5: { status: 'active', currentNumber: 0, remaining: 0 },
    });
    const [currentTime, setCurrentTime] = useState<Date>(new Date());

    // Update time every second
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Setup event listeners for queue updates
    useEffect(() => {
        const handleQueueUpdate = (event: CustomEvent) => {
            const data = event.detail;
            if (data) {
                setCurrentQueue(data.currentNumber);
                setCurrentCounter(data.counter);
                if (data.counterData) {
                    setCounterQueues(data.counterData);
                }
                playAnnouncement(data.currentNumber, data.counter);
            }
        };

        const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.type === 'queueUpdate') {
                const data = event.data.data;
                setCurrentQueue(data.currentNumber);
                setCurrentCounter(data.counter);
                if (data.counterData) {
                    setCounterQueues(data.counterData);
                }
                playAnnouncement(data.currentNumber, data.counter);
            }
        };

        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'counterQueueUpdate') {
                try {
                    const data = JSON.parse(event.newValue || '{}');
                    setCurrentQueue(data.currentNumber);
                    setCurrentCounter(data.counter);
                    if (data.counterData) {
                        setCounterQueues(data.counterData);
                    }
                    playAnnouncement(data.currentNumber, data.counter);
                } catch (error) {
                    console.error('Error parsing queue update:', error);
                }
            }
        };

        window.addEventListener('queueUpdate', handleQueueUpdate as EventListener);
        window.addEventListener('message', handleMessage);
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('queueUpdate', handleQueueUpdate as EventListener);
            window.removeEventListener('message', handleMessage);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const numberToIndonesian = (num: number): string => {
        const units = [
            '',
            'satu',
            'dua',
            'tiga',
            'empat',
            'lima',
            'enam',
            'tujuh',
            'delapan',
            'sembilan',
        ];
        const teens = [
            'sepuluh',
            'sebelas',
            'dua belas',
            'tiga belas',
            'empat belas',
            'lima belas',
            'enam belas',
            'tujuh belas',
            'delapan belas',
            'sembilan belas',
        ];
        const tens = [
            '',
            '',
            'dua puluh',
            'tiga puluh',
            'empat puluh',
            'lima puluh',
            'enam puluh',
            'tujuh puluh',
            'delapan puluh',
            'sembilan puluh',
        ];

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

    const playAnnouncement = (queueNum: number, counterNum: number) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();

            const queueInIndonesian = numberToIndonesian(queueNum);
            const counterInIndonesian = numberToIndonesian(counterNum);

            const speech = new SpeechSynthesisUtterance(
                `Nomor antrian ${queueInIndonesian}, silakan menuju counter ${counterInIndonesian}`
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
                    voice.name.toLowerCase().includes('indonesia') ||
                    voice.name.toLowerCase().includes('indo')
            );

            if (indonesianVoice) {
                speech.voice = indonesianVoice;
            }

            speech.onerror = (event) => {
                console.error('Speech synthesis error:', event);
            };

            setTimeout(() => {
                window.speechSynthesis.speak(speech);
            }, 200);
        }
    };

    // Find target counter
    let targetCounter = currentCounter;
    Object.entries(counterQueues).forEach(([counter, data]) => {
        if (data.currentNumber === currentQueue) {
            targetCounter = parseInt(counter);
        }
    });

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 font-inter">
            {/* Header */}
            <header className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-5 shadow-lg">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <Building2 className="w-8 h-8" />
                        <h1 className="text-2xl font-bold">RSUD SLAWI</h1>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center space-x-2 justify-end">
                            <Clock className="size-5" />
                            <span className="text-lg font-semibold">{timeString}</span>
                        </div>
                        <div className="text-sm opacity-90">{dateString}</div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto p-4">
                {/* Top Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                    {/* Queue Info Card */}
                    <Card className="shadow-lg overflow-hidden py-0 gap-0">
                        <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-5">
                            <CardTitle className="text-center text-xl">
                                INFORMASI ANTRIAN PASIEN
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-10 text-center">
                            <div className="text-8xl font-black text-purple-600 mb-6">
                                {String(currentQueue).padStart(3, '0')}
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800">
                                MENUJU COUNTER <span className="text-purple-600">{targetCounter}</span>
                            </h3>
                        </CardContent>
                    </Card>

                    {/* Hospital Image */}
                    <Card className="shadow-lg overflow-hidden bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                        <div className="text-center p-10">
                            <Building2 className="w-32 h-32 mx-auto text-purple-600 mb-4" />
                            <h2 className="text-3xl font-bold text-purple-800">RSUD SLAWI</h2>
                            <p className="text-purple-600 mt-2">Melayani Dengan Sepenuh Hati</p>
                        </div>
                    </Card>
                </div>

                {/* Counter Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    {[1, 2, 3, 4, 5].map((counterNum) => (
                        <Card
                            key={counterNum}
                            className={`shadow-lg overflow-hidden transition-all p-0 gap-0
                 ${counterNum === targetCounter &&
                                    counterQueues[counterNum].currentNumber === currentQueue
                                    ? 'ring-4 ring-purple-500 ring-opacity-50 scale-105'
                                    : ''
                                }`}
                        >
                            <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4">
                                <CardTitle className="text-center font-bold text-base p-0">
                                    Counter {counterNum}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-10 text-center">
                                <div className="text-4xl font-black text-purple-600">
                                    {String(counterQueues[counterNum]?.currentNumber || 0).padStart(
                                        3,
                                        '0'
                                    )}
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
                                Selamat datang di RSUD Slawi - Kami siap melayani Anda dengan
                                sepenuh hati - Mohon tunggu panggilan antrian Anda - Terima kasih
                                atas kesabaran Anda
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
