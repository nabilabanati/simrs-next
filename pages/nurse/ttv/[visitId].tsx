'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import NurseLayout from '@/components/layout/NurseLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Activity, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

interface Patient {
    nrm: string;
    nama: string;
    nik: string;
    jenis_kelamin: string;
    tanggal_lahir: string;
}

interface Visit {
    id: string;
    no_reg: string;
    ttv_status: string;
    patient: Patient;
    triase?: {
        tensi: string;
        nadi: number;
        suhu: number;
        spo2: number;
        resp: number;
        catatan: string;
    };
}

export default function TTVForm() {
    const router = useRouter();
    const { visitId } = router.query;

    const [visit, setVisit] = useState<Visit | null>(null);
    const [nurseId, setNurseId] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isViewMode, setIsViewMode] = useState(false);

    const [formData, setFormData] = useState({
        tensi: '',
        nadi: '',
        suhu: '',
        spo2: '',
        resp: '',
        catatan: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Fetch nurse profile
    useEffect(() => {
        const user = localStorage.getItem('user');
        if (!user) {
            router.push('/login');
            return;
        }

        const userData = JSON.parse(user);

        fetch(`/api/nurse/profile?user_id=${userData.id}`)
            .then(res => res.json())
            .then(data => {
                if (data.nurse_id) {
                    setNurseId(data.nurse_id);
                }
            })
            .catch(err => console.error('Error fetching profile:', err));
    }, [router]);

    // Fetch visit data
    useEffect(() => {
        if (!visitId) return;

        fetch(`/api/nurse/visits?poli_id=all`) // We'll filter client-side
            .then(res => res.json())
            .then(data => {
                const foundVisit = data.visits?.find((v: Visit) => v.id === visitId);
                if (foundVisit) {
                    setVisit(foundVisit);

                    // If TTV already done, load data and set view mode
                    if (foundVisit.ttv_status === 'selesai' && foundVisit.triase) {
                        setIsViewMode(true);
                        setFormData({
                            tensi: foundVisit.triase.tensi,
                            nadi: foundVisit.triase.nadi.toString(),
                            suhu: foundVisit.triase.suhu.toString(),
                            spo2: foundVisit.triase.spo2.toString(),
                            resp: foundVisit.triase.resp.toString(),
                            catatan: foundVisit.triase.catatan || '',
                        });
                    }
                } else {
                    toast.error('Kunjungan tidak ditemukan');
                    router.push('/nurse');
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching visit:', err);
                toast.error('Gagal memuat data kunjungan');
                setLoading(false);
            });
    }, [visitId, router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.tensi) {
            newErrors.tensi = 'Tensi wajib diisi';
        } else if (!/^\d{2,3}\/\d{2,3}$/.test(formData.tensi)) {
            newErrors.tensi = 'Format tensi: XXX/YYY (contoh: 120/80)';
        }

        if (!formData.nadi) {
            newErrors.nadi = 'Nadi wajib diisi';
        } else {
            const nadi = parseInt(formData.nadi);
            if (nadi < 40 || nadi > 200) {
                newErrors.nadi = 'Nadi harus antara 40-200 bpm';
            }
        }

        if (!formData.suhu) {
            newErrors.suhu = 'Suhu wajib diisi';
        } else {
            const suhu = parseFloat(formData.suhu);
            if (suhu < 35 || suhu > 42) {
                newErrors.suhu = 'Suhu harus antara 35-42°C';
            }
        }

        if (!formData.spo2) {
            newErrors.spo2 = 'SpO2 wajib diisi';
        } else {
            const spo2 = parseInt(formData.spo2);
            if (spo2 < 0 || spo2 > 100) {
                newErrors.spo2 = 'SpO2 harus antara 0-100%';
            }
        }

        if (!formData.resp) {
            newErrors.resp = 'Respirasi wajib diisi';
        } else {
            const resp = parseInt(formData.resp);
            if (resp < 10 || resp > 60) {
                newErrors.resp = 'Respirasi harus antara 10-60 per menit';
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

        if (!nurseId || !visitId) {
            toast.error('Data tidak lengkap');
            return;
        }

        setSaving(true);

        try {
            const response = await fetch('/api/nurse/save-ttv', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visit_id: visitId,
                    nurse_id: nurseId,
                    ...formData,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Data TTV berhasil disimpan');
                router.push('/nurse');
            } else {
                toast.error(data.error || 'Gagal menyimpan data TTV');
            }
        } catch (error) {
            console.error('Error saving TTV:', error);
            toast.error('Terjadi kesalahan saat menyimpan data');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <NurseLayout>
                <div className="p-6">
                    <div className="text-center py-8">Loading...</div>
                </div>
            </NurseLayout>
        );
    }

    if (!visit) {
        return (
            <NurseLayout>
                <div className="p-6">
                    <div className="text-center py-8 text-gray-500">
                        Kunjungan tidak ditemukan
                    </div>
                </div>
            </NurseLayout>
        );
    }

    return (
        <NurseLayout>
            <div className="p-6">
                <div className="mb-6">
                    <Button
                        onClick={() => router.push('/nurse')}
                        variant="outline"
                        className="mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {isViewMode ? 'Lihat Data TTV' : 'Input Tanda-Tanda Vital (TTV)'}
                    </h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Patient Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Pasien</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div>
                                <p className="text-sm text-gray-600">No. Registrasi</p>
                                <p className="font-semibold">{visit.no_reg}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">NRM</p>
                                <p className="font-semibold">{visit.patient.nrm}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Nama</p>
                                <p className="font-semibold">{visit.patient.nama}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Jenis Kelamin</p>
                                <p className="font-semibold">
                                    {visit.patient.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* TTV Form */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="w-5 h-5" />
                                Data Tanda-Tanda Vital
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="tensi">Tensi (mmHg) *</Label>
                                        <Input
                                            id="tensi"
                                            name="tensi"
                                            value={formData.tensi}
                                            onChange={handleInputChange}
                                            placeholder="120/80"
                                            disabled={isViewMode}
                                            className={errors.tensi ? 'border-red-500' : ''}
                                        />
                                        {errors.tensi && (
                                            <p className="text-sm text-red-500 mt-1">{errors.tensi}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="nadi">Nadi (bpm) *</Label>
                                        <Input
                                            id="nadi"
                                            name="nadi"
                                            type="number"
                                            value={formData.nadi}
                                            onChange={handleInputChange}
                                            placeholder="80"
                                            disabled={isViewMode}
                                            className={errors.nadi ? 'border-red-500' : ''}
                                        />
                                        {errors.nadi && (
                                            <p className="text-sm text-red-500 mt-1">{errors.nadi}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="suhu">Suhu (°C) *</Label>
                                        <Input
                                            id="suhu"
                                            name="suhu"
                                            type="number"
                                            step="0.1"
                                            value={formData.suhu}
                                            onChange={handleInputChange}
                                            placeholder="36.5"
                                            disabled={isViewMode}
                                            className={errors.suhu ? 'border-red-500' : ''}
                                        />
                                        {errors.suhu && (
                                            <p className="text-sm text-red-500 mt-1">{errors.suhu}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="spo2">SpO2 (%) *</Label>
                                        <Input
                                            id="spo2"
                                            name="spo2"
                                            type="number"
                                            value={formData.spo2}
                                            onChange={handleInputChange}
                                            placeholder="98"
                                            disabled={isViewMode}
                                            className={errors.spo2 ? 'border-red-500' : ''}
                                        />
                                        {errors.spo2 && (
                                            <p className="text-sm text-red-500 mt-1">{errors.spo2}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="resp">Respirasi (per menit) *</Label>
                                        <Input
                                            id="resp"
                                            name="resp"
                                            type="number"
                                            value={formData.resp}
                                            onChange={handleInputChange}
                                            placeholder="20"
                                            disabled={isViewMode}
                                            className={errors.resp ? 'border-red-500' : ''}
                                        />
                                        {errors.resp && (
                                            <p className="text-sm text-red-500 mt-1">{errors.resp}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="catatan">Catatan</Label>
                                    <Textarea
                                        id="catatan"
                                        name="catatan"
                                        value={formData.catatan}
                                        onChange={handleInputChange}
                                        placeholder="Catatan tambahan (opsional)"
                                        rows={4}
                                        disabled={isViewMode}
                                    />
                                </div>

                                {!isViewMode && (
                                    <div className="flex gap-3 justify-end">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => router.push('/nurse')}
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={saving}
                                            className="bg-purple-600 hover:bg-purple-700"
                                        >
                                            <Save className="w-4 h-4 mr-2" />
                                            {saving ? 'Menyimpan...' : 'Simpan Data TTV'}
                                        </Button>
                                    </div>
                                )}
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </NurseLayout>
    );
}
