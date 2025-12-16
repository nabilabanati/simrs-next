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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Pencil, Plus } from 'lucide-react';

export default function PatientDetailPage() {
    const router = useRouter();
    const { id } = router.query;
    const [patient, setPatient] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [regionNames, setRegionNames] = useState({
        province: '',
        regency: '',
        district: '',
        village: ''
    });
    const [penjaminData, setPenjaminData] = useState<any>(null);
    const [visits, setVisits] = useState<any[]>([]);

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
            
            // Fetch region names if IDs exist
            if (data) {
                await fetchRegionNames(data);
                await fetchPenjaminData(data.id);
                await fetchVisits(data.id);
            }
        } catch (error) {
            console.error('Error fetching patient:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPenjaminData = async (patientId: string) => {
        try {
            const { data, error } = await supabase
                .from('patient_penjamin')
                .select(`
                    *,
                    penjamin (
                        nama,
                        tipe
                    )
                `)
                .eq('patient_id', patientId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching penjamin:', error);
            } else if (data) {
                setPenjaminData(data);
            }
        } catch (error) {
            console.error('Error fetching penjamin:', error);
        }
    };

    const fetchVisits = async (patientId: string) => {
        try {
            // Fetch visits with related data
            const { data, error } = await supabase
                .from('visits')
                .select(`
                    *,
                    poli(nama),
                    doctors(id, user_id),
                    payment_methods:penjamin_id(nama)
                `)
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching visits:', error);
                return;
            }

            // Get unique doctor user_ids
            const doctorUserIds = [...new Set(
                (data || []).map(v => v.doctors?.user_id).filter(Boolean)
            )];

            // Fetch doctor names
            let userNameMap = new Map();
            if (doctorUserIds.length > 0) {
                const { data: usersData } = await supabase
                    .from('users')
                    .select('id, nama')
                    .in('id', doctorUserIds);

                if (usersData) {
                    userNameMap = new Map(usersData.map(u => [u.id, u.nama]));
                }
            }

            // Map visits with doctor names
            const visitsWithDoctors = (data || []).map(visit => ({
                ...visit,
                dokter: {
                    ...visit.doctors,
                    users: {
                        nama: visit.doctors?.user_id 
                            ? userNameMap.get(visit.doctors.user_id) || '-'
                            : '-'
                    }
                },
                penjamin: visit.payment_methods
            }));

            setVisits(visitsWithDoctors);
        } catch (error) {
            console.error('Error fetching visits:', error);
        }
    };

    const fetchRegionNames = async (patientData: any) => {
        try {
            const names: any = {};

            // Fetch province name
            if (patientData.province_id) {
                const response = await fetch('/api/regions/provinces');
                const provinces = await response.json();
                const province = provinces.find((p: any) => p.code === patientData.province_id);
                names.province = province?.name || '';
            }

            // Fetch regency name
            if (patientData.regency_id) {
                const response = await fetch(`/api/regions/regencies?province_id=${patientData.province_id}`);
                const regencies = await response.json();
                const regency = regencies.find((r: any) => r.code === patientData.regency_id);
                names.regency = regency?.name || '';
            }

            // Fetch district name
            if (patientData.district_id) {
                const response = await fetch(`/api/regions/districts?regency_id=${patientData.regency_id}`);
                const districts = await response.json();
                const district = districts.find((d: any) => d.code === patientData.district_id);
                names.district = district?.name || '';
            }

            // Fetch village name
            if (patientData.village_id) {
                const response = await fetch(`/api/regions/villages?district_id=${patientData.district_id}`);
                const villages = await response.json();
                const village = villages.find((v: any) => v.code === patientData.village_id);
                names.village = village?.name || '';
            }

            setRegionNames(names);
        } catch (error) {
            console.error('Error fetching region names:', error);
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
                            <h1 className="text-3xl font-bold text-blue-600 uppercase">Detail Pasien</h1>
                            <p className="text-gray-600 mt-1">Informasi lengkap pasien</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => router.push(`/counter/patients/edit/${id}`)}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit Data
                        </Button>
                    </div>
                </div>

                {/* Patient Info Card */}
                <Card>
                    <CardHeader className="bg-blue-50">
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
                                <p className="mt-1 text-gray-900">{regionNames.province || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Kabupaten/Kota</label>
                                <p className="mt-1 text-gray-900">{regionNames.regency || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Kecamatan</label>
                                <p className="mt-1 text-gray-900">{regionNames.district || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Desa/Kelurahan</label>
                                <p className="mt-1 text-gray-900">{regionNames.village || '-'}</p>
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
                    <CardHeader className="bg-blue-50">
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
                    <CardHeader className="bg-blue-50">
                        <CardTitle>Informasi Penjamin</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm font-medium text-gray-600">Jenis Penjamin</label>
                                <p className="mt-1 text-gray-900">
                                    {penjaminData?.penjamin?.nama || 'UMUM'}
                                </p>
                            </div>
                            {penjaminData?.nomor_bpjs && (
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Nomor BPJS</label>
                                    <p className="mt-1 text-gray-900">{penjaminData.nomor_bpjs}</p>
                                </div>
                            )}
                            {penjaminData?.nama_asuransi && (
                                <div>
                                    <label className="text-sm font-medium text-gray-600">
                                        {penjaminData.penjamin?.nama === 'Instansi' ? 'Nama Instansi' : 'Nama Asuransi'}
                                    </label>
                                    <p className="mt-1 text-gray-900">{penjaminData.nama_asuransi}</p>
                                </div>
                            )}
                            {penjaminData?.nomor_polis && (
                                <div>
                                    <label className="text-sm font-medium text-gray-600">
                                        {penjaminData.penjamin?.nama === 'Instansi' ? 'Nomor Surat' : 
                                         penjaminData.penjamin?.nama === 'Jasa Raharja' ? 'Nomor Peserta' : 'Nomor Polis'}
                                    </label>
                                    <p className="mt-1 text-gray-900">{penjaminData.nomor_polis}</p>
                                </div>
                            )}
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium text-gray-600">Catatan Khusus</label>
                                <p className="mt-1 text-gray-900">{patient.catatan_khusus || '-'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

            {/* Visit History Card */}
            <Card>
                <CardHeader className="bg-purple-50">
                    <CardTitle>Riwayat Kunjungan</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px] text-center">No</TableHead>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Poli</TableHead>
                                <TableHead>Dokter</TableHead>
                                <TableHead>Penjamin</TableHead>
                                <TableHead>Keluhan</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visits.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                        Belum ada riwayat kunjungan
                                    </TableCell>
                                </TableRow>
                            ) : (
                                visits.map((visit, index) => (
                                    <TableRow key={visit.id}>
                                        <TableCell className="text-center">{visit.kunjungan_ke || index + 1}</TableCell>
                                        <TableCell>
                                            {new Date(visit.created_at).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </TableCell>
                                        <TableCell>{visit.poli?.nama || '-'}</TableCell>
                                        <TableCell className="font-medium">
                                            {visit.dokter?.users?.nama || '-'}
                                        </TableCell>
                                        <TableCell>{visit.penjamin?.nama || 'Umum'}</TableCell>
                                        <TableCell>{visit.keluhan || '-'}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                visit.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                visit.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {visit.status || 'Pending'}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            </div>
        </CounterLayout>
    );
}
