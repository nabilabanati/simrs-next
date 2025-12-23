'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { CounterLayout } from '@/components/layout/CounterLayout';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Users, Clock, Download, Activity, LayoutGrid } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { fetchPoli, fetchAllDoctors, fetchPaymentMethods } from '@/lib/api-client';
import type { Poli, Doctor, PaymentMethod } from '@/lib/api-client';

export default function AdminCounterPage() {
  const router = useRouter();
  
  // Data States
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Statistics States
  const [stats, setStats] = useState({
    totalVisits: 0,
    servedPatients: 0,
    activeLokets: 0,
    waitingQueue: 0,
  });
  
  const [loketStats, setLoketStats] = useState<Record<number, any>>({});
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'today' | 'all'>('today');

  // Filter States
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedLoket, setSelectedLoket] = useState<number | 'all'>('all');
  const [filterPoli, setFilterPoli] = useState('');
  const [filterDokter, setFilterDokter] = useState('');
  const [filterPenjamin, setFilterPenjamin] = useState('');
  const [searchInput, setSearchInput] = useState('');
  
  // API data states
  const [polis, setPolis] = useState<Poli[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  
  // Current Time
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Initialize time
  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load API data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [polisData, doctorsData, paymentsData] = await Promise.all([
          fetchPoli(),
          fetchAllDoctors(),
          fetchPaymentMethods(),
        ]);
        setPolis(polisData);
        setDoctors(doctorsData);
        setPaymentMethods(paymentsData);
        
        await fetchLoketStatistics();
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();

    // Set interval for refreshing stats every 30 seconds
    const interval = setInterval(fetchLoketStatistics, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load visits when tab changes
  useEffect(() => {
    fetchVisits();
  }, [activeTab]);

  // Refetch when date range changes (only in all mode)
  useEffect(() => {
    if (activeTab === 'all') {
      fetchVisits();
    }
  }, [dateFrom, dateTo]);

  // Fetch Loket Statistics
  const fetchLoketStatistics = async () => {
    try {
      // Fetch waiting counts
      const { data: waitingData } = await supabase
        .from('queue_tickets')
        .select('loket_id, status')
        .eq('status', 'waiting');

      // Fetch current queues (called)
      const { data: currentQueues } = await supabase
        .from('queue_tickets')
        .select('loket_id, queue_number, status')
        .eq('status', 'called')
        .order('called_at', { ascending: false });

      // Fetch all visits created today for count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: visitsTodayCount } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Process per-loket stats
      const loketData: Record<number, any> = {};
      const activeLoketIds = new Set<number>();

      // Initialize 5 lokets
      [1, 2, 3, 4, 5].forEach(id => {
        loketData[id] = {
          id,
          waiting: 0,
          currentQueue: '-',
          status: 'idle',
        };
      });

      // Map waiting counts
      waitingData?.forEach((ticket: any) => {
        if (loketData[ticket.loket_id]) {
          loketData[ticket.loket_id].waiting++;
        }
      });

      // Map current queue
      currentQueues?.forEach((ticket: any) => {
        if (loketData[ticket.loket_id] && loketData[ticket.loket_id].currentQueue === '-') {
          loketData[ticket.loket_id].currentQueue = ticket.queue_number;
          loketData[ticket.loket_id].status = 'active';
          activeLoketIds.add(ticket.loket_id);
        }
      });

      setLoketStats(loketData);
      setStats({
        totalVisits: visitsTodayCount || 0,
        servedPatients: visitsTodayCount || 0,
        activeLokets: activeLoketIds.size,
        waitingQueue: waitingData?.length || 0,
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch Visits from ALL lokets
  const fetchVisits = async () => {
    setLoading(true);
    try {
      // Fetch all visits with full details
      const { data: visitsData, error: visitsError } = await supabase
        .from('visits')
        .select('*')
        .order('created_at', { ascending: false });

      if (visitsError) {
        console.error('Error fetching visits:', visitsError);
        throw visitsError;
      }

      console.log('Raw visits:', visitsData);

      if (!visitsData || visitsData.length === 0) {
        setVisits([]);
        setLoading(false);
        return;
      }

      // Apply date filter on client side
      let filteredByDate = visitsData;
      if (activeTab === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        filteredByDate = visitsData.filter(v => new Date(v.created_at) >= today);
      } else {
        if (dateFrom) {
          const from = new Date(dateFrom);
          filteredByDate = filteredByDate.filter(v => new Date(v.created_at) >= from);
        }
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          filteredByDate = filteredByDate.filter(v => new Date(v.created_at) <= to);
        }
      }

      // Fetch related data
      const patientIds = [...new Set(filteredByDate.map(v => v.patient_id).filter(Boolean))];
      const poliIds = [...new Set(filteredByDate.map(v => v.poli_id).filter(Boolean))];
      const doctorIds = [...new Set(filteredByDate.map(v => v.dokter_id).filter(Boolean))];
      const penjaminIds = [...new Set(filteredByDate.map(v => v.penjamin_id).filter(Boolean))];
      const queueTicketIds = [...new Set(filteredByDate.map(v => v.queue_ticket_id).filter(Boolean))];

      // Fetch all related data in parallel
      const [patientsRes, polisRes, doctorsRes, penjaminsRes, queueTicketsRes] = await Promise.all([
        patientIds.length > 0 ? supabase.from('patients').select('*').in('id', patientIds) : { data: [] },
        poliIds.length > 0 ? supabase.from('poli').select('*').in('id', poliIds) : { data: [] },
        doctorIds.length > 0 ? supabase.from('doctors').select('id, user_id').in('id', doctorIds) : { data: [] },
        penjaminIds.length > 0 ? supabase.from('penjamin').select('*').in('id', penjaminIds) : { data: [] },
        queueTicketIds.length > 0 ? supabase.from('queue_tickets').select('*').in('id', queueTicketIds) : { data: [] }
      ]);

      console.log('Doctors raw:', doctorsRes.data);

      // Get user IDs from doctors to fetch user names
      const userIds = [...new Set((doctorsRes.data || []).map(d => d.user_id).filter(Boolean))];
      const usersRes = userIds.length > 0 ? await supabase.from('users').select('id, nama').in('id', userIds) : { data: [] };

      console.log('Users fetched:', usersRes.data);

      // Create maps for quick lookup
      const patientsMap = new Map((patientsRes.data || []).map(p => [p.id, p]));
      const polisMap = new Map((polisRes.data || []).map(p => [p.id, p]));
      const usersMap = new Map((usersRes.data || []).map(u => [u.id, u]));
      const doctorsMap = new Map((doctorsRes.data || []).map(d => [d.id, { ...d, nama: usersMap.get(d.user_id)?.nama || '-' }]));
      const penjaminsMap = new Map((penjaminsRes.data || []).map(p => [p.id, p]));
      const queueTicketsMap = new Map((queueTicketsRes.data || []).map(q => [q.id, q]));

      console.log('Doctors map:', doctorsMap);
      console.log('Queue tickets map:', queueTicketsMap);

      // Combine data
      const enrichedVisits = filteredByDate.map(visit => ({
        ...visit,
        patients: patientsMap.get(visit.patient_id) || null,
        poli: polisMap.get(visit.poli_id) || null,
        doctors: doctorsMap.get(visit.dokter_id) || null,
        payment_methods: penjaminsMap.get(visit.penjamin_id) || null,
        queue_tickets: queueTicketsMap.get(visit.queue_ticket_id) || null,
      }));

      console.log('Enriched visits:', enrichedVisits);
      setVisits(enrichedVisits);
    } catch (error) {
      console.error('Error fetching visits:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const filteredVisits = visits.filter(visit => {
    // Skip rows with too many empty fields
    const emptyFields = [
      !visit.patients?.nrm,
      !visit.patients?.nama,
      !visit.poli?.nama,
      !visit.doctors?.nama,
      !visit.no_reg,
    ].filter(Boolean).length;
    
    if (emptyFields > 2) return false; // Skip if more than 2 important fields are empty
    
    // Loket filter
    if (selectedLoket !== 'all' && visit.queue_tickets?.loket_id !== selectedLoket) return false;
    if (filterPoli && visit.poli?.nama !== filterPoli) return false;
    if (filterDokter && visit.doctors?.nama !== filterDokter) return false;
    if (filterPenjamin && visit.payment_methods?.nama !== filterPenjamin) return false;
    if (searchInput) {
      const search = searchInput.toLowerCase();
      const nrm = visit.patients?.nrm?.toLowerCase() || '';
      const nama = visit.patients?.nama?.toLowerCase() || '';
      const noReg = visit.no_reg?.toLowerCase() || '';
      if (!nrm.includes(search) && !nama.includes(search) && !noReg.includes(search)) {
        return false;
      }
    }
    return true;
  });

  // Export to Excel
  const exportToExcel = () => {
    const headers = ['Loket', 'No. Reg', 'Tgl', 'NRM', 'Nama', 'JK', 'Poli', 'Dokter', 'Bayar'];
    const rows = filteredVisits.map((v) => [
      v.queue_tickets?.loket_id ? `Loket ${v.queue_tickets.loket_id}` : '-',
      v.no_reg || '-',
      new Date(v.created_at).toLocaleDateString('id-ID'),
      v.patients?.nrm || '-',
      v.patients?.nama || '-',
      v.patients?.jenis_kelamin || '-',
      v.poli?.nama || '-',
      v.doctors?.nama || '-',
      v.payment_methods?.nama || 'UMUM',
    ]);

    let html = '<table border="1"><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
    rows.forEach(row => {
      html += '<tr>' + row.map(cell => `<td>${cell || ''}</td>`).join('') + '</tr>';
    });
    html += '</table>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `laporan_counter_${new Date().getTime()}.xls`;
    link.click();
  };

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
    <CounterLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-blue-600 text-white p-6 shadow-lg rounded-lg mb-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Dashboard Monitoring Loket</h1>
              <p className="text-blue-100 text-sm mt-1">Pusat kendali dan monitoring 5 loket pendaftaran</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{timeString}</div>
              <div className="text-sm text-blue-100">{dateString}</div>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card className="bg-white/10 border-none text-white">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Total Kunjungan</p>
                  <p className="text-3xl font-bold">{stats.totalVisits}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <Users className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-none text-white">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Pasien Terlayani</p>
                  <p className="text-3xl font-bold">{stats.servedPatients}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <Activity className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-none text-white">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Loket Aktif</p>
                  <p className="text-3xl font-bold">{stats.activeLokets}/5</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <LayoutGrid className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-none text-white">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Total Antrian</p>
                  <p className="text-3xl font-bold">{stats.waitingQueue}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <Clock className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          </div>
        </header>

        {/* Main Content */}
        <div className="p-6 max-w-7xl mx-auto">
          {/* Per-Loket Monitor Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {[1, 2, 3, 4, 5].map((id) => (
              <Card key={id} className="shadow-md border-t-4 border-t-blue-500 hover:shadow-xl transition-all">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-800">Loket {id}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      loketStats[id]?.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {loketStats[id]?.status === 'active' ? 'Aktif' : 'Idle'}
                    </span>
                  </div>
                  <div className="text-center py-2 bg-gray-50 rounded-lg mb-3">
                    <p className="text-xs text-gray-500 uppercase">Antrian Saat Ini</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {loketStats[id]?.currentQueue || '-'}
                    </p>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 border-t pt-3">
                    <span>Menunggu: <strong className="text-orange-600">{loketStats[id]?.waiting || 0}</strong></span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 text-blue-600 hover:text-blue-800"
                      onClick={() => router.push(`/counter/loket-${id}`)}
                    >
                      Detail →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filter Section */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-6">
            <h2 className="text-lg font-bold text-blue-600 mb-6">FILTER DATA PASIEN</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  TANGGAL REGISTRASI
                  {activeTab === 'today' && (
                    <span className="text-xs text-gray-500 ml-2">(Hanya untuk Tab Semua)</span>
                  )}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    disabled={activeTab === 'today'}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 bg-white"
                  />
                  <span className="text-sm text-gray-600 font-medium">s.d.</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    disabled={activeTab === 'today'}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 bg-white"
                  />
                </div>
              </div>

              {/* Loket Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">LOKET</label>
                <select
                  value={selectedLoket}
                  onChange={(e) => setSelectedLoket(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="w-full py-3 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">Semua Loket</option>
                  <option value="1">Loket 1</option>
                  <option value="2">Loket 2</option>
                  <option value="3">Loket 3</option>
                  <option value="4">Loket 4</option>
                  <option value="5">Loket 5</option>
                </select>
              </div>

              {/* Payment Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">CARA BAYAR</label>
                <select
                  value={filterPenjamin}
                  onChange={(e) => setFilterPenjamin(e.target.value)}
                  className="w-full py-3 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Semua</option>
                  {paymentMethods.map((pm) => (
                    <option key={pm.id} value={pm.nama}>{pm.nama}</option>
                  ))}
                </select>
              </div>

              {/* Poli Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">POLIKLINIK</label>
                <select
                  value={filterPoli}
                  onChange={(e) => setFilterPoli(e.target.value)}
                  className="w-full py-3 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Semua</option>
                  {polis.map((poli) => (
                    <option key={poli.id} value={poli.name}>{poli.name}</option>
                  ))}
                </select>
              </div>

              {/* Doctor Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">DOKTER</label>
                <select
                  value={filterDokter}
                  onChange={(e) => setFilterDokter(e.target.value)}
                  className="w-full py-3 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Semua</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.name}>{doctor.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search and Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Cari NRM, Nama, atau No. Registrasi..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => fetchVisits()}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium"
                >
                  Cari
                </Button>
                <Button
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                    setSelectedLoket('all');
                    setFilterPoli('');
                    setFilterDokter('');
                    setFilterPenjamin('');
                    setSearchInput('');
                    fetchVisits();
                  }}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>

          {/* Tab and Action Buttons */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <Button
                onClick={() => setActiveTab('today')}
                variant={activeTab === 'today' ? 'default' : 'outline'}
                className={activeTab === 'today' ? 'bg-blue-600' : ''}
              >
                HARI INI
              </Button>
              <Button
                onClick={() => setActiveTab('all')}
                variant={activeTab === 'all' ? 'default' : 'outline'}
                className={activeTab === 'all' ? 'bg-blue-600' : ''}
              >
                SEMUA
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={exportToExcel}
              className="px-4 py-2 text-sm"
            >
              <Download className="w-4 h-4 mr-1" />
              Export Excel
            </Button>
          </div>

          {/* Data Table */}
          <Card className="border overflow-auto py-0">
            <Table className="min-w-full">
              <TableHeader className="bg-blue-50">
                <TableRow>
                  <TableHead className="px-2 py-2 text-xs font-bold text-gray-700 uppercase w-12">NO</TableHead>
                  <TableHead className="px-2 py-2 text-xs font-bold text-gray-700 uppercase w-20">LOKET</TableHead>
                  <TableHead className="px-2 py-2 text-xs font-bold text-gray-700 uppercase w-24">NO. REG</TableHead>
                  <TableHead className="px-2 py-2 text-xs font-bold text-gray-700 uppercase w-24">TGL</TableHead>
                  <TableHead className="px-2 py-2 text-xs font-bold text-gray-700 uppercase w-20">NRM</TableHead>
                  <TableHead className="px-2 py-2 text-xs font-bold text-gray-700 uppercase">NAMA</TableHead>
                  <TableHead className="px-2 py-2 text-xs font-bold text-gray-700 uppercase w-12">JK</TableHead>
                  <TableHead className="px-2 py-2 text-xs font-bold text-gray-700 uppercase">POLI</TableHead>
                  <TableHead className="px-2 py-2 text-xs font-bold text-gray-700 uppercase">DOKTER</TableHead>
                  <TableHead className="px-2 py-2 text-xs font-bold text-gray-700 uppercase w-24">BAYAR</TableHead>
                  <TableHead className="px-2 py-2 text-xs font-bold text-gray-700 uppercase w-24">STATUS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredVisits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                      Tidak ada data pasien
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVisits.map((visit, idx) => (
                    <TableRow key={visit.id} className="text-sm hover:bg-blue-50/50">
                      <TableCell className="px-2 py-2 text-center">{idx + 1}</TableCell>
                      <TableCell className="px-2 py-2 text-center">
                        {visit.queue_tickets && visit.queue_tickets.loket_id ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                            Loket {visit.queue_tickets.loket_id}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="px-2 py-2 font-semibold text-blue-600 text-xs">
                        {visit.no_reg || '-'}
                      </TableCell>
                      <TableCell className="px-2 py-2 text-xs">
                        {new Date(visit.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </TableCell>
                      <TableCell className="px-2 py-2 font-medium text-xs">{visit.patients?.nrm || '-'}</TableCell>
                      <TableCell className="px-2 py-2 text-xs">{visit.patients?.nama || '-'}</TableCell>
                      <TableCell className="px-2 py-2 text-center text-xs">
                        {visit.patients?.jenis_kelamin === 'L' ? 'L' : 'P'}
                      </TableCell>
                      <TableCell className="px-2 py-2 text-xs">{visit.poli?.nama || '-'}</TableCell>
                      <TableCell className="px-2 py-2 text-xs">{visit.doctors?.nama || '-'}</TableCell>
                      <TableCell className="px-2 py-2 text-xs">{visit.payment_methods?.nama || 'UMUM'}</TableCell>
                      <TableCell className="px-2 py-2">
                        {visit.queue_tickets && visit.queue_tickets.status ? (
                          <span className={`inline-flex items-center gap-1 py-1 px-2 rounded-full text-xs font-medium ${
                            visit.queue_tickets.status === 'called' ? 'bg-green-100 text-green-800' :
                            visit.queue_tickets.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                            visit.queue_tickets.status === 'finished' ? 'bg-gray-100 text-gray-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {visit.queue_tickets.status === 'called' ? 'dipanggil' :
                             visit.queue_tickets.status === 'waiting' ? 'menunggu' :
                             visit.queue_tickets.status === 'finished' ? 'selesai' : visit.queue_tickets.status}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </CounterLayout>
  );
}
