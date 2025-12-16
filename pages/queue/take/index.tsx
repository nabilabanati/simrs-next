'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Building2, CheckCircle2 } from 'lucide-react';

interface LoketStatus {
  queueCount: number;
}

interface QueueData {
  queueNumber: number;
  loket: number;
}

export default function QueueTakePage() {
  const [lastTicket, setLastTicket] = useState<{queue_number: number, loket_id: number} | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

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

  // Auto-hide modal after 3 seconds
  useEffect(() => {
    if (showModal) {
      const timer = setTimeout(() => {
        setShowModal(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showModal]);

  const handleTakeQueue = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/queue/take-ticket', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to take ticket');
      }

      // Set ticket data
      setLastTicket({
        queue_number: data.ticket.queue_number,
        loket_id: data.ticket.loket_id,
      });
      setShowModal(true);

      // Broadcast event for display page
      const ticketData = {
        queue_number: data.ticket.queue_number,
        loket_id: data.ticket.loket_id,
        timestamp: Date.now(),
      };

      // Custom event for same-tab
      window.dispatchEvent(
        new CustomEvent('ticketTaken', { detail: ticketData })
      );

      // localStorage for cross-tab sync
      localStorage.setItem('lastTicketTaken', JSON.stringify(ticketData));
    } catch (error) {
      console.error('Error taking ticket:', error);
      alert('Gagal mengambil nomor antrian. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const displayNumber = lastTicket ? String(lastTicket.queue_number).padStart(3, '0') : '000';
  const displayLoket = lastTicket ? lastTicket.loket_id : 1;

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

  const queueTimeString = currentTime?.toLocaleString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }) || '-';

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-5 shadow-lg">
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
      <main className="container mx-auto px-6 py-10">
        <div className="max-w-4xl mx-auto mb-10">
          <Card className="shadow-2xl border border-gray-200">
              <div className=" text-center">
                <h2 className="text-sm font-bold text-gray-600 mb-2 pt-4">
                  RUMAH SAKIT UMUM DAERAH SLAWI
                </h2>
                <h1 className="text-4xl font-bold text-gray-800 mb-8 pb-5">
                  NOMOR ANTRIAN
                </h1>

                <div className="mb-6">
                  <div className="text-9xl font-black text-gray-800 mb-4">
                    {displayNumber}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2 pt-8">
                    LOKET {displayLoket}
                  </h3>
                  <div className="text-gray-600 text-lg">{queueTimeString}</div>
                </div>
              </div>
          </Card>
        </div>

        {/* Ambil Antrian Button */}
        <div className="max-w-4xl mx-auto ">
          <Button
            onClick={handleTakeQueue}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-8 px-8 rounded-xl text-2xl shadow-lg hover:shadow-xl transition-all duration-300 h-20 disabled:opacity-50 disabled:cursor-not-allowed"
            size="lg"
          >
            {loading ? 'Mengambil Nomor...' : 'AMBIL NOMOR ANTRIAN'}
          </Button>
        </div>
      </main>

      {/* Success Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-9 max-w-md mx-3 text-center shadow-2xl animate-in fade-in slide-in-from-bottom-5">
            <div className="mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="size-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Sukses</h3>
              <p className="text-gray-600 mb-4">
                Nomor antrian Anda sedang dicetak
              </p>

              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Anda diarahkan ke:</p>
                <p className="text-lg font-bold text-blue-600">
                  LOKET {lastTicket?.loket_id || 1}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Nomor antrian: {lastTicket?.queue_number || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
