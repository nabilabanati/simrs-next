import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react"
import { toast } from "sonner"

interface PrescriptionItem {
    id: string
    medicine_id: string
    nama_obat: string
    qty: number
    satuan: string
    instruksi: string
    max_stock: number
}

export default function SOAPFormPage() {
    const router = useRouter()
    const { visitId } = router.query

    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Data
    const [visit, setVisit] = useState<any>(null)
    const [patient, setPatient] = useState<any>(null)
    const [ttvData, setTtvData] = useState<any>(null)
    const [medicines, setMedicines] = useState<any[]>([])
    const [existingSOAP, setExistingSOAP] = useState<any>(null)

    // SOAP form
    const [subjective, setSubjective] = useState("")
    const [objective, setObjective] = useState("")
    const [assessment, setAssessment] = useState("")
    const [plan, setPlan] = useState("")

    // Prescription
    const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([])
    const [catatan, setCatatan] = useState("")

    // ================= AUTH CHECK =================
    useEffect(() => {
        const u = JSON.parse(localStorage.getItem("user") || "null")
        if (!u || u.role !== "dokter") {
            router.push("/login")
            return
        }
        setUser(u)
    }, [router])

    // ================= FETCH DATA =================
    useEffect(() => {
        if (!visitId || !user) return
        fetchData()
    }, [visitId, user])

    async function fetchData() {
        setLoading(true)

        try {
            // 1. Get visit data
            const { data: visitData } = await supabase
                .from("visits")
                .select(`
          *,
          patients:patient_id (*)
        `)
                .eq("id", visitId)
                .single()

            if (visitData) {
                setVisit(visitData)
                setPatient(visitData.patients)
            }

            // 2. Get TTV data
            const ttvRes = await fetch(`/api/triase?visit_id=${visitId}`)
            const ttvJson = await ttvRes.json()
            if (ttvJson.data) {
                setTtvData(ttvJson.data)
            }

            // 3. Get existing SOAP if any
            const { data: soapData } = await supabase
                .from("medical_records")
                .select("*")
                .eq("visit_id", visitId)
                .single()

            if (soapData) {
                setExistingSOAP(soapData)
                setSubjective(soapData.anamnesis || "")
                setObjective(soapData.pemeriksaan_fisik || "")
                setAssessment(soapData.assessment || "")
                setPlan(soapData.plan || "")
            }

            // 4. Get medicines with stock
            const medRes = await fetch("/api/master/medicines-with-stock")
            const medJson = await medRes.json()
            if (medJson.data) {
                setMedicines(medJson.data)
            }
        } catch (error) {
            console.error("Error fetching data:", error)
            toast.error("Gagal memuat data")
        } finally {
            setLoading(false)
        }
    }

    // ================= PRESCRIPTION MANAGEMENT =================
    const addPrescriptionItem = () => {
        setPrescriptionItems([
            ...prescriptionItems,
            {
                id: `temp-${Date.now()}`,
                medicine_id: "",
                nama_obat: "",
                qty: 1,
                satuan: "tablet",
                instruksi: "",
                max_stock: 0,
            },
        ])
    }

    const removePrescriptionItem = (id: string) => {
        setPrescriptionItems(prescriptionItems.filter((item) => item.id !== id))
    }

    const updatePrescriptionItem = (
        id: string,
        field: keyof PrescriptionItem,
        value: any
    ) => {
        setPrescriptionItems(
            prescriptionItems.map((item) => {
                if (item.id === id) {
                    // If medicine_id changed, update stock info
                    if (field === "medicine_id") {
                        const medicine = medicines.find((m) => m.id === value)
                        return {
                            ...item,
                            medicine_id: value,
                            nama_obat: medicine?.nama || "",
                            max_stock: medicine?.total_stock || 0,
                        }
                    }
                    return { ...item, [field]: value }
                }
                return item
            })
        )
    }

    // ================= VALIDATION =================
    const validateForm = (): boolean => {
        // SOAP fields optional per user request
        // But prescription items must be valid if added
        for (const item of prescriptionItems) {
            if (!item.medicine_id) {
                toast.error("Pilih obat untuk semua item resep")
                return false
            }
            if (item.qty <= 0) {
                toast.error("Jumlah obat harus lebih dari 0")
                return false
            }
            if (item.qty > item.max_stock) {
                toast.error(
                    `Stok ${item.nama_obat} tidak mencukupi (tersedia: ${item.max_stock})`
                )
                return false
            }
        }
        return true
    }

    // ================= SAVE =================
    const handleSave = async () => {
        if (!validateForm()) return

        setSaving(true)

        try {
            // 1. Save/Update SOAP
            const soapPayload = {
                visit_id: visitId,
                anamnesis: subjective || null,
                pemeriksaan_fisik: objective || null,
                assessment: assessment || null,
                plan: plan || null,
                created_by: user.id,
            }

            let soapId = existingSOAP?.id

            if (existingSOAP) {
                // Update existing
                const { error } = await supabase
                    .from("medical_records")
                    .update(soapPayload)
                    .eq("id", existingSOAP.id)

                if (error) throw error
            } else {
                // Insert new
                const { data, error } = await supabase
                    .from("medical_records")
                    .insert(soapPayload)
                    .select()
                    .single()

                if (error) throw error
                soapId = data.id
            }

            // 2. Save prescription if items exist
            if (prescriptionItems.length > 0) {
                // Create prescription header
                const { data: prescriptionData, error: prescError } = await supabase
                    .from("prescriptions")
                    .insert({
                        visit_id: visitId,
                        created_by: user.id,
                        status: "pending",
                    })
                    .select()
                    .single()

                if (prescError) throw prescError

                // Insert prescription items
                const items = prescriptionItems.map((item) => ({
                    prescription_id: prescriptionData.id,
                    medicine_id: item.medicine_id,
                    nama_obat: item.nama_obat,
                    qty: item.qty,
                    satuan: item.satuan,
                    instruksi: item.instruksi,
                }))

                const { error: itemsError } = await supabase
                    .from("prescription_items")
                    .insert(items)

                if (itemsError) throw itemsError

                // Create pharmacy order
                await supabase.from("pharmacy_orders").insert({
                    prescription_id: prescriptionData.id,
                    status: "waiting",
                })
            }

            toast.success("Data pemeriksaan berhasil disimpan")
            router.push(`/doctor/patients/${visit.patient_id}?visit=${visitId}`)
        } catch (error: any) {
            console.error("Error saving:", error)
            toast.error(error.message || "Gagal menyimpan data")
        } finally {
            setSaving(false)
        }
    }

    if (!user || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Memuat data...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="p-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali
                    </Button>

                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Pemeriksaan Medis (SOAP)
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Pasien: <span className="font-semibold">{patient?.nama}</span> (
                            {patient?.nrm})
                        </p>
                        <p className="text-gray-600">
                            No. Registrasi: <span className="font-semibold">{visit?.no_reg}</span>
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* TTV Section (Read-only) */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4">
                            Tanda-Tanda Vital (TTV)
                        </h2>

                        {ttvData ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Tensi</p>
                                    <p className="font-medium">{ttvData.tensi || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Nadi</p>
                                    <p className="font-medium">{ttvData.nadi || "-"} x/menit</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Suhu</p>
                                    <p className="font-medium">{ttvData.suhu || "-"} °C</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">SpO2</p>
                                    <p className="font-medium">{ttvData.spo2 || "-"} %</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Respirasi</p>
                                    <p className="font-medium">{ttvData.resp || "-"} x/menit</p>
                                </div>
                                <div className="col-span-2 md:col-span-3">
                                    <p className="text-sm text-gray-500">Catatan Perawat</p>
                                    <p className="font-medium">{ttvData.catatan || "-"}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500">TTV belum diisi oleh perawat</p>
                        )}
                    </div>

                    {/* SOAP Form */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4">Form SOAP</h2>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="subjective">S (Subjective) - Keluhan Pasien</Label>
                                <Textarea
                                    id="subjective"
                                    value={subjective}
                                    onChange={(e) => setSubjective(e.target.value)}
                                    placeholder="Pasien mengeluhkan..."
                                    rows={3}
                                />
                            </div>

                            <div>
                                <Label htmlFor="objective">O (Objective) - Pemeriksaan Fisik</Label>
                                <Textarea
                                    id="objective"
                                    value={objective}
                                    onChange={(e) => setObjective(e.target.value)}
                                    placeholder="Hasil pemeriksaan fisik..."
                                    rows={3}
                                />
                            </div>

                            <div>
                                <Label htmlFor="assessment">A (Assessment) - Diagnosis</Label>
                                <Textarea
                                    id="assessment"
                                    value={assessment}
                                    onChange={(e) => setAssessment(e.target.value)}
                                    placeholder="Diagnosis..."
                                    rows={2}
                                />
                            </div>

                            <div>
                                <Label htmlFor="plan">P (Plan) - Rencana Tindakan</Label>
                                <Textarea
                                    id="plan"
                                    value={plan}
                                    onChange={(e) => setPlan(e.target.value)}
                                    placeholder="Rencana tindakan..."
                                    rows={2}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Prescription Section (Optional) */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Resep Obat (Opsional)</h2>
                            <Button onClick={addPrescriptionItem} size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Tambah Obat
                            </Button>
                        </div>

                        {prescriptionItems.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">
                                Belum ada obat ditambahkan
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {prescriptionItems.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className="border rounded-lg p-4 relative"
                                    >
                                        <div className="absolute top-2 right-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removePrescriptionItem(item.id)}
                                            >
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label>Obat</Label>
                                                <Select
                                                    value={item.medicine_id}
                                                    onValueChange={(value) =>
                                                        updatePrescriptionItem(item.id, "medicine_id", value)
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Pilih obat" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {medicines.map((med) => (
                                                            <SelectItem key={med.id} value={med.id}>
                                                                {med.nama} (Stok: {med.total_stock})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <Label>Jumlah</Label>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        max={item.max_stock}
                                                        value={item.qty}
                                                        onChange={(e) =>
                                                            updatePrescriptionItem(
                                                                item.id,
                                                                "qty",
                                                                parseInt(e.target.value) || 1
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Satuan</Label>
                                                    <Input
                                                        value={item.satuan}
                                                        onChange={(e) =>
                                                            updatePrescriptionItem(item.id, "satuan", e.target.value)
                                                        }
                                                    />
                                                </div>
                                            </div>

                                            <div className="md:col-span-2">
                                                <Label>Instruksi (Aturan Pakai)</Label>
                                                <Input
                                                    value={item.instruksi}
                                                    onChange={(e) =>
                                                        updatePrescriptionItem(
                                                            item.id,
                                                            "instruksi",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Contoh: 3x1 sehari sesudah makan"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <div>
                                    <Label>Catatan Tambahan</Label>
                                    <Textarea
                                        value={catatan}
                                        onChange={(e) => setCatatan(e.target.value)}
                                        placeholder="Catatan obat yang tidak tersedia di stok, dll..."
                                        rows={2}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => router.back()}>
                            Batal
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? "Menyimpan..." : "Simpan Pemeriksaan"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
