'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Activity, Save } from 'lucide-react';
import type { Visit, TTVFormData } from '@/types/nurse';

interface TTVModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedVisit: Visit | null;
    onSubmit: (formData: TTVFormData) => Promise<void>;
}

export default function TTVModal({
    isOpen,
    onClose,
    selectedVisit,
    onSubmit,
}: TTVModalProps) {
    const [formData, setFormData] = useState<TTVFormData>({
        tensi: '',
        nadi: '',
        suhu: '',
        spo2: '',
        resp: '',
        catatan: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

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
            return;
        }

        setSaving(true);
        try {
            await onSubmit(formData);
            // Reset form
            setFormData({
                tensi: '',
                nadi: '',
                suhu: '',
                spo2: '',
                resp: '',
                catatan: '',
            });
            setErrors({});
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setFormData({
            tensi: '',
            nadi: '',
            suhu: '',
            spo2: '',
            resp: '',
            catatan: '',
        });
        setErrors({});
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="bg-blue-600 text-white -mx-6 -mt-6 px-6 py-4 rounded-t-lg mb-4">
                    <DialogTitle className="flex items-center gap-2 text-white">
                        <Activity className="w-5 h-5" />
                        Input Tanda-Tanda Vital (TTV)
                    </DialogTitle>
                </DialogHeader>

                {selectedVisit && (
                    <div className="space-y-4">
                        {/* Patient Info */}
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-2">
                            <h3 className="font-semibold text-sm text-blue-900">Informasi Pasien</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="text-blue-700">No. Reg:</span>
                                    <span className="ml-2 font-medium text-gray-900">{selectedVisit.no_reg}</span>
                                </div>
                                <div>
                                    <span className="text-blue-700">NRM:</span>
                                    <span className="ml-2 font-medium text-gray-900">{selectedVisit.patient.nrm}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-blue-700">Nama:</span>
                                    <span className="ml-2 font-medium text-gray-900">{selectedVisit.patient.nama}</span>
                                </div>
                            </div>
                        </div>

                        {/* TTV Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="tensi" className="text-gray-700">Tensi (mmHg) *</Label>
                                    <Input
                                        id="tensi"
                                        name="tensi"
                                        value={formData.tensi}
                                        onChange={handleInputChange}
                                        placeholder="120/80"
                                        className={errors.tensi ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500 focus:border-blue-500'}
                                    />
                                    {errors.tensi && (
                                        <p className="text-sm text-red-500 mt-1">{errors.tensi}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="nadi" className="text-gray-700">Nadi (bpm) *</Label>
                                    <Input
                                        id="nadi"
                                        name="nadi"
                                        type="number"
                                        value={formData.nadi}
                                        onChange={handleInputChange}
                                        placeholder="80"
                                        className={errors.nadi ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500 focus:border-blue-500'}
                                    />
                                    {errors.nadi && (
                                        <p className="text-sm text-red-500 mt-1">{errors.nadi}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="suhu" className="text-gray-700">Suhu (°C) *</Label>
                                    <Input
                                        id="suhu"
                                        name="suhu"
                                        type="number"
                                        step="0.1"
                                        value={formData.suhu}
                                        onChange={handleInputChange}
                                        placeholder="36.5"
                                        className={errors.suhu ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500 focus:border-blue-500'}
                                    />
                                    {errors.suhu && (
                                        <p className="text-sm text-red-500 mt-1">{errors.suhu}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="spo2" className="text-gray-700">SpO2 (%) *</Label>
                                    <Input
                                        id="spo2"
                                        name="spo2"
                                        type="number"
                                        value={formData.spo2}
                                        onChange={handleInputChange}
                                        placeholder="98"
                                        className={errors.spo2 ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500 focus:border-blue-500'}
                                    />
                                    {errors.spo2 && (
                                        <p className="text-sm text-red-500 mt-1">{errors.spo2}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="resp" className="text-gray-700">Respirasi (per menit) *</Label>
                                    <Input
                                        id="resp"
                                        name="resp"
                                        type="number"
                                        value={formData.resp}
                                        onChange={handleInputChange}
                                        placeholder="20"
                                        className={errors.resp ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500 focus:border-blue-500'}
                                    />
                                    {errors.resp && (
                                        <p className="text-sm text-red-500 mt-1">{errors.resp}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="catatan" className="text-gray-700">Catatan</Label>
                                <Textarea
                                    id="catatan"
                                    name="catatan"
                                    value={formData.catatan}
                                    onChange={handleInputChange}
                                    placeholder="Catatan tambahan (opsional)"
                                    rows={3}
                                    className="focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleClose}
                                    disabled={saving}
                                    className="border-2 border-blue-600 text-blue-700 hover:bg-blue-50"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    <Save className="w-4 h-4" />
                                    {saving ? 'Menyimpan...' : 'Simpan TTV'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
