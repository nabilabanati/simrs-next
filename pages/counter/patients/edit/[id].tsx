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
    const { id } = router.query;
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
            router.push('/counter/patients');
        } catch (error) {
            console.error('Error updating patient:', error);
            toast.error('Gagal mengupdate data pasien');
        } finally {
            setSaving(false);
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

    return (
        <CounterLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        onClick={() => router.push('/counter/patients')}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-blue-600 uppercase">Edit Data Pasien</h1>
                        <p className="text-gray-600 mt-1">Ubah informasi pasien</p>
                    </div>
                </div>

                {/* Form */}
                <Card>
                    <CardHeader className="bg-blue-50">
                        <CardTitle>Informasi Pasien</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Column */}
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="nrm">NRM</Label>
                                        <Input
                                            id="nrm"
                                            name="nrm"
                                            value={formData.nrm}
                                            readOnly
                                            className="bg-gray-100"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="nik">NIK</Label>
                                        <Input
                                            id="nik"
                                            name="nik"
                                            value={formData.nik}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="nama">Nama Lengkap</Label>
                                        <Input
                                            id="nama"
                                            name="nama"
                                            value={formData.nama}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="tempat_lahir">Tempat Lahir</Label>
                                        <Input
                                            id="tempat_lahir"
                                            name="tempat_lahir"
                                            value={formData.tempat_lahir}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="tanggal_lahir">Tanggal Lahir</Label>
                                        <Input
                                            id="tanggal_lahir"
                                            name="tanggal_lahir"
                                            type="date"
                                            value={formData.tanggal_lahir}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div>
                                        <Label>Jenis Kelamin</Label>
                                        <div className="flex gap-4 mt-2">
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="jenis_kelamin"
                                                    value="L"
                                                    checked={formData.jenis_kelamin === 'L'}
                                                    onChange={handleInputChange}
                                                    className="mr-2"
                                                />
                                                Laki-laki
                                            </label>
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="jenis_kelamin"
                                                    value="P"
                                                    checked={formData.jenis_kelamin === 'P'}
                                                    onChange={handleInputChange}
                                                    className="mr-2"
                                                />
                                                Perempuan
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="pekerjaan">Pekerjaan</Label>
                                        <Input
                                            id="pekerjaan"
                                            name="pekerjaan"
                                            value={formData.pekerjaan}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="golongan_darah">Golongan Darah</Label>
                                        <select
                                            id="golongan_darah"
                                            name="golongan_darah"
                                            value={formData.golongan_darah}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border rounded-md"
                                        >
                                            <option value="">Pilih</option>
                                            <option value="A">A</option>
                                            <option value="B">B</option>
                                            <option value="AB">AB</option>
                                            <option value="O">O</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="alamat">Alamat</Label>
                                        <Textarea
                                            id="alamat"
                                            name="alamat"
                                            value={formData.alamat}
                                            onChange={handleInputChange}
                                            rows={3}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="province_id">Provinsi</Label>
                                        <select
                                            id="province_id"
                                            name="province_id"
                                            value={formData.province_id}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border rounded-md"
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
                                        <Label htmlFor="regency_id">Kabupaten/Kota</Label>
                                        <select
                                            id="regency_id"
                                            name="regency_id"
                                            value={formData.regency_id}
                                            onChange={handleInputChange}
                                            disabled={!formData.province_id}
                                            className="w-full px-3 py-2 border rounded-md disabled:opacity-50"
                                        >
                                            <option value="">Pilih Kabupaten/Kota</option>
                                            {cities.map((city) => (
                                                <option key={city.code} value={city.code}>
                                                    {city.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <Label htmlFor="district_id">Kecamatan</Label>
                                        <select
                                            id="district_id"
                                            name="district_id"
                                            value={formData.district_id}
                                            onChange={handleInputChange}
                                            disabled={!formData.regency_id}
                                            className="w-full px-3 py-2 border rounded-md disabled:opacity-50"
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
                                        <Label htmlFor="village_id">Desa/Kelurahan</Label>
                                        <select
                                            id="village_id"
                                            name="village_id"
                                            value={formData.village_id}
                                            onChange={handleInputChange}
                                            disabled={!formData.district_id}
                                            className="w-full px-3 py-2 border rounded-md disabled:opacity-50"
                                        >
                                            <option value="">Pilih Desa/Kelurahan</option>
                                            {villages.map((village) => (
                                                <option key={village.code} value={village.code}>
                                                    {village.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <Label htmlFor="kode_pos">Kode Pos</Label>
                                        <Input
                                            id="kode_pos"
                                            name="kode_pos"
                                            value={formData.kode_pos}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="penanggung_jawab">Penanggung Jawab</Label>
                                        <Input
                                            id="penanggung_jawab"
                                            name="penanggung_jawab"
                                            value={formData.penanggung_jawab}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="nama_pj">Nama PJ</Label>
                                        <Input
                                            id="nama_pj"
                                            name="nama_pj"
                                            value={formData.nama_pj}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="penjamin">Penjamin</Label>
                                        <select
                                            id="penjamin"
                                            name="penjamin"
                                            value={formData.penjamin}
                                            onChange={(e) => handlePenjaminChange(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-md"
                                        >
                                            <option value="">Pilih Penjamin</option>
                                            <option value="UMUM">UMUM</option>
                                            <option value="BPJS">BPJS</option>
                                            <option value="Asuransi">Asuransi</option>
                                            <option value="Instansi">Instansi</option>
                                            <option value="Jasa Raharja">Jasa Raharja</option>
                                        </select>
                                    </div>

                                    {/* BPJS Fields */}
                                    {penjaminType === 'BPJS' && (
                                        <div>
                                            <Label htmlFor="nomorBPJS">Nomor BPJS</Label>
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
                                        <>
                                            <div>
                                                <Label htmlFor="namaAsuransi">Nama Asuransi</Label>
                                                <Input
                                                    id="namaAsuransi"
                                                    name="namaAsuransi"
                                                    value={formData.namaAsuransi}
                                                    onChange={handleInputChange}
                                                    placeholder="Masukkan Nama Asuransi"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="nomorAsuransi">Nomor Polis</Label>
                                                <Input
                                                    id="nomorAsuransi"
                                                    name="nomorAsuransi"
                                                    value={formData.nomorAsuransi}
                                                    onChange={handleInputChange}
                                                    placeholder="Masukkan Nomor Polis"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Instansi Fields */}
                                    {penjaminType === 'Instansi' && (
                                        <>
                                            <div>
                                                <Label htmlFor="namaInstansi">Nama Instansi</Label>
                                                <Input
                                                    id="namaInstansi"
                                                    name="namaInstansi"
                                                    value={formData.namaInstansi}
                                                    onChange={handleInputChange}
                                                    placeholder="Masukkan Nama Instansi"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="nomorSurat">Nomor Surat Penjamin</Label>
                                                <Input
                                                    id="nomorSurat"
                                                    name="nomorSurat"
                                                    value={formData.nomorSurat}
                                                    onChange={handleInputChange}
                                                    placeholder="Masukkan Nomor Surat"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Jasa Raharja Fields */}
                                    {penjaminType === 'Jasa Raharja' && (
                                        <div>
                                            <Label htmlFor="nomorPeserta">Nomor Peserta</Label>
                                            <Input
                                                id="nomorPeserta"
                                                name="nomorPeserta"
                                                value={formData.nomorPeserta}
                                                onChange={handleInputChange}
                                                placeholder="Masukkan Nomor Peserta"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="catatan_khusus">Catatan Khusus</Label>
                                <Textarea
                                    id="catatan_khusus"
                                    name="catatan_khusus"
                                    value={formData.catatan_khusus}
                                    onChange={handleInputChange}
                                    rows={3}
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 justify-end pt-4 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push('/counter/patients')}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </CounterLayout>
    );
}
