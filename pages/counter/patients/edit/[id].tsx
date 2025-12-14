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

export default function EditPatientPage() {
    const router = useRouter();
    const { id } = router.query;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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
        provinsi: '',
        kabupaten: '',
        kecamatan: '',
        kode_pos: '',
        penjamin: '',
        catatan_khusus: '',
    });

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
                provinsi: data.provinsi || '',
                kabupaten: data.kabupaten || '',
                kecamatan: data.kecamatan || '',
                kode_pos: data.kode_pos || '',
                penjamin: data.penjamin || '',
                catatan_khusus: data.catatan_khusus || '',
            });
        } catch (error) {
            console.error('Error fetching patient:', error);
            toast.error('Gagal memuat data pasien');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { error } = await supabase
                .from('patients')
                .update(formData)
                .eq('id', id);

            if (error) throw error;

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
                        <h1 className="text-3xl font-bold text-gray-900">Edit Data Pasien</h1>
                        <p className="text-gray-600 mt-1">Ubah informasi pasien</p>
                    </div>
                </div>

                {/* Form */}
                <Card>
                    <CardHeader>
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
                                        <Label htmlFor="provinsi">Provinsi</Label>
                                        <Input
                                            id="provinsi"
                                            name="provinsi"
                                            value={formData.provinsi}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="kabupaten">Kabupaten/Kota</Label>
                                        <Input
                                            id="kabupaten"
                                            name="kabupaten"
                                            value={formData.kabupaten}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="kecamatan">Kecamatan</Label>
                                        <Input
                                            id="kecamatan"
                                            name="kecamatan"
                                            value={formData.kecamatan}
                                            onChange={handleInputChange}
                                        />
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
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border rounded-md"
                                        >
                                            <option value="">Pilih</option>
                                            <option value="UMUM">UMUM</option>
                                            <option value="BPJS">BPJS</option>
                                            <option value="Asuransi">Asuransi</option>
                                        </select>
                                    </div>
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
                                    className="bg-purple-600 hover:bg-purple-700"
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
