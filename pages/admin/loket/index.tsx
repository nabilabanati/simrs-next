'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, Search, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLoketDashboard() {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterLoket, setFilterLoket] = useState('');
  const [filterPoli, setFilterPoli] = useState('');
  const [filterDokter, setFilterDokter] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch dashboard data
  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
      });

      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (filterLoket) params.append('loket_id', filterLoket);
      if (filterPoli) params.append('poli_id', filterPoli);
      if (filterDokter) params.append('dokter_id', filterDokter);
      if (filterStatus) params.append('queue_status', filterStatus);

      const response = await fetch(`/api/admin/loket/dashboard?${params}`);
      const result = await response.json();

      if (response.ok) {
        setData(result.data || []);
        setTotalPages(result.pagination?.total_pages || 1);
        setTotalCount(result.pagination?.total || 0);
      } else {
        toast.error('Gagal memuat data dashboard');
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      toast.error('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const response = await fetch(`/api/admin/loket/stats?${params}`);
      const result = await response.json();

      if (response.ok) {
        setStats(result.statistics);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchStats();
  }, [currentPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchDashboard();
    fetchStats();
  };

  const handleReset = () => {
    setDateFrom('');
    setDateTo('');
    setFilterLoket('');
    setFilterPoli('');
    setFilterDokter('');
    setFilterStatus('');
    setCurrentPage(1);
    setTimeout(() => {
      fetchDashboard();
      fetchStats();
    }, 100);
  };

  const exportToExcel = () => {
    const headers = ['No. Reg', 'Antrian', 'Loket', 'NRM', 'Nama', 'Poli', 'Dokter', 'Penjamin', 'Status'];
    const rows = data.map((item) => [
      item.no_reg || '-',
      item.queue_number || '-',
      item.loket_id || '-',
      item.patient?.nrm || '-',
      item.patient?.nama || '-',
      item.poli?.nama || '-',
      item.doctor?.nama || '-',
      item.penjamin?.nama || '-',
      item.queue_status || '-',
    ]);

    let html = '<table border="1"><tr>';
    headers.forEach(header => {
      html += `<th>${header}</th>`;
    });
    html += '</tr>';

    rows.forEach(row => {
      html += '<tr>';
      row.forEach(cell => {
        html += `<td>${cell || ''}</td>`;
      });
      html += '</tr>';
    });
    html += '</table>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dashboard_loket_${new Date().getTime()}.xls`;
    link.click();
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      menunggu_loket: 'bg-yellow-100 text-yellow-800',
      dipanggil: 'bg-blue-100 text-blue-800',
      terdaftar: 'bg-green-100 text-green-800',
      batal: 'bg-red-100 text-red-800',
      no_show: 'bg-gray-100 text-gray-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      menunggu_loket: 'Menunggu',
      dipanggil: 'Dipanggil',
      terdaftar: 'Terdaftar',
      batal: 'Batal',
      no_show: 'No Show',
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <header className="bg-blue-600 text-white p-6 shadow-lg rounded-lg mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Admin Loket</h1>
            <p className="text-blue-100 text-sm mt-1">Monitoring Semua Loket Pendaftaran</p>
          </div>
          <BarChart3 className="w-12 h-12" />
        </div>
      </header>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.total_antrian}</div>
                <div className="text-sm text-gray-600 mt-1">Total Antrian</div>
              </div>
            </CardContent>
          </Card>
          {stats.per_loket?.map((loket: any) => (
            <Card key={loket.loket_id}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">{loket.count}</div>
                  <div className="text-sm text-gray-600 mt-1">Loket {loket.loket_id}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tanggal Dari</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tanggal Sampai</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Loket</label>
              <select
                value={filterLoket}
                onChange={(e) => setFilterLoket(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Loket</option>
                <option value="1">Loket 1</option>
                <option value="2">Loket 2</option>
                <option value="3">Loket 3</option>
                <option value="4">Loket 4</option>
                <option value="5">Loket 5</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Status</option>
                <option value="menunggu_loket">Menunggu</option>
                <option value="dipanggil">Dipanggil</option>
                <option value="terdaftar">Terdaftar</option>
                <option value="batal">Batal</option>
                <option value="no_show">No Show</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSearch} className="bg-green-600 hover:bg-green-700">
              <Search className="w-4 h-4 mr-2" />
              Cari
            </Button>
            <Button onClick={handleReset} variant="outline">
              Reset
            </Button>
            <Button onClick={exportToExcel} className="bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Pendaftaran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-blue-50">
                <TableRow>
                  <TableHead className="font-bold">No. Reg</TableHead>
                  <TableHead className="font-bold">Antrian</TableHead>
                  <TableHead className="font-bold">Loket</TableHead>
                  <TableHead className="font-bold">NRM</TableHead>
                  <TableHead className="font-bold">Nama Pasien</TableHead>
                  <TableHead className="font-bold">Poli</TableHead>
                  <TableHead className="font-bold">Dokter</TableHead>
                  <TableHead className="font-bold">Penjamin</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold">Waktu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.no_reg || '-'}</TableCell>
                      <TableCell className="text-center font-bold">
                        {item.queue_number ? String(item.queue_number).padStart(3, '0') : '-'}
                      </TableCell>
                      <TableCell className="text-center">Loket {item.loket_id || '-'}</TableCell>
                      <TableCell>{item.patient?.nrm || '-'}</TableCell>
                      <TableCell>{item.patient?.nama || '-'}</TableCell>
                      <TableCell>{item.poli?.nama || '-'}</TableCell>
                      <TableCell>{item.doctor?.nama || '-'}</TableCell>
                      <TableCell>{item.penjamin?.nama || 'UMUM'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(item.queue_status)}`}>
                          {getStatusLabel(item.queue_status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(item.created_at).toLocaleString('id-ID')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Total: <span className="font-medium">{totalCount}</span> data
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <span className="px-4 py-2 text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage >= totalPages}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
