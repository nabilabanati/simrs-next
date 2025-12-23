'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { CounterLayout } from '@/components/layout/CounterLayout';
import { LoketLayout } from '@/components/layout/LoketLayout';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface Province {
    code: string;
    name: string;
}

interface City {
    code: string;
    name: string;
}

interface District {
    code: string;
    name: string;
}

interface Village {
    code: string;
    name: string;
}

export default function EditPatientPage() {
    const router = useRouter();
    const { id, returnTo } = router.query;
    
    // Determine if accessed from loket
    const isFromLoket = returnTo && (returnTo as string).includes('/loket-');
    const loketId = isFromLoket ? parseInt((returnTo as string).match(/loket-(\d+)/)?.[1] || '1') : null;
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [penjaminType, setPenjaminType] = useState('');
    const [penjaminId, setPenjaminId] = useState<string | null>(null);
    
    // Region data
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [villages, setVillages] = useState<Village[]>([]);
    
    const [formData, setFormData] = useState({
        nrm: '',
        nik: '',
        nama: '',
        tempat_lahir: '',
        tanggal_lahir: '',
        jenis_kelamin: '',
        pekerjaan: '',
        no_telp: '',
        golongan_darah: '',
        penanggung_jawab: '',
        nama_pj: '',
        pekerjaan_pj: '',
        no_telp_pj: '',
        alamat: '',
        province_id: '',
        regency_id: '',
        district_id: '',
        village_id: '',
        kode_pos: '',
        penjamin: '',
        nomorBPJS: '',
        namaAsuransi: '',
        nomorAsuransi: '',
        namaInstansi: '',
        nomorSurat: '',
        nomorPeserta: '',
        catatan_khusus: '',
    });

    // Load provinces on mount
    useEffect(() => {
        const loadProvinces = async () => {
            try {
                const response = await fetch('/api/regions/provinces');
                const data = await response.json();
                setProvinces(data);
            } catch (error) {
                console.error('Error loading provinces:', error);
            }
        };
        loadProvinces();
    }, []);

    useEffect(() => {
        if (id) {
            fetchPatient();
        }
    }, [id]);

    // Load cities when province changes
    useEffect(() => {
        if (formData.province_id) {
            const loadCities = async () => {
                try {
                    const response = await fetch(`/api/regions/regencies?province_id=${formData.province_id}`);
                    const data = await response.json();
                    setCities(data);
                } catch (error) {
                    console.error('Error loading cities:', error);
                }
            };
            loadCities();
        }
    }, [formData.province_id]);

    // Load districts when city changes
    useEffect(() => {
        if (formData.regency_id) {
            const loadDistricts = async () => {
                try {
                    const response = await fetch(`/api/regions/districts?regency_id=${formData.regency_id}`);
                    const data = await response.json();
                    setDistricts(data);
                } catch (error) {
                    console.error('Error loading districts:', error);
                }
            };
            loadDistricts();
        }
    }, [formData.regency_id]);

    // Load villages when district changes
    useEffect(() => {
        if (formData.district_id) {
            const loadVillages = async () => {
                try {
                    const response = await fetch(`/api/regions/villages?district_id=${formData.district_id}`);
                    const data = await response.json();
                    setVillages(data);
                } catch (error) {
                    console.error('Error loading villages:', error);
                }
            };
            loadVillages();
        }
    }, [formData.district_id]);

    const fetchPatient = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            setFormData({
                nrm: data.nrm || '',
                nik: data.nik || '',
                nama: data.nama || '',
                tempat_lahir: data.tempat_lahir || '',
                tanggal_lahir: data.tanggal_lahir || '',
                jenis_kelamin: data.jenis_kelamin || '',
                pekerjaan: data.pekerjaan || '',
                no_telp: data.no_telp || '',
                golongan_darah: data.golongan_darah || '',
                penanggung_jawab: data.penanggung_jawab || '',
                nama_pj: data.nama_pj || '',
                pekerjaan_pj: data.pekerjaan_pj || '',
                no_telp_pj: data.no_telp_pj || '',
                alamat: data.alamat || '',
                province_id: data.province_id || '',
                regency_id: data.regency_id || '',
                district_id: data.district_id || '',
                village_id: data.village_id || '',
                kode_pos: data.kode_pos || '',
                penjamin: '',
                nomorBPJS: '',
                namaAsuransi: '',
                nomorAsuransi: '',
                namaInstansi: '',
                nomorSurat: '',
                nomorPeserta: '',
                catatan_khusus: data.catatan_khusus || '',
            });
            
            // Fetch penjamin data
            await fetchPenjaminData(data.id);
        } catch (error) {
            console.error('Error fetching patient:', error);
            toast.error('Gagal memuat data pasien');
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
                return;
            }

            if (data) {
                setPenjaminId(data.id);
                const penjaminNama = data.penjamin?.nama || '';
                setPenjaminType(penjaminNama);
                
                setFormData(prev => ({
                    ...prev,
                    penjamin: penjaminNama,
                    nomorBPJS: data.nomor_bpjs || '',
                    namaAsuransi: data.nama_asuransi || '',
                    nomorAsuransi: data.nomor_polis || '',
                    namaInstansi: data.nama_asuransi || '',
                    nomorSurat: data.nomor_polis || '',
                    nomorPeserta: data.nomor_polis || '',
                }));
            }
        } catch (error) {
            console.error('Error fetching penjamin:', error);
        }
    };

    const handlePenjaminChange = (value: string) => {
        setPenjaminType(value);
        setFormData(prev => ({ ...prev, penjamin: value }));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Update patient data
            const { error: patientError } = await supabase
                .from('patients')
                .update({
                    nik: formData.nik,
                    nama: formData.nama,
                    tempat_lahir: formData.tempat_lahir,
                    tanggal_lahir: formData.tanggal_lahir,
                    jenis_kelamin: formData.jenis_kelamin,
                    pekerjaan: formData.pekerjaan,
                    no_telp: formData.no_telp,
                    golongan_darah: formData.golongan_darah,
                    penanggung_jawab: formData.penanggung_jawab,
                    nama_pj: formData.nama_pj,
                pekerjaan_pj: formData.pekerjaan_pj,
                no_telp_pj: formData.no_telp_pj,
                alamat: formData.alamat,
                province_id: formData.province_id,
                regency_id: formData.regency_id,
                district_id: formData.district_id,
                village_id: formData.village_id,
                kode_pos: formData.kode_pos,
                catatan_khusus: formData.catatan_khusus,
            })
                .eq('id', id);

            if (patientError) throw patientError;

            // Handle penjamin update
            if (formData.penjamin) {
                // Get or create penjamin
                const { data: penjaminData, error: penjaminError } = await supabase
                    .from('penjamin')
                    .select('id')
                    .eq('nama', formData.penjamin)
                    .single();

                let currentPenjaminId = penjaminData?.id;

                if (!currentPenjaminId) {
                    const { data: newPenjamin } = await supabase
                        .from('penjamin')
                        .insert([{ nama: formData.penjamin, tipe: formData.penjamin.toLowerCase() }])
                        .select()
                        .single();
                    currentPenjaminId = newPenjamin?.id;
                }

                if (currentPenjaminId) {
                    const patientPenjaminData: any = {
                        patient_id: id,
                        penjamin_id: currentPenjaminId,
                    };

                    if (formData.penjamin === 'BPJS') {
                        patientPenjaminData.nomor_bpjs = formData.nomorBPJS;
                    } else if (formData.penjamin === 'Asuransi') {
                        patientPenjaminData.nama_asuransi = formData.namaAsuransi;
                        patientPenjaminData.nomor_polis = formData.nomorAsuransi;
                    } else if (formData.penjamin === 'Instansi') {
                        patientPenjaminData.nama_asuransi = formData.namaInstansi;
                        patientPenjaminData.nomor_polis = formData.nomorSurat;
                    } else if (formData.penjamin === 'Jasa Raharja') {
                        patientPenjaminData.nomor_polis = formData.nomorPeserta;
                    }

                    // Update or insert patient_penjamin
                    if (penjaminId) {
                        await supabase
                            .from('patient_penjamin')
                            .update(patientPenjaminData)
                            .eq('id', penjaminId);
                    } else {
                        await supabase
                            .from('patient_penjamin')
                            .insert([patientPenjaminData]);
                    }
                }
            }

            toast.success('Data pasien berhasil diupdate');
            const redirectUrl = returnTo as string || '/counter/patients';
            router.push(redirectUrl);
        } catch (error) {
            console.error('Error updating patient:', error);
            toast.error('Gagal mengupdate data pasien');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        const LoadingContent = () => (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-600">Loading...</p>
            </div>
        );
        
        if (isFromLoket && loketId) {
            return <LoketLayout loketId={loketId}><LoadingContent /></LoketLayout>;
        }
        return <CounterLayout><LoadingContent /></CounterLayout>;
    }

    const renderContent = () => (
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-blue-600 uppercase">Edit Data Pasien</h1>
                    <p className="text-gray-600 mt-1">Ubah informasi pasien</p>
                </div>

                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">INFORMASI PASIEN</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Column: Personal Information & Penanggung Jawab */}
                                <div className="space-y-6">
                                    {/* Personal Info Section */}
                                    <div className="space-y-4">
                                        {/* NRM */}
                                        <div>
                                            <Label htmlFor="nrm" className="text-sm font-medium">
                                                NRM
                                            </Label>
                                            <Input
                                                id="nrm"
                                                name="nrm"
                                                value={formData.nrm}
                                                readOnly
                                                className="bg-gray-100 text-gray-700 cursor-not-allowed font-medium"
                                            />
                                        </div>

                                        {/* NIK */}
                                        <div>
                                            <Label htmlFor="nik" className="text-sm font-medium">
                                                NIK
                                            </Label>
                                            <Input
                                                id="nik"
                                                name="nik"
                                                value={formData.nik}
                                                onChange={handleInputChange}
                                                placeholder="Contoh: 3302245811240004"
                                            />
                                        </div>

                                        {/* Nama Pasien */}
                                        <div>
                                            <Label htmlFor="nama" className="text-sm font-medium">
                                                Nama Pasien <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="nama"
                                                name="nama"
                                                value={formData.nama}
                                                onChange={handleInputChange}
                                                placeholder="Nama lengkap pasien"
                                                required
                                            />
                                        </div>

                                        {/* Tempat/Tgl. Lahir */}
                                        <div>
                                            <Label className="text-sm font-medium">Tempat / Tanggal Lahir</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    name="tempat_lahir"
                                                    value={formData.tempat_lahir}
                                                    onChange={handleInputChange}
                                                    placeholder="Tempat Lahir"
                                                    className="flex-1"
                                                />
                                                <Input
                                                    type="date"
                                                    name="tanggal_lahir"
                                                    value={formData.tanggal_lahir}
                                                    onChange={handleInputChange}
                                                    className="w-40"
                                                />
                                            </div>
                                        </div>

                                        {/* Jenis Kelamin */}
                                        <div>
                                            <Label className="text-sm font-medium mb-1.5 block">Jenis Kelamin</Label>
                                            <div className="flex gap-6">
                                                <label className="flex items-center cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="jenis_kelamin"
                                                        value="L"
                                                        checked={formData.jenis_kelamin === 'L'}
                                                        onChange={handleInputChange}
                                                        className="w-4 h-4 text-blue-600"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">Laki - laki</span>
                                                </label>
                                                <label className="flex items-center cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="jenis_kelamin"
                                                        value="P"
                                                        checked={formData.jenis_kelamin === 'P'}
                                                        onChange={handleInputChange}
                                                        className="w-4 h-4 text-blue-600"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">Perempuan</span>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Pekerjaan */}
                                        <div>
                                            <Label htmlFor="pekerjaan" className="text-sm font-medium">
                                                Pekerjaan
                                            </Label>
                                            <Input
                                                id="pekerjaan"
                                                name="pekerjaan"
                                                value={formData.pekerjaan}
                                                onChange={handleInputChange}
                                                placeholder="Pekerjaan pasien"
                                            />
                                        </div>

                                        {/* No. Telepon Pasien */}
                                        <div>
                                            <Label htmlFor="no_telp" className="text-sm font-medium">
                                                No. Telepon Pasien
                                            </Label>
                                            <Input
                                                id="no_telp"
                                                name="no_telp"
                                                value={formData.no_telp}
                                                onChange={handleInputChange}
                                                placeholder="Contoh: 0812xxxxxx"
                                            />
                                        </div>

                                        {/* Golongan Darah */}
                                        <div>
                                            <Label htmlFor="golongan_darah" className="text-sm font-medium">
                                                Golongan Darah
                                            </Label>
                                            <select
                                                id="golongan_darah"
                                                name="golongan_darah"
                                                value={formData.golongan_darah}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Pilih golongan darah</option>
                                                <option value="A">A</option>
                                                <option value="B">B</option>
                                                <option value="AB">AB</option>
                                                <option value="O">O</option>
                                                <option value="-">-</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Divider for PJ */}
                                    <div className="pt-4 border-t border-gray-100">
                                        <h3 className="text-sm font-semibold text-blue-600 uppercase mb-4">
                                            Data Penanggung Jawab
                                        </h3>
                                        
                                        <div className="space-y-4">
                                            {/* Penanggung Jawab Role */}
                                            <div>
                                                <Label htmlFor="penanggung_jawab" className="text-sm font-medium">
                                                    Hubungan dengan Pasien
                                                </Label>
                                                <select
                                                   id="penanggung_jawab"
                                                   name="penanggung_jawab" 
                                                   value={formData.penanggung_jawab}
                                                   onChange={handleInputChange} // Uses name attribute
                                                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">Pilih hubungan</option>
                                                    <option value="Anak">Anak</option>
                                                    <option value="Orang Tua">Orang Tua</option>
                                                    <option value="Suami/Istri">Suami/Istri</option>
                                                    <option value="Saudara">Saudara</option>
                                                    <option value="Diri Sendiri">Diri Sendiri</option>
                                                    <option value="Lainnya">Lainnya</option>
                                                </select>
                                            </div>

                                            {/* Nama PJ */}
                                            <div>
                                                <Label htmlFor="nama_pj" className="text-sm font-medium">
                                                    Nama Penanggung Jawab
                                                </Label>
                                                <Input
                                                    id="nama_pj"
                                                    name="nama_pj"
                                                    value={formData.nama_pj}
                                                    onChange={handleInputChange}
                                                    placeholder="Nama lengkap PJ"
                                                />
                                            </div>

                                            {/* Pekerjaan PJ */}
                                            <div>
                                                <Label htmlFor="pekerjaan_pj" className="text-sm font-medium">
                                                    Pekerjaan PJ
                                                </Label>
                                                <Input
                                                    id="pekerjaan_pj"
                                                    name="pekerjaan_pj"
                                                    value={formData.pekerjaan_pj}
                                                    onChange={handleInputChange}
                                                    placeholder="Pekerjaan PJ"
                                                />
                                            </div>

                                            {/* No. Telp PJ */}
                                            <div>
                                                <Label htmlFor="no_telp_pj" className="text-sm font-medium">
                                                    No. Telepon PJ
                                                </Label>
                                                <Input
                                                    id="no_telp_pj"
                                                    name="no_telp_pj"
                                                    value={formData.no_telp_pj}
                                                    onChange={handleInputChange}
                                                    placeholder="Contoh: 0812xxxxxx"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Address & Penjamin */}
                                <div className="space-y-6">
                                    {/* Address Section */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold text-blue-600 uppercase mb-4">
                                            Alamat
                                        </h3>
                                        
                                        {/* Alamat */}
                                        <div>
                                            <Label htmlFor="alamat" className="text-sm font-medium">
                                                Alamat Lengkap
                                            </Label>
                                            <Textarea
                                                id="alamat"
                                                name="alamat"
                                                value={formData.alamat}
                                                onChange={handleInputChange}
                                                placeholder="Jalan, RT/RW, Dusun"
                                                rows={3}
                                            />
                                        </div>

                                        {/* Region Rows */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="province_id" className="text-sm font-medium">
                                                    Provinsi
                                                </Label>
                                                <select
                                                    id="province_id"
                                                    name="province_id"
                                                    value={formData.province_id}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">Pilih Provinsi</option>
                                                    {provinces.map((prov) => (
                                                        <option key={prov.code} value={prov.code}>
                                                            {prov.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <Label htmlFor="regency_id" className="text-sm font-medium">
                                                    Kabupaten/Kota
                                                </Label>
                                                <select
                                                    id="regency_id"
                                                    name="regency_id"
                                                    value={formData.regency_id}
                                                    onChange={handleInputChange}
                                                    disabled={!formData.province_id}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                                >
                                                    <option value="">Pilih Kabupaten</option>
                                                    {cities.map((city) => (
                                                        <option key={city.code} value={city.code}>
                                                            {city.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="district_id" className="text-sm font-medium">
                                                    Kecamatan
                                                </Label>
                                                <select
                                                    id="district_id"
                                                    name="district_id"
                                                    value={formData.district_id}
                                                    onChange={handleInputChange}
                                                    disabled={!formData.regency_id}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                                >
                                                    <option value="">Pilih Kecamatan</option>
                                                    {districts.map((district) => (
                                                        <option key={district.code} value={district.code}>
                                                            {district.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <Label htmlFor="village_id" className="text-sm font-medium">
                                                    Desa/Kelurahan
                                                </Label>
                                                <select
                                                    id="village_id"
                                                    name="village_id"
                                                    value={formData.village_id}
                                                    onChange={handleInputChange}
                                                    disabled={!formData.district_id}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                                >
                                                    <option value="">Pilih Desa</option>
                                                    {villages.map((village) => (
                                                        <option key={village.code} value={village.code}>
                                                            {village.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Kode Pos */}
                                        <div>
                                            <Label htmlFor="kode_pos" className="text-sm font-medium">
                                                Kode Pos
                                            </Label>
                                            <Input
                                                id="kode_pos"
                                                name="kode_pos"
                                                value={formData.kode_pos}
                                                onChange={handleInputChange}
                                                placeholder="Contoh: 53182"
                                            />
                                        </div>
                                    </div>

                                    {/* Divider for Penjamin */}
                                    <div className="pt-4 border-t border-gray-100">
                                        <h3 className="text-sm font-semibold text-blue-600 uppercase mb-4">
                                            Data Penjamin
                                        </h3>

                                        <div className="space-y-4">
                                            {/* Penjamin Select */}
                                            <div>
                                                <Label htmlFor="penjamin" className="text-sm font-medium">
                                                    Penjamin
                                                </Label>
                                                <select
                                                    id="penjamin"
                                                    name="penjamin"
                                                    value={formData.penjamin}
                                                    onChange={(e) => handlePenjaminChange(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">Pilih Penjamin</option>
                                                    <option value="UMUM">UMUM</option>
                                                    <option value="BPJS">BPJS</option>
                                                    <option value="Asuransi">Asuransi</option>
                                                </select>
                                            </div>

                                            {/* BPJS Fields */}
                                            {penjaminType === 'BPJS' && (
                                                <div>
                                                    <Label htmlFor="nomorBPJS" className="text-sm font-medium">
                                                        Nomor BPJS
                                                    </Label>
                                                    <Input
                                                        id="nomorBPJS"
                                                        name="nomorBPJS"
                                                        value={formData.nomorBPJS}
                                                        onChange={handleInputChange}
                                                        placeholder="Masukkan No. BPJS"
                                                    />
                                                </div>
                                            )}

                                            {/* Asuransi Fields */}
                                            {penjaminType === 'Asuransi' && (
                                                <div className="space-y-3">
                                                    <div>
                                                        <Label htmlFor="namaAsuransi" className="text-sm font-medium">
                                                            Nama Asuransi
                                                        </Label>
                                                        <Input
                                                            id="namaAsuransi"
                                                            name="namaAsuransi"
                                                            value={formData.namaAsuransi}
                                                            onChange={handleInputChange}
                                                            placeholder="Masukkan Nama Asuransi"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="nomorAsuransi" className="text-sm font-medium">
                                                            Nomor Polis
                                                        </Label>
                                                        <Input
                                                            id="nomorAsuransi"
                                                            name="nomorAsuransi"
                                                            value={formData.nomorAsuransi}
                                                            onChange={handleInputChange}
                                                            placeholder="Masukkan Nomor Polis"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Catatan Khusus */}
                                            <div className="border-t border-gray-100 pt-4 mt-4">
                                                <Label htmlFor="catatan_khusus" className="text-sm font-medium mb-1 block">
                                                    Catatan Khusus (Alergi, Riwayat Penyakit, dll)
                                                </Label>
                                                <Textarea
                                                    id="catatan_khusus"
                                                    name="catatan_khusus"
                                                    value={formData.catatan_khusus}
                                                    onChange={handleInputChange}
                                                    placeholder="Tuliskan catatan khusus medis jika ada..."
                                                    rows={3}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 justify-end pt-6 border-t">
                                <Button
                                    type="button"
                                    onClick={() => router.push('/counter/patients')}
                                    className="px-6 bg-red-500 hover:bg-red-600 text-white"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 bg-blue-600 hover:bg-blue-700"
                                >
                                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </Button>
                            </div>
                        </form>
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
