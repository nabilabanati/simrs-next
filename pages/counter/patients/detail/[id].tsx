'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { CounterLayout } from '@/components/layout/CounterLayout';
import { LoketLayout } from '@/components/layout/LoketLayout';
import {
    Card,
    CardContent,
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
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { Pencil, Calendar, Printer } from 'lucide-react';

export default function PatientDetailPage() {
    const router = useRouter();
    const { id, returnTo } = router.query;
    
    // Determine if accessed from loket
    const isFromLoket = returnTo && (returnTo as string).includes('/loket-');
    const loketId = isFromLoket ? parseInt((returnTo as string).match(/loket-(\d+)/)?.[1] || '1') : null;
    
    const [patient, setPatient] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [penjaminData, setPenjaminData] = useState<any>(null);
    const [visits, setVisits] = useState<any[]>([]);
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [regionNames, setRegionNames] = useState({
        province: '',
        regency: '',
        district: '',
        village: ''
    });

    // Wait for router to be ready to prevent layout flicker
    if (!router.isReady) {
        return null; // or a minimal loading spinner
    }

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
            
            // Set loading to false IMMEDIATELY to display patient data
            setLoading(false);
            
            // Fetch additional data in background (non-blocking)
            if (data) {
                fetchRegionNames(data); // Lazy load - non-blocking
                fetchPenjaminData(data.id);
                fetchVisits(data.id);
            }
        } catch (error) {
            console.error('Error fetching patient:', error);
            setLoading(false);
        }
    };

    const fetchPenjaminData = async (patientId: string) => {
        console.log('Fetching penjamin for patient:', patientId);
        try {
            const { data, error } = await supabase
                .from('patient_penjamin')
                .select(`
                    *,
                    penjamin:penjamin_id (
                        nama,
                        tipe
                    )
                `)
                .eq('patient_id', patientId)
                .single();

            console.log('Penjamin query result:', { data, error });

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching penjamin:', error);
            } else if (data) {
                console.log('Setting penjamin data:', data);
                setPenjaminData(data);
            } else {
                console.log('No penjamin data found (UMUM)');
            }
        } catch (error) {
            console.error('Error fetching penjamin:', error);
        }
    };

    const fetchRegionNames = async (patientData: any) => {
        console.log('=== FETCHING REGION NAMES ===');
        console.log('Patient IDs:', {
            province_id: patientData.province_id,
            regency_id: patientData.regency_id,
            district_id: patientData.district_id,
            village_id: patientData.village_id,
            kode_pos: patientData.kode_pos,
            alamat: patientData.alamat
        });
        
        try {
            // Array to store promises for parallel API calls
            const fetchPromises = [];
            
            // Helper function to fetch region name
            const fetchRegionName = async (url: string, fieldName: string) => {
                try {
                    console.log(`Fetching ${fieldName} from:`, url);
                    const response = await fetch(url);
                    if (!response.ok) {
                        console.error(`${fieldName} API error:`, response.status, response.statusText);
                        return '';
                    }
                    const data = await response.json();
                    console.log(`${fieldName} response:`, data);
                    return data.name || '';
                } catch (error) {
                    console.error(`Error fetching ${fieldName}:`, error);
                    return '';
                }
            };

            // Fetch province
            if (patientData.province_id) {
                fetchPromises.push(
                    fetchRegionName(
                        `https://www.emsifa.com/api-wilayah-indonesia/api/province/${patientData.province_id}.json`,
                        'Province'
                    )
                );
            } else {
                fetchPromises.push(Promise.resolve(''));
            }

            // Fetch regency/city  
            if (patientData.regency_id) {
                fetchPromises.push(
                    fetchRegionName(
                        `https://www.emsifa.com/api-wilayah-indonesia/api/regency/${patientData.regency_id}.json`,
                        'Regency'
                    )
                );
            } else {
                fetchPromises.push(Promise.resolve(''));
            }

            // Fetch district
            if (patientData.district_id) {
                fetchPromises.push(
                    fetchRegionName(
                        `https://www.emsifa.com/api-wilayah-indonesia/api/district/${patientData.district_id}.json`,
                        'District'
                    )
                );
            } else {
                fetchPromises.push(Promise.resolve(''));
            }

            // Fetch village
            if (patientData.village_id) {
                fetchPromises.push(
                    fetchRegionName(
                        `https://www.emsifa.com/api-wilayah-indonesia/api/village/${patientData.village_id}.json`,
                        'Village'
                    )
                );
            } else {
                fetchPromises.push(Promise.resolve(''));
            }

            const [province, regency, district, village] = await Promise.all(fetchPromises);
            
            setRegionNames({
                province,
                regency,
                district,
                village
            });

            console.log('=== FINAL REGION NAMES ===', { province, regency, district, village });
        } catch (error) {
            console.error('Error in fetchRegionNames:', error);
        }
    };

    const fetchVisits = async (patientId: string) => {
        console.log('Fetching visits for patient:', patientId);
        try {
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

            console.log('Visits query result:', { data, error });

            if (error) {
                console.error('Error fetching visits:', error);
                return;
            }

            const doctorUserIds = [...new Set(
                (data || []).map(v => v.doctors?.user_id).filter(Boolean)
            )];

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

            const visitsWithDoctors = (data || []).map(visit => ({
                ...visit,
                dokter_name: visit.doctors?.user_id 
                    ? userNameMap.get(visit.doctors.user_id) || '-'
                    : '-',
                penjamin_name: visit.payment_methods?.nama || 'UMUM'
            }));

            console.log('Final visits with doctors:', visitsWithDoctors);
            setVisits(visitsWithDoctors);
        } catch (error) {
            console.error('Error fetching visits:', error);
        }
    };

    const calculateAge = (birthdate: string) => {
        if (!birthdate) return '-';
        const today = new Date();
        const birth = new Date(birthdate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return `${age} Tahun`;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const filteredVisits = visits.filter(visit => {
        const visitDate = new Date(visit.created_at);
        const from = filterDateFrom ? new Date(filterDateFrom) : null;
        const to = filterDateTo ? new Date(filterDateTo + 'T23:59:59') : null;
        
        if (from && to) {
            return visitDate >= from && visitDate <= to;
        } else if (from) {
            return visitDate >= from;
        } else if (to) {
            return visitDate <= to;
        }
        return true;
    });

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
                        onClick={() => {
                            const url = returnTo 
                                ? `/counter/patients?returnTo=${encodeURIComponent(returnTo as string)}`
                                : '/counter/patients';
                            router.push(url);
                        }}
                        className="mt-4"
                    >
                        Kembali ke Daftar Pasien
                    </Button>
                </div>
            </CounterLayout>
        );
    }

    const renderContent = () => (
        <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">DETAIL PASIEN</h1>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={async () => {
                                // Build full address
                                const parts = [];
                                if (patient.alamat) parts.push(patient.alamat);
                                if (regionNames.village) parts.push(`Desa ${regionNames.village}`);
                                if (regionNames.district) parts.push(`Kecamatan ${regionNames.district}`);
                                if (regionNames.regency) parts.push(regionNames.regency);
                                if (regionNames.province) parts.push(regionNames.province);
                                if (patient.kode_pos) parts.push(patient.kode_pos);
                                const fullAddress = parts.length > 0 ? parts.join(', ') : '-';

                                const printWindow = window.open('', '', 'width=800,height=600');
                                if (printWindow) {
                                    printWindow.document.write(`
                                        <html>
                                        <head>
                                            <title>Kartu Identitas Pasien - ${patient.nrm}</title>
                                            <style>
                                                @page { margin: 1cm; }
                                                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                                                .container { max-width: 800px; margin: 0 auto; }
                                                .header { text-align: center; border-bottom: 2px solid #1f2937; padding-bottom: 15px; margin-bottom: 30px; }
                                                .header h1 { color: #1f2937; margin: 0; font-size: 24px; font-weight: bold; }
                                                .header p { margin: 5px 0 0 0; font-size: 12px; color: #6b7280; }
                                                .title { text-align: center; margin-bottom: 30px; }
                                                .title h2 { font-size: 20px; font-weight: bold; text-decoration: underline; margin: 0; }
                                                .section { margin-bottom: 25px; }
                                                .section-title { font-weight: 600; color: #1f2937; margin-bottom: 12px; border-bottom: 1px solid #d1d5db; padding-bottom: 5px; font-size: 14px; }
                                                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 30px; }
                                                .field { display: flex; font-size: 13px; margin-bottom: 8px; }
                                                .field .label { width: 160px; font-weight: 500; }
                                                .field .colon { margin: 0 8px; }
                                                .field .value { flex: 1; font-weight: 600; }
                                                .full-width { grid-column: 1 / -1; }
                                                .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #d1d5db; font-size: 10px; color: #9ca3af; font-style: italic; }
                                            </style>
                                        </head>
                                        <body>
                                            <div class="container">
                                                <div class="header">
                                                    <h1>LAYANAN KESEHATAN</h1>
                                                    <p>Jl.  No. 123, Kota , Provinsi</p>
                                                    <p>Telp: (021) 1234-5678 | Email: info@layanankesehatan.com</p>
                                                </div>
                                                
                                                <div class="title">
                                                    <h2>KARTU IDENTITAS PASIEN</h2>
                                                </div>

                                                <div class="section">
                                                    <div class="section-title">DATA PASIEN</div>
                                                    <div class="grid">
                                                        <div class="field">
                                                            <span class="label">No. Rekam Medis</span>
                                                            <span class="colon">:</span>
                                                            <span class="value">${patient.nrm}</span>
                                                        </div>
                                                        <div class="field">
                                                            <span class="label">Jenis Kelamin</span>
                                                            <span class="colon">:</span>
                                                            <span class="value">${patient.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                                                        </div>
                                                        <div class="field">
                                                            <span class="label">NIK</span>
                                                            <span class="colon">:</span>
                                                            <span class="value">${patient.nik || '-'}</span>
                                                        </div>
                                                        <div class="field">
                                                            <span class="label">Pekerjaan</span>
                                                            <span class="colon">:</span>
                                                            <span class="value">${patient.pekerjaan || '-'}</span>
                                                        </div>
                                                        <div class="field">
                                                            <span class="label">Nama Pasien</span>
                                                            <span class="colon">:</span>
                                                            <span class="value">${patient.nama.toUpperCase()}</span>
                                                        </div>
                                                        <div class="field">
                                                            <span class="label">Golongan Darah</span>
                                                            <span class="colon">:</span>
                                                            <span class="value">${patient.golongan_darah || '-'}</span>
                                                        </div>
                                                        <div class="field">
                                                            <span class="label">Tanggal Lahir</span>
                                                            <span class="colon">:</span>
                                                            <span class="value">${new Date(patient.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                                        </div>
                                                        <div class="field">
                                                            <span class="label">No. Telepon</span>
                                                            <span class="colon">:</span>
                                                            <span class="value">${patient.no_telp || '-'}</span>
                                                        </div>
                                                        <div class="field">
                                                            <span class="label">Umur</span>
                                                            <span class="colon">:</span>
                                                            <span class="value">${calculateAge(patient.tanggal_lahir)}</span>
                                                        </div>
                                                    </div>
                                                    <div class="field full-width" style="margin-top: 10px;">
                                                        <span class="label">Alamat</span>
                                                        <span class="colon">:</span>
                                                        <span class="value">${fullAddress}</span>
                                                    </div>
                                                </div>

                                                <div class="section">
                                                    <div class="section-title">PENANGGUNG JAWAB</div>
                                                    <div class="grid">
                                                        <div class="field">
                                                            <span class="label">Nama PJ</span>
                                                            <span class="colon">:</span>
                                                            <span class="value">${patient.nama_pj || '-'}</span>
                                                        </div>
                                                        <div class="field">
                                                            <span class="label">No. Telepon PJ</span>
                                                            <span class="colon">:</span>
                                                            <span class="value">${patient.no_telp_pj || '-'}</span>
                                                        </div>
                                                        <div class="field">
                                                            <span class="label">Hubungan</span>
                                                            <span class="colon">:</span>
                                                            <span class="value">${patient.penanggung_jawab || '-'}</span>
                                                        </div>
                                                        <div class="field">
                                                            <span class="label">Pekerjaan PJ</span>
                                                            <span class="colon">:</span>
                                                            <span class="value">${patient.pekerjaan_pj || '-'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div class="section">
                                                    <div class="section-title">INFORMASI PENJAMIN</div>
                                                    <div class="field">
                                                        <span class="label">Jenis Penjamin</span>
                                                        <span class="colon">:</span>
                                                        <span class="value">${penjaminData?.penjamin?.nama || 'UMUM'}</span>
                                                    </div>
                                                    ${penjaminData?.penjamin?.tipe?.toLowerCase() === 'bpjs' && penjaminData?.nomor_bpjs ? `
                                                    <div class="field">
                                                        <span class="label">No. BPJS</span>
                                                        <span class="colon">:</span>
                                                        <span class="value">${penjaminData.nomor_bpjs}</span>
                                                    </div>
                                                    ` : ''}
                                                    ${penjaminData?.penjamin?.tipe?.toLowerCase() === 'asuransi' ? `
                                                        ${penjaminData?.nama_asuransi ? `
                                                        <div class="field">
                                                            <span class="label">Nama Asuransi</span>
                                                            <span class="colon">:</span>
                                                            <span class="value">${penjaminData.nama_asuransi}</span>
                                                        </div>
                                                        ` : ''}
                                                        ${penjaminData?.nomor_polis ? `
                                                        <div class="field">
                                                            <span class="label">No. Polis</span>
                                                            <span class="colon">:</span>
                                                            <span class="value">${penjaminData.nomor_polis}</span>
                                                        </div>
                                                        ` : ''}
                                                    ` : ''}
                                                </div>

                                                <div class="footer">
                                                    Dokumen ini dibuat secara elektronik dan sah tanpa tanda tangan basah
                                                </div>
                                            </div>
                                        </body>
                                        </html>
                                    `);
                                    printWindow.document.close();
                                    printWindow.print();
                                }
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            <Printer className="w-4 h-4 mr-2" />
                            Cetak Identitas
                        </Button>
                        <Button
                            onClick={() => {
                                const url = returnTo 
                                    ? `/counter/patients/edit/${id}?returnTo=${encodeURIComponent(returnTo as string)}`
                                    : `/counter/patients/edit/${id}`;
                                router.push(url);
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                        >
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit Data
                        </Button>
                    </div>
                </div>

                {/* Patient Header Info */}
                <Card>
                    <CardContent className="p-6">
                        <h2 className="text-xl font-bold mb-2">{patient.nama || 'NY. -'}</h2>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p>NRM: {patient.nrm || '-'}</p>
                            <p>Tanggal Terdaftar: {formatDate(patient.created_at)}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* All Patient Information - Single Card */}
                <Card>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* INFORMASI PASIEN */}
                            <div>
                                <h3 className="font-bold text-blue-600 uppercase mb-3">INFORMASI PASIEN</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="font-semibold">NIK</div>
                                        <div>{patient.nik || '-'}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="font-semibold">Tgl. Lahir / Umur</div>
                                        <div>{formatDate(patient.tanggal_lahir)} / {calculateAge(patient.tanggal_lahir)}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="font-semibold">Jenis Kelamin</div>
                                        <div>{patient.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="font-semibold">Pekerjaan</div>
                                        <div>{patient.pekerjaan || '-'}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="font-semibold">Golongan Darah</div>
                                        <div>{patient.golongan_darah || '-'}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="font-semibold">Alamat</div>
                                        <div className="text-xs">
                                            {(() => {
                                                const parts = [];
                                                if (patient.alamat) parts.push(patient.alamat);
                                                if (regionNames.village) parts.push(`Desa ${regionNames.village}`);
                                                if (regionNames.district) parts.push(`Kecamatan ${regionNames.district}`);
                                                if (regionNames.regency) parts.push(regionNames.regency);
                                                if (regionNames.province) parts.push(regionNames.province);
                                                if (patient.kode_pos) parts.push(patient.kode_pos);
                                                return parts.length > 0 ? parts.join(', ') : '-';
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* INFORMASI PENANGGUNG JAWAB */}
                            <div>
                                <h3 className="font-bold text-blue-600 uppercase mb-3">PENANGGUNG JAWAB</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="font-semibold">Nama PJ</div>
                                        <div>{patient.nama_pj || '-'}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="font-semibold">No. Telp</div>
                                        <div>{patient.no_telp_pj || '-'}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="font-semibold">Hubungan</div>
                                        <div>{patient.penanggung_jawab || '-'}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="font-semibold">Pekerjaan</div>
                                        <div>{patient.pekerjaan_pj || '-'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* INFORMASI PENJAMIN */}
                            <div>
                                <h3 className="font-bold text-blue-600 uppercase mb-3">INFORMASI PENJAMIN</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="font-semibold">Jenis</div>
                                        <div>{penjaminData?.penjamin?.nama || 'UMUM'}</div>
                                    </div>
                                    
                                    {/* Show rujukan fields only if patient has rujukan data */}
                                    {patient.asal_rujukan && (
                                        <>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="font-semibold">Asal Rujukan</div>
                                                <div>{patient.asal_rujukan}</div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="font-semibold">No. Rujukan</div>
                                                <div>{patient.no_rujukan || '-'}</div>
                                            </div>
                                        </>
                                    )}
                                    
                                    {/* BPJS - show nomor_bpjs */}
                                    {penjaminData?.penjamin?.tipe?.toLowerCase() === 'bpjs' && penjaminData?.nomor_bpjs && (
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="font-semibold">No. BPJS</div>
                                            <div>{penjaminData.nomor_bpjs}</div>
                                        </div>
                                    )}
                                    
                                    {/* Asuransi - show nama and nomor_polis */}
                                    {penjaminData?.penjamin?.tipe?.toLowerCase() === 'asuransi' && (
                                        <>
                                            {penjaminData?.nama_asuransi && (
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="font-semibold">Nama Asuransi</div>
                                                    <div>{penjaminData.nama_asuransi}</div>
                                                </div>
                                            )}
                                            {penjaminData?.nomor_polis && (
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="font-semibold">No. Polis</div>
                                                    <div>{penjaminData.nomor_polis}</div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                    

                                    {patient.catatan_khusus && (
                                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
                                            <div className="font-semibold text-yellow-600">Catatan Khusus</div>
                                            <div className="text-yellow-700">{patient.catatan_khusus}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Riwayat Kunjungan */}
                <Card>
                    <CardContent className="p-6">
                        <h3 className="text-lg font-bold mb-4">Riwayat Kunjungan</h3>
                        
                        {/* Date Range Filter */}
                        <div className="flex gap-2 mb-4 items-center">
                            <span className="text-sm text-gray-600">Filter Tanggal:</span>
                            <Input
                                type="date"
                                value={filterDateFrom}
                                onChange={(e) => setFilterDateFrom(e.target.value)}
                                className="w-40 bg-white"
                            />
                            <span className="self-center text-gray-600">s.d.</span>
                            <Input
                                type="date"
                                value={filterDateTo}
                                onChange={(e) => setFilterDateTo(e.target.value)}
                                className="w-40 bg-white"
                            />
                        </div>

                        {/* Visits Table - Compact Style */}
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="text-blue-600 font-bold px-4 py-3">No.</TableHead>
                                        <TableHead className="text-blue-600 font-bold px-4 py-3">Tanggal</TableHead>
                                        <TableHead className="text-blue-600 font-bold px-4 py-3">Poliklinik</TableHead>
                                        <TableHead className="text-blue-600 font-bold px-4 py-3">Dokter</TableHead>
                                        <TableHead className="text-blue-600 font-bold px-4 py-3">Keluhan</TableHead>
                                        <TableHead className="text-blue-600 font-bold px-4 py-3">Penjamin</TableHead>
                                        <TableHead className="text-blue-600 font-bold px-4 py-3">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredVisits.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                                Tidak ada data kunjungan
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredVisits.map((visit, index) => (
                                            <TableRow key={visit.id}>
                                                <TableCell className="px-4 py-3">{index + 1}</TableCell>
                                                <TableCell className="px-4 py-3">{formatDate(visit.created_at)}</TableCell>
                                                <TableCell className="px-4 py-3">{visit.poli?.nama || '-'}</TableCell>
                                                <TableCell className="px-4 py-3">{visit.dokter_name}</TableCell>
                                                <TableCell className="px-4 py-3">{visit.keluhan || '-'}</TableCell>
                                                <TableCell className="px-4 py-3">{visit.penjamin_name}</TableCell>
                                                <TableCell className="px-4 py-3">
                                                    <span className={`inline-flex items-center gap-1 py-1 px-2 rounded-full text-xs font-medium ${
                                                        visit.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        visit.status === 'processed' ? 'bg-blue-100 text-blue-800' :
                                                        visit.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {visit.status === 'pending' ? 'Menunggu' :
                                                         visit.status === 'completed' ? 'Selesai' :
                                                         visit.status === 'processed' ? 'Ditangani' :
                                                         visit.status}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
    );

    // Render with appropriate layout
    if (isFromLoket && loketId) {
        return <LoketLayout loketId={loketId}>{renderContent()}</LoketLayout>;
    }
    
    return <CounterLayout>{renderContent()}</CounterLayout>;
}
