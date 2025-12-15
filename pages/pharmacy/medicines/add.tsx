'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import PharmacyLayout from '@/components/layout/PharmacyLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function AddMedicine() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        kode: '',
        nama: '',
        harga: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.kode) {
            newErrors.kode = 'Kode obat wajib diisi';
        }

        if (!formData.nama) {
            newErrors.nama = 'Nama obat wajib diisi';
        }

        if (!formData.harga) {
            newErrors.harga = 'Harga wajib diisi';
        } else {
            const harga = parseFloat(formData.harga);
            if (isNaN(harga) || harga <= 0) {
                newErrors.harga = 'Harga harus lebih dari 0';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            toast.error('Mohon perbaiki kesalahan pada form');
            return;
        }

        setSaving(true);

        try {
            const response = await fetch('/api/pharmacy/add-medicine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Obat berhasil ditambahkan');
                router.push('/pharmacy/medicines');
            } else {
                toast.error(data.error || 'Gagal menambahkan obat');
            }
        } catch (error) {
            console.error('Error adding medicine:', error);
            toast.error('Terjadi kesalahan saat menambahkan obat');
        } finally {
            setSaving(false);
        }
    };

    return (
        <PharmacyLayout>
            <div className="p-6">
                <div className="mb-6">
                    <Button
                        onClick={() => router.push('/pharmacy/medicines')}
                        variant="outline"
                        className="mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900">Tambah Obat Baru</h1>
                    <p className="text-gray-600 mt-1">Tambahkan obat baru ke database</p>
                </div>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            Form Tambah Obat
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="kode">Kode Obat *</Label>
                                <Input
                                    id="kode"
                                    name="kode"
                                    value={formData.kode}
                                    onChange={handleInputChange}
                                    placeholder="Contoh: OBT001"
                                    className={errors.kode ? 'border-red-500' : ''}
                                />
                                {errors.kode && (
                                    <p className="text-sm text-red-500 mt-1">{errors.kode}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="nama">Nama Obat *</Label>
                                <Input
                                    id="nama"
                                    name="nama"
                                    value={formData.nama}
                                    onChange={handleInputChange}
                                    placeholder="Contoh: Paracetamol 500mg"
                                    className={errors.nama ? 'border-red-500' : ''}
                                />
                                {errors.nama && (
                                    <p className="text-sm text-red-500 mt-1">{errors.nama}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="harga">Harga (Rp) *</Label>
                                <Input
                                    id="harga"
                                    name="harga"
                                    type="number"
                                    step="0.01"
                                    value={formData.harga}
                                    onChange={handleInputChange}
                                    placeholder="Contoh: 5000"
                                    className={errors.harga ? 'border-red-500' : ''}
                                />
                                {errors.harga && (
                                    <p className="text-sm text-red-500 mt-1">{errors.harga}</p>
                                )}
                            </div>

                            <div className="flex gap-3 justify-end pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push('/pharmacy/medicines')}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {saving ? 'Menyimpan...' : 'Simpan Obat'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </PharmacyLayout>
    );
}
