'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import PharmacyLayout from '@/components/layout/PharmacyLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pill, User, CheckCircle, Package } from 'lucide-react';
import { toast } from 'sonner';

interface PrescriptionDetail {
    id: string;
    no_order: string;
    status: string;
    created_at: string;
    visit: {
        no_reg: string;
        patient: {
            nrm: string;
            nama: string;
            nik: string;
            jenis_kelamin: string;
        };
        poli: {
            nama: string;
        };
    };
    created_by_user: {
        nama: string;
    };
    prescription_items: Array<{
        id: string;
        nama_obat: string;
        qty: number;
        satuan: string;
        instruksi: string;
        medicine: {
            kode: string;
            nama: string;
            harga: number;
        };
    }>;
}

export default function PrescriptionDetail() {
    const router = useRouter();
    const { id } = router.query;

    const [prescription, setPrescription] = useState<PrescriptionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (id) {
            fetchPrescription();
        }
    }, [id]);

    const fetchPrescription = async () => {
        try {
            const response = await fetch(`/api/pharmacy/prescription/${id}`);
            const data = await response.json();

            if (response.ok) {
                setPrescription(data.prescription);
            } else {
                toast.error('Gagal memuat data resep');
            }
        } catch (error) {
            console.error('Error fetching prescription:', error);
            toast.error('Terjadi kesalahan saat memuat data');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus: string) => {
        if (!prescription) return;

        setProcessing(true);

        try {
            const response = await fetch('/api/pharmacy/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prescription_id: prescription.id,
                    status: newStatus,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message);
                fetchPrescription(); // Refresh data
            } else {
                toast.error(data.error || 'Gagal mengupdate status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Terjadi kesalahan saat mengupdate status');
        } finally {
            setProcessing(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { className: string; label: string }> = {
            'pending': { className: 'bg-yellow-500', label: 'Menunggu' },
            'ready': { className: 'bg-blue-500', label: 'Siap' },
            'dispensed': { className: 'bg-green-500', label: 'Selesai' },
        };

        const config = variants[status] || { className: 'bg-gray-500', label: status };

        return (
            <Badge className={config.className}>
                {config.label}
            </Badge>
        );
    };

    const calculateTotal = () => {
        if (!prescription) return 0;
        return prescription.prescription_items.reduce(
            (sum, item) => sum + (item.medicine?.harga || 0) * item.qty,
            0
        );
    };

    if (loading) {
        return (
            <PharmacyLayout>
                <div className="p-6">
                    <div className="text-center py-8">Loading...</div>
                </div>
            </PharmacyLayout>
        );
    }

    if (!prescription) {
        return (
            <PharmacyLayout>
                <div className="p-6">
                    <div className="text-center py-8 text-gray-500">
                        Resep tidak ditemukan
                    </div>
                </div>
            </PharmacyLayout>
        );
    }

    return (
        <PharmacyLayout>
            <div className="p-6">
                <div className="mb-6">
                    <Button
                        onClick={() => router.push('/pharmacy')}
                        variant="outline"
                        className="mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali
                    </Button>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Detail Resep</h1>
                            <p className="text-gray-600 mt-1">No. Order: {prescription.no_order}</p>
                        </div>
                        {getStatusBadge(prescription.status)}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Patient Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Informasi Pasien
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div>
                                <p className="text-sm text-gray-600">No. Registrasi</p>
                                <p className="font-semibold">{prescription.visit.no_reg}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">NRM</p>
                                <p className="font-semibold">{prescription.visit.patient.nrm}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Nama</p>
                                <p className="font-semibold">{prescription.visit.patient.nama}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Poli</p>
                                <p className="font-semibold">{prescription.visit.poli.nama}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Dokter</p>
                                <p className="font-semibold">{prescription.created_by_user.nama}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Tanggal</p>
                                <p className="font-semibold">
                                    {new Date(prescription.created_at).toLocaleDateString('id-ID')}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Prescription Items */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Pill className="w-5 h-5" />
                                Daftar Obat
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Kode</TableHead>
                                        <TableHead>Nama Obat</TableHead>
                                        <TableHead>Qty</TableHead>
                                        <TableHead>Satuan</TableHead>
                                        <TableHead>Harga</TableHead>
                                        <TableHead>Subtotal</TableHead>
                                        <TableHead>Instruksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {prescription.prescription_items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.medicine?.kode || '-'}</TableCell>
                                            <TableCell className="font-medium">{item.nama_obat}</TableCell>
                                            <TableCell>{item.qty}</TableCell>
                                            <TableCell>{item.satuan}</TableCell>
                                            <TableCell>
                                                Rp {(item.medicine?.harga || 0).toLocaleString('id-ID')}
                                            </TableCell>
                                            <TableCell>
                                                Rp {((item.medicine?.harga || 0) * item.qty).toLocaleString('id-ID')}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600">
                                                {item.instruksi || '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-right font-bold">
                                            Total:
                                        </TableCell>
                                        <TableCell className="font-bold">
                                            Rp {calculateTotal().toLocaleString('id-ID')}
                                        </TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>

                            {/* Action Buttons */}
                            <div className="mt-6 flex gap-3 justify-end">
                                {prescription.status === 'pending' && (
                                    <Button
                                        onClick={() => handleUpdateStatus('ready')}
                                        disabled={processing}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Package className="w-4 h-4 mr-2" />
                                        {processing ? 'Memproses...' : 'Mulai Packing'}
                                    </Button>
                                )}
                                {prescription.status === 'ready' && (
                                    <Button
                                        onClick={() => handleUpdateStatus('dispensed')}
                                        disabled={processing}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        {processing ? 'Memproses...' : 'Selesai & Serahkan'}
                                    </Button>
                                )}
                                {prescription.status === 'dispensed' && (
                                    <div className="text-green-600 font-semibold flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" />
                                        Resep sudah diserahkan
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PharmacyLayout>
    );
}
