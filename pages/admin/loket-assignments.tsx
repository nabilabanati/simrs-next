import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function LoketAssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedLoket, setSelectedLoket] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch assignments
      const assignRes = await fetch('/api/admin/loket-assignments', {
        credentials: 'include',
      });
      const assignData = await assignRes.json();
      if (assignData.success) {
        setAssignments(assignData.data || []);
      }

      // Fetch users with role 'loket'
      const usersRes = await fetch('/api/admin/employees?role=loket', {
        credentials: 'include',
      });
      const usersData = await usersRes.json();
      if (usersData.success) {
        setUsers(usersData.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedUser || !selectedLoket) {
      toast.error('Pilih user dan loket terlebih dahulu');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/loket-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          user_id: selectedUser,
          loket_id: parseInt(selectedLoket),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Assignment berhasil dibuat');
        setSelectedUser('');
        setSelectedLoket('');
        fetchData();
      } else {
        toast.error(data.error || 'Gagal membuat assignment');
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus assignment ini?')) return;

    try {
      const res = await fetch(`/api/admin/loket-assignments?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Assignment berhasil dihapus');
        fetchData();
      } else {
        toast.error(data.error || 'Gagal menghapus assignment');
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Terjadi kesalahan');
    }
  };

  // Group assignments by user
  const assignmentsByUser = assignments.reduce((acc: any, assignment: any) => {
    const userId = assignment.users?.id;
    if (!userId) return acc;
    
    if (!acc[userId]) {
      acc[userId] = {
        user: assignment.users,
        lokets: [],
      };
    }
    acc[userId].lokets.push({
      id: assignment.id,
      loket_id: assignment.loket_id,
    });
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manajemen Assignment Loket</h1>
        <p className="text-gray-600 mt-1">Kelola assignment petugas loket ke counter tertentu</p>
      </div>

      {/* Create Assignment Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Assign User ke Loket
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Pilih User (Petugas Loket)</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih user..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.nama} (@{user.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Pilih Loket</label>
              <Select value={selectedLoket} onValueChange={setSelectedLoket}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih loket..." />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      Loket {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleAssign}
                disabled={submitting || !selectedUser || !selectedLoket}
                className="w-full"
              >
                {submitting ? 'Menyimpan...' : 'Assign'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Daftar Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : Object.keys(assignmentsByUser).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Belum ada assignment. Silakan buat assignment baru di atas.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Loket yang Di-assign</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.values(assignmentsByUser).map((item: any) => (
                  <TableRow key={item.user.id}>
                    <TableCell className="font-medium">@{item.user.username}</TableCell>
                    <TableCell>{item.user.nama}</TableCell>
                    <TableCell>
                      <div className="flex gap-2 flex-wrap">
                        {item.lokets
                          .sort((a: any, b: any) => a.loket_id - b.loket_id)
                          .map((loket: any) => (
                            <div
                              key={loket.id}
                              className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm"
                            >
                              Loket {loket.loket_id}
                              <button
                                onClick={() => handleDelete(loket.id)}
                                className="ml-1 hover:text-red-600 transition-colors"
                                title="Hapus assignment"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm text-gray-500">
                        {item.lokets.length} loket
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
