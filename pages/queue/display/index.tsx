'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Building2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface LoketQueueData {
  status: 'active' | 'inactive';
  currentNumber: number;
  remaining: number;
}

export default function QueueInfoDisplay() {
  const [currentQueue, setCurrentQueue] = useState<number>(0);
  const [currentLoket, setCurrentLoket] = useState<number>(1);
  const [loketQueues, setLoketQueues] = useState<Record<number, LoketQueueData>>({
    1: { status: 'active', currentNumber: 0, remaining: 0 },
    2: { status: 'active', currentNumber: 0, remaining: 0 },
    3: { status: 'active', currentNumber: 0, remaining: 0 },
    4: { status: 'active', currentNumber: 0, remaining: 0 },
    5: { status: 'active', currentNumber: 0, remaining: 0 },
  });
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

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

  // Fetch latest queue data from database
  const fetchLatestQueueData = async () => {
    try {
      // Get today's date range (start and end of day in local timezone)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStart = tomorrow.toISOString();

      // Get the most recent called ticket for each loket from queue_tickets table (today only)
      const { data: calledTickets, error } = await supabase
        .from('queue_tickets')
        .select('loket_id, queue_number, called_at')
        .eq('status', 'called')
        .not('loket_id', 'is', null)
        .gte('created_at', todayStart)
        .lt('created_at', tomorrowStart)
        .order('called_at', { ascending: false });

      if (error) {
        console.error('Error fetching queue data:', error);
        return;
      }

      if (calledTickets && calledTickets.length > 0) {
        // Get the latest ticket across all lokets
        const latestTicket = calledTickets[0];
        setCurrentQueue(latestTicket.queue_number);
        setCurrentLoket(latestTicket.loket_id);

        // Update loket queues with the latest number for each loket
        const loketMap: Record<number, number> = {};
        calledTickets.forEach(ticket => {
          if (!loketMap[ticket.loket_id]) {
            loketMap[ticket.loket_id] = ticket.queue_number;
          }
        });

        setLoketQueues(prev => {
          const updated = { ...prev };
          Object.entries(loketMap).forEach(([loketId, queueNum]) => {
            const id = parseInt(loketId);
            updated[id] = {
              ...prev[id],
              currentNumber: queueNum,
            };
          });
          return updated;
        });

        console.log('Queue data updated from database:', latestTicket);
      } else {
        // Reset display if no queue for today
        console.log('No queue data for today, resetting display');
        setCurrentQueue(0);
        setCurrentLoket(1);
        setLoketQueues({
          1: { status: 'active', currentNumber: 0, remaining: 0 },
          2: { status: 'active', currentNumber: 0, remaining: 0 },
          3: { status: 'active', currentNumber: 0, remaining: 0 },
          4: { status: 'active', currentNumber: 0, remaining: 0 },
          5: { status: 'active', currentNumber: 0, remaining: 0 },
        });
      }
    } catch (err) {
      console.error('Error in fetchLatestQueueData:', err);
    }
  };

  // Setup Supabase realtime subscription and polling
  useEffect(() => {
    // Initial fetch
    fetchLatestQueueData();

    // Set up Supabase realtime subscription
    const channel = supabase
      .channel('queue-display')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'queue_tickets',
          filter: 'status=eq.called'
        },
        (payload) => {
          console.log('Realtime update received:', payload);
          fetchLatestQueueData();
        }
      )
      .subscribe();

    // Set up polling as fallback
    const pollInterval = setInterval(() => {
      fetchLatestQueueData();
    }, 3000); // Poll every 3 seconds

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, []);

  // Setup event listeners for queue updates (for instant updates via broadcast)
  useEffect(() => {
    // Handle queue call from counter
    const handleQueueCall = (event: CustomEvent) => {
      console.log('Queue call event received:', event.detail);
      const data = event.detail;
      if (data && data.queue_number && data.loket_id) {
        setCurrentQueue(data.queue_number);
        setCurrentLoket(data.loket_id);
        
        // Update loket status
        setLoketQueues((prev) => ({
          ...prev,
          [data.loket_id]: {
            ...prev[data.loket_id],
            currentNumber: data.queue_number,
          },
        }));
        
        playAnnouncement(data.queue_number, data.loket_id);
      }
    };

    // Handle storage events for cross-tab sync
    const handleStorageChange = (event: StorageEvent) => {
      console.log('Storage event:', event.key, event.newValue);
      if (event.key === 'queueCalled' && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          console.log('Queue data from storage:', data);
          setCurrentQueue(data.queue_number);
          setCurrentLoket(data.loket_id);
          
          setLoketQueues((prev) => ({
            ...prev,
            [data.loket_id]: {
              ...prev[data.loket_id],
              currentNumber: data.queue_number,
            },
          }));
          
          playAnnouncement(data.queue_number, data.loket_id);
        } catch (error) {
          console.error('Error parsing queue call:', error);
        }
      }
    };

    // Check for queue call in localStorage on mount
    const checkStorageOnMount = () => {
      const stored = localStorage.getItem('queueCalled');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          // Only use if recent (within last 5 seconds)
          if (data.timestamp && Date.now() - data.timestamp < 5000) {
            console.log('Found recent queue call on mount:', data);
            setCurrentQueue(data.queue_number);
            setCurrentLoket(data.loket_id);
            setLoketQueues((prev) => ({
              ...prev,
              [data.loket_id]: {
                ...prev[data.loket_id],
                currentNumber: data.queue_number,
              },
            }));
          }
        } catch (error) {
          console.error('Error parsing stored queue call:', error);
        }
      }
    };

    checkStorageOnMount();
    window.addEventListener('queueCalled', handleQueueCall as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('queueCalled', handleQueueCall as EventListener);
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

  const playAnnouncement = (queueNum: number, loketNum: number) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const queueInIndonesian = numberToIndonesian(queueNum);
      const loketInIndonesian = numberToIndonesian(loketNum);

      const speech = new SpeechSynthesisUtterance(
        `Nomor antrian ${queueInIndonesian}, silakan menuju loket ${loketInIndonesian}`
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

  // Find target loket
  let targetLoket = currentLoket;
  Object.entries(loketQueues).forEach(([loket, data]) => {
    if (data.currentNumber === currentQueue) {
      targetLoket = parseInt(loket);
    }
  });

  const timeString = currentTime?.toLocaleTimeString('id-ID', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }) || '--:--:--';

  const dateString = currentTime?.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) || '-';

  return (
    <div className="min-h-screen bg-gray-100 font-inter">
      {/* Header */}
      <header className="bg-blue-600 text-white p-5 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Building2 className="w-8 h-8" />
            <h1 className="text-2xl font-bold">LAYANAN KESEHATAN</h1>
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
            <CardHeader className="bg-blue-600 text-white p-5">
              <CardTitle className="text-center text-xl">
                INFORMASI ANTRIAN PASIEN SAAT INI
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10 text-center">
              <div className="text-8xl font-black text-gray-800 mb-6">
                {String(currentQueue).padStart(3, '0')}
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                MENUJU LOKET <span className="text-blue-600">{targetLoket}</span>
              </h3>
            </CardContent>
          </Card>

          {/* Hospital Image */}
          <div className="shadow-lg overflow-hidden rounded-lg bg-white">
            <img
              src="/hospital_team.jpg"
              alt="Tim Medis"
              className="w-full object-cover block"
              style={{ height: '300px', margin: 0, padding: 0, display: 'block', verticalAlign: 'bottom' }}
              onError={(e) => {
                e.currentTarget.src = '/api/placeholder/400/300';
              }}
            />
          </div>
        </div>

        {/* Counter Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[1, 2, 3, 4, 5].map((loketNum) => {
            const isActive = loketNum === targetLoket && loketQueues[loketNum].currentNumber === currentQueue;
            const hasQueue = loketQueues[loketNum]?.currentNumber > 0;
            
            return (
              <Card
                key={loketNum}
                className={`shadow-lg overflow-hidden transition-all p-0 gap-0
                   ${
                  isActive
                    ? 'ring-4 ring-blue-500 ring-opacity-50'
                    : ''
                }`}
              >
                <CardHeader className="bg-blue-600 text-white p-4">
                    <CardTitle className="text-center font-bold text-base p-0">
                    Loket {loketNum}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-10 text-center">
                  <div className="text-4xl font-black text-gray-800 mb-2">
                    {String(loketQueues[loketNum]?.currentNumber || 0).padStart(
                      3,
                      '0'
                    )}
                  </div>
                  <div className={`text-xs font-semibold px-3 py-1 rounded-full inline-block ${
                    hasQueue ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {hasQueue ? '● AKTIF' : '○ SIAP'}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer Message */}
        <div className="bg-blue-200 rounded-lg overflow-hidden">
          <div className="py-4 px-4">
            <div className="overflow-hidden">
              <p className="text-gray-800 font-medium text-lg animate-marquee whitespace-nowrap inline-block">
                Selamat datang di Layanan Kesehatan - Kami siap melayani Anda dengan
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
