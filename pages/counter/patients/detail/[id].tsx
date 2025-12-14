'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { CounterLayout } from '@/components/layout/CounterLayout';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Pencil, Plus } from 'lucide-react';

export default function PatientDetailPage() {
    const router = useRouter();
    const { id } = router.query;
    const [patient, setPatient] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchPatient();
        }
    }, [id]);

    const fetchPatient = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setPatient(data);
        } catch (error) {
            console.error('Error fetching patient:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <CounterLayout>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-600">Loading...</p>
                </div>
            </CounterLayout>
        );
    }

    if (!patient) {
        return (
            <CounterLayout>
                <div className="text-center py-12">
                    <p className="text-gray-600">Pasien tidak ditemukan</p>
                    <Button
                        onClick={() => router.push('/counter/patients')}
                        className="mt-4"
                    >
                        Kembali ke Daftar Pasien
                    </Button>
                </div>
            </CounterLayout>
        );
    }

    return (
        <CounterLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            onClick={() => router.push('/counter/patients')}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Kembali
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Detail Pasien</h1>
                            <p className="text-gray-600 mt-1">Informasi lengkap pasien</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => router.push(`/counter/patients/edit/${id}`)}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit Data
                        </Button>
                    </div>
                </div>

                {/* Patient Info Card */}
                <Card>
                    <CardHeader className="bg-purple-50">
                        <CardTitle>Informasi Pasien</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm font-medium text-gray-600">NRM</label>
                                <p className="mt-1 text-gray-900 font-medium">{patient.nrm || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">NIK</label>
                                <p className="mt-1 text-gray-900">{patient.nik || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Nama Lengkap</label>
                                <p className="mt-1 text-gray-900 font-medium">{patient.nama || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Jenis Kelamin</label>
                                <p className="mt-1 text-gray-900">
                                    {patient.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Tempat Lahir</label>
                                <p className="mt-1 text-gray-900">{patient.tempat_lahir || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Tanggal Lahir</label>
                                <p className="mt-1 text-gray-900">
                                    {patient.tanggal_lahir
                                        ? new Date(patient.tanggal_lahir).toLocaleDateString('id-ID')
                                        : '-'}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Pekerjaan</label>
                                <p className="mt-1 text-gray-900">{patient.pekerjaan || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Golongan Darah</label>
                                <p className="mt-1 text-gray-900">{patient.golongan_darah || '-'}</p>
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium text-gray-600">Alamat</label>
                                <p className="mt-1 text-gray-900">{patient.alamat || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Provinsi</label>
                                <p className="mt-1 text-gray-900">{patient.provinsi || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Kabupaten/Kota</label>
                                <p className="mt-1 text-gray-900">{patient.kabupaten || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Kecamatan</label>
                                <p className="mt-1 text-gray-900">{patient.kecamatan || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Kode Pos</label>
                                <p className="mt-1 text-gray-900">{patient.kode_pos || '-'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Penanggung Jawab Card */}
                <Card>
                    <CardHeader className="bg-purple-50">
                        <CardTitle>Penanggung Jawab</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm font-medium text-gray-600">Hubungan</label>
                                <p className="mt-1 text-gray-900">{patient.penanggung_jawab || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Nama</label>
                                <p className="mt-1 text-gray-900">{patient.nama_pj || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Pekerjaan</label>
                                <p className="mt-1 text-gray-900">{patient.pekerjaan_pj || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">No. Telepon</label>
                                <p className="mt-1 text-gray-900">{patient.no_telp_pj || '-'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Penjamin Card */}
                <Card>
                    <CardHeader className="bg-purple-50">
                        <CardTitle>Informasi Penjamin</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm font-medium text-gray-600">Jenis Penjamin</label>
                                <p className="mt-1 text-gray-900">{patient.penjamin || '-'}</p>
                            </div>
                            {patient.penjamin === 'BPJS' && (
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Nomor BPJS</label>
                                    <p className="mt-1 text-gray-900">{patient.nomor_bpjs || '-'}</p>
                                </div>
                            )}
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium text-gray-600">Catatan Khusus</label>
                                <p className="mt-1 text-gray-900">{patient.catatan_khusus || '-'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </CounterLayout>
    );
}
