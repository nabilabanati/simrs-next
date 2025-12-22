'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Activity, X } from 'lucide-react';

interface TTVData {
    tensi: string;
    nadi: number;
    suhu: number;
    spo2: number;
    resp: number;
    catatan: string;
    nurses?: {
        users?: {
            nama: string;
        };
    };
}

interface Patient {
    nrm: string;
    nama: string;
    jenis_kelamin: string;
}

interface Visit {
    id: string;
    no_reg: string;
    patient: Patient;
    triase?: TTVData;
}

interface TTVDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    visit: Visit | null;
}

export default function TTVDetailModal({ isOpen, onClose, visit }: TTVDetailModalProps) {
    if (!visit || !visit.triase) return null;

    const ttv = visit.triase;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader className="bg-blue-600 text-white -mx-6 -mt-6 px-6 py-4 rounded-t-lg mb-4">
                    <DialogTitle className="flex items-center gap-2 text-white">
                        <Activity className="w-5 h-5" />
                        Detail Tanda-Tanda Vital (TTV)
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Patient Info */}
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-2">
                        <h3 className="font-semibold text-sm text-blue-900">Informasi Pasien</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-blue-700">No. Reg:</span>
                                <span className="ml-2 font-medium text-gray-900">{visit.no_reg}</span>
                            </div>
                            <div>
                                <span className="text-blue-700">NRM:</span>
                                <span className="ml-2 font-medium text-gray-900">{visit.patient.nrm}</span>
                            </div>
                            <div className="col-span-2">
                                <span className="text-blue-700">Nama:</span>
                                <span className="ml-2 font-medium text-gray-900">{visit.patient.nama}</span>
                            </div>
                            <div>
                                <span className="text-blue-700">Jenis Kelamin:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                    {visit.patient.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* TTV Data */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Data Vital Signs</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Tensi</p>
                                <p className="text-lg font-semibold text-gray-900">{ttv.tensi}</p>
                                <p className="text-xs text-gray-500">mmHg</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Nadi</p>
                                <p className="text-lg font-semibold text-gray-900">{ttv.nadi}</p>
                                <p className="text-xs text-gray-500">x/menit</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Suhu</p>
                                <p className="text-lg font-semibold text-gray-900">{ttv.suhu}</p>
                                <p className="text-xs text-gray-500">°C</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">SpO2</p>
                                <p className="text-lg font-semibold text-gray-900">{ttv.spo2}</p>
                                <p className="text-xs text-gray-500">%</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Respirasi</p>
                                <p className="text-lg font-semibold text-gray-900">{ttv.resp}</p>
                                <p className="text-xs text-gray-500">x/menit</p>
                            </div>
                            {ttv.nurses?.users?.nama && (
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Perawat</p>
                                    <p className="text-sm font-semibold text-gray-900">{ttv.nurses.users.nama}</p>
                                </div>
                            )}
                        </div>

                        {/* Catatan */}
                        {ttv.catatan && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="text-sm text-gray-600 font-semibold mb-2">Catatan Perawat:</p>
                                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                    {ttv.catatan}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        onClick={onClose}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
