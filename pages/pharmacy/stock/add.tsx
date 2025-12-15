'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import PharmacyLayout from '@/components/layout/PharmacyLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Medicine {
    id: string;
    kode: string;
    nama: string;
}

export default function AddStock() {
    const router = useRouter();
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        medicine_id: '',
        qty: '',
        lokasi: '',
    });

    useEffect(() => {
        fetchMedicines();
    }, []);

    const fetchMedicines = async () => {
        try {
            const response = await fetch('/api/pharmacy/stock');
            const data = await response.json();

            if (response.ok) {
                setMedicines(data.medicines || []);
            }
        } catch (error) {
            console.error('Error fetching medicines:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.medicine_id || !formData.qty || !formData.lokasi) {
            toast.error('Semua field harus diisi');
            return;
        }

        if (parseInt(formData.qty) <= 0) {
            toast.error('Jumlah harus lebih dari 0');
            return;
        }

        setSaving(true);

        try {
            const response = await fetch('/api/pharmacy/add-stock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Stok berhasil ditambahkan');
                router.push('/pharmacy/stock');
            } else {
                toast.error(data.error || 'Gagal menambahkan stok');
            }
        } catch (error) {
            console.error('Error adding stock:', error);
            toast.error('Terjadi kesalahan saat menambahkan stok');
        } finally {
            setSaving(false);
        }
    };

    return (
        <PharmacyLayout>
            <div className="p-6">
                <div className="mb-6">
                    <Button
                        onClick={() => router.push('/pharmacy/stock')}
                        variant="outline"
                        className="mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900">Tambah Stok Obat</h1>
                    <p className="text-gray-600 mt-1">Tambahkan stok obat ke gudang farmasi</p>
                </div>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            Form Tambah Stok
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="medicine_id">Pilih Obat *</Label>
                                <Select
                                    value={formData.medicine_id}
                                    onValueChange={(value) =>
                                        setFormData((prev) => ({ ...prev, medicine_id: value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih obat..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {loading ? (
                                            <SelectItem value="loading" disabled>
                                                Loading...
                                            </SelectItem>
                                        ) : medicines.length === 0 ? (
                                            <SelectItem value="empty" disabled>
                                                Tidak ada obat
                                            </SelectItem>
                                        ) : (
                                            medicines.map((medicine) => (
                                                <SelectItem key={medicine.id} value={medicine.id}>
                                                    {medicine.kode} - {medicine.nama}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="qty">Jumlah *</Label>
                                <Input
                                    id="qty"
                                    type="number"
                                    min="1"
                                    value={formData.qty}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, qty: e.target.value }))
                                    }
                                    placeholder="Masukkan jumlah stok"
                                />
                            </div>

                            <div>
                                <Label htmlFor="lokasi">Lokasi Penyimpanan *</Label>
                                <Select
                                    value={formData.lokasi}
                                    onValueChange={(value) =>
                                        setFormData((prev) => ({ ...prev, lokasi: value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih lokasi..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Gudang Utama">Gudang Utama</SelectItem>
                                        <SelectItem value="Apotek Lantai 1">Apotek Lantai 1</SelectItem>
                                        <SelectItem value="Apotek Lantai 2">Apotek Lantai 2</SelectItem>
                                        <SelectItem value="Ruang Farmasi">Ruang Farmasi</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex gap-3 justify-end pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push('/pharmacy/stock')}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {saving ? 'Menyimpan...' : 'Simpan Stok'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </PharmacyLayout>
    );
}
