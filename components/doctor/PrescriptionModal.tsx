import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus } from "lucide-react"
import { toast } from "sonner"

interface Medicine {
    id: string
    nama: string
    total_stock: number
}

interface PrescriptionItem {
    id: string
    type: "regular" | "compounded"
    medicine_id?: string
    nama_obat: string
    qty: number
    satuan: string
    instruksi: string
    composition?: string
    max_stock?: number
}

interface PrescriptionModalProps {
    open: boolean
    onClose: () => void
    medicines: Medicine[]
    onAdd: (item: PrescriptionItem) => void
}

export default function PrescriptionModal({
    open,
    onClose,
    medicines,
    onAdd,
}: PrescriptionModalProps) {
    const [activeTab, setActiveTab] = useState<"regular" | "compounded">("regular")

    // Regular medicine form
    const [regularForm, setRegularForm] = useState({
        medicine_id: "",
        qty: 1,
        satuan: "tablet",
        instruksi: "",
    })

    // Compounded medicine form
    const [compoundedForm, setCompoundedForm] = useState({
        nama_obat: "",
        qty: 1,
        satuan: "bungkus",
        instruksi: "",
        composition: "",
    })

    const handleRegularSubmit = () => {
        // Validation
        if (!regularForm.medicine_id) {
            toast.error("Pilih obat terlebih dahulu")
            return
        }
        if (regularForm.qty <= 0) {
            toast.error("Jumlah harus lebih dari 0")
            return
        }

        const medicine = medicines.find((m) => m.id === regularForm.medicine_id)
        if (!medicine) {
            toast.error("Obat tidak ditemukan")
            return
        }

        if (regularForm.qty > medicine.total_stock) {
            toast.error(`Stok tidak mencukupi (tersedia: ${medicine.total_stock})`)
            return
        }

        // Add to prescription
        const item: PrescriptionItem = {
            id: `temp-${Date.now()}`,
            type: "regular",
            medicine_id: regularForm.medicine_id,
            nama_obat: medicine.nama,
            qty: regularForm.qty,
            satuan: regularForm.satuan,
            instruksi: regularForm.instruksi,
            max_stock: medicine.total_stock,
        }

        onAdd(item)

        // Reset form
        setRegularForm({
            medicine_id: "",
            qty: 1,
            satuan: "tablet",
            instruksi: "",
        })

        toast.success("Obat ditambahkan")
        onClose()
    }

    const handleCompoundedSubmit = () => {
        // Validation
        if (!compoundedForm.nama_obat.trim()) {
            toast.error("Nama obat racikan harus diisi")
            return
        }
        if (compoundedForm.qty <= 0) {
            toast.error("Jumlah harus lebih dari 0")
            return
        }

        // Add to prescription
        const item: PrescriptionItem = {
            id: `temp-${Date.now()}`,
            type: "compounded",
            nama_obat: compoundedForm.nama_obat,
            qty: compoundedForm.qty,
            satuan: compoundedForm.satuan,
            instruksi: compoundedForm.instruksi,
            composition: compoundedForm.composition,
        }

        onAdd(item)

        // Reset form
        setCompoundedForm({
            nama_obat: "",
            qty: 1,
            satuan: "bungkus",
            instruksi: "",
            composition: "",
        })

        toast.success("Obat racikan ditambahkan")
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Tambah Resep Obat</DialogTitle>
                </DialogHeader>

                {/* Custom Tabs */}
                <div className="flex gap-2 border-b">
                    <button
                        className={`px-4 py-2 font-medium transition-colors ${activeTab === "regular"
                                ? "border-b-2 border-purple-600 text-purple-600"
                                : "text-gray-600 hover:text-gray-900"
                            }`}
                        onClick={() => setActiveTab("regular")}
                    >
                        Obat Farmasi
                    </button>
                    <button
                        className={`px-4 py-2 font-medium transition-colors ${activeTab === "compounded"
                                ? "border-b-2 border-purple-600 text-purple-600"
                                : "text-gray-600 hover:text-gray-900"
                            }`}
                        onClick={() => setActiveTab("compounded")}
                    >
                        Racikan
                    </button>
                </div>

                {/* Tab Content: Regular Medicine */}
                {activeTab === "regular" && (
                    <div className="space-y-4 mt-4">
                        <div>
                            <Label>Obat *</Label>
                            <Select
                                value={regularForm.medicine_id}
                                onValueChange={(value) =>
                                    setRegularForm({ ...regularForm, medicine_id: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih obat dari farmasi" />
                                </SelectTrigger>
                                <SelectContent>
                                    {medicines.length === 0 ? (
                                        <div className="p-4 text-center text-sm text-gray-500">
                                            Tidak ada obat tersedia
                                        </div>
                                    ) : (
                                        medicines.map((med) => (
                                            <SelectItem key={med.id} value={med.id}>
                                                {med.nama} (Stok: {med.total_stock})
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Jumlah *</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={regularForm.qty}
                                    onChange={(e) =>
                                        setRegularForm({
                                            ...regularForm,
                                            qty: parseInt(e.target.value) || 1,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label>Satuan *</Label>
                                <Input
                                    value={regularForm.satuan}
                                    onChange={(e) =>
                                        setRegularForm({ ...regularForm, satuan: e.target.value })
                                    }
                                    placeholder="tablet, kapsul, botol, dll"
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Aturan Pakai</Label>
                            <Input
                                value={regularForm.instruksi}
                                onChange={(e) =>
                                    setRegularForm({ ...regularForm, instruksi: e.target.value })
                                }
                                placeholder="Contoh: 3x1 sehari sesudah makan"
                            />
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={onClose}>
                                Batal
                            </Button>
                            <Button onClick={handleRegularSubmit}>
                                <Plus className="w-4 h-4 mr-2" />
                                Tambah Obat
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {/* Tab Content: Compounded Medicine */}
                {activeTab === "compounded" && (
                    <div className="space-y-4 mt-4">
                        <div>
                            <Label>Nama Obat Racikan *</Label>
                            <Input
                                value={compoundedForm.nama_obat}
                                onChange={(e) =>
                                    setCompoundedForm({
                                        ...compoundedForm,
                                        nama_obat: e.target.value,
                                    })
                                }
                                placeholder="Contoh: Racikan Batuk, Puyer, dll"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Jumlah *</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={compoundedForm.qty}
                                    onChange={(e) =>
                                        setCompoundedForm({
                                            ...compoundedForm,
                                            qty: parseInt(e.target.value) || 1,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label>Satuan *</Label>
                                <Input
                                    value={compoundedForm.satuan}
                                    onChange={(e) =>
                                        setCompoundedForm({
                                            ...compoundedForm,
                                            satuan: e.target.value,
                                        })
                                    }
                                    placeholder="bungkus, puyer, dll"
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Komposisi / Formula</Label>
                            <Textarea
                                value={compoundedForm.composition}
                                onChange={(e) =>
                                    setCompoundedForm({
                                        ...compoundedForm,
                                        composition: e.target.value,
                                    })
                                }
                                placeholder="Contoh: Paracetamol 250mg, CTM 2mg, Vitamin C 50mg"
                                rows={3}
                            />
                        </div>

                        <div>
                            <Label>Aturan Pakai</Label>
                            <Input
                                value={compoundedForm.instruksi}
                                onChange={(e) =>
                                    setCompoundedForm({
                                        ...compoundedForm,
                                        instruksi: e.target.value,
                                    })
                                }
                                placeholder="Contoh: 3x1 sehari sesudah makan"
                            />
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={onClose}>
                                Batal
                            </Button>
                            <Button onClick={handleCompoundedSubmit}>
                                <Plus className="w-4 h-4 mr-2" />
                                Tambah Racikan
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
