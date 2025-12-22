'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pill, Plus, Trash2, Save } from 'lucide-react';

interface PrescriptionItem {
    id: string;
    type?: "regular" | "compounded";
    medicine_id?: string;
    nama_obat: string;
    qty: number;
    satuan: string;
    instruksi: string;
    composition?: string;
    max_stock?: number;
}

interface Medicine {
    id: string;
    nama: string;
    total_stock: number;
    satuan: string;
}

interface PrescriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    medicines: Medicine[];
    prescriptionItems: PrescriptionItem[];
    onAddItem: () => void;
    onRemoveItem: (id: string) => void;
    onUpdateItem: (id: string, field: keyof PrescriptionItem, value: any) => void;
    catatan: string;
    onCatatanChange: (value: string) => void;
}

export default function PrescriptionModal({
    isOpen,
    onClose,
    medicines,
    prescriptionItems,
    onAddItem,
    onRemoveItem,
    onUpdateItem,
    catatan,
    onCatatanChange,
}: PrescriptionModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="bg-blue-600 text-white -mx-6 -mt-6 px-6 py-4 rounded-t-lg mb-4">
                    <DialogTitle className="flex items-center gap-2 text-white">
                        <Pill className="w-5 h-5" />
                        Input Resep Obat
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Add Medicine Button */}
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">
                            {prescriptionItems.length === 0
                                ? 'Belum ada obat ditambahkan'
                                : `${prescriptionItems.length} obat ditambahkan`}
                        </p>
                        <Button
                            onClick={onAddItem}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Tambah Obat
                        </Button>
                    </div>

                    {/* Prescription Items */}
                    {prescriptionItems.length > 0 && (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                            {prescriptionItems.map((item, index) => (
                                <div
                                    key={item.id}
                                    className="border-2 border-blue-100 rounded-lg p-4 relative bg-blue-50/30 hover:bg-blue-50/50 transition-colors"
                                >
                                    {/* Item Number & Delete Button */}
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-sm font-semibold text-blue-900">
                                            Obat #{index + 1}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onRemoveItem(item.id)}
                                            className="hover:bg-red-50 h-8 w-8"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-600" />
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Medicine Selection */}
                                        <div className="md:col-span-2">
                                            <Label htmlFor={`medicine-${item.id}`} className="text-gray-700">
                                                Nama Obat *
                                            </Label>
                                            <Select
                                                value={item.medicine_id}
                                                onValueChange={(value) => onUpdateItem(item.id, "medicine_id", value)}
                                            >
                                                <SelectTrigger className="focus:ring-blue-500 focus:border-blue-500">
                                                    <SelectValue placeholder="Pilih obat" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {medicines.map((med) => (
                                                        <SelectItem key={med.id} value={med.id}>
                                                            {med.nama} (Stok: {med.total_stock} {med.satuan})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Quantity */}
                                        <div>
                                            <Label htmlFor={`qty-${item.id}`} className="text-gray-700">
                                                Jumlah *
                                            </Label>
                                            <Input
                                                id={`qty-${item.id}`}
                                                type="number"
                                                min={1}
                                                max={item.max_stock}
                                                value={item.qty}
                                                onChange={(e) =>
                                                    onUpdateItem(item.id, "qty", parseInt(e.target.value) || 1)
                                                }
                                                className="focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        {/* Unit */}
                                        <div>
                                            <Label htmlFor={`satuan-${item.id}`} className="text-gray-700">
                                                Satuan *
                                            </Label>
                                            <Input
                                                id={`satuan-${item.id}`}
                                                value={item.satuan}
                                                onChange={(e) => onUpdateItem(item.id, "satuan", e.target.value)}
                                                placeholder="tablet, kapsul, dll"
                                                className="focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        {/* Instructions */}
                                        <div className="md:col-span-2">
                                            <Label htmlFor={`instruksi-${item.id}`} className="text-gray-700">
                                                Instruksi / Aturan Pakai *
                                            </Label>
                                            <Input
                                                id={`instruksi-${item.id}`}
                                                value={item.instruksi}
                                                onChange={(e) =>
                                                    onUpdateItem(item.id, "instruksi", e.target.value)
                                                }
                                                placeholder="Contoh: 3x1 sehari sesudah makan"
                                                className="focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Additional Notes */}
                    {prescriptionItems.length > 0 && (
                        <div>
                            <Label htmlFor="catatan" className="text-gray-700">
                                Catatan Tambahan
                            </Label>
                            <Textarea
                                id="catatan"
                                value={catatan}
                                onChange={(e) => onCatatanChange(e.target.value)}
                                placeholder="Catatan obat yang tidak tersedia di stok, dll..."
                                rows={3}
                                className="focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    )}

                    {/* Empty State */}
                    {prescriptionItems.length === 0 && (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                            <Pill className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">Belum ada obat ditambahkan</p>
                            <p className="text-sm text-gray-400 mt-1">
                                Klik tombol "Tambah Obat" untuk menambahkan resep
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="border-2 border-blue-600 text-blue-700 hover:bg-blue-50"
                    >
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
