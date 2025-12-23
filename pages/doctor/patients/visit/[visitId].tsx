import { useEffect, useState, useMemo } from "react"
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
import { ArrowLeft, Plus, Trash2, Save, Pill } from "lucide-react"
import { toast } from "sonner"
import PrescriptionModal from "@/components/modals/PrescriptionModal"
import { Badge } from "@/components/ui/badge"
import DoctorLayout from "@/components/layout/DoctorLayout"
import Breadcrumb from "@/components/dashboard/poli/Breadcrumb"
import InvoiceModal from "@/components/modals/InvoiceModal"

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
    const [existingPrescriptionId, setExistingPrescriptionId] = useState<string | null>(null)
    const [originalPrescriptionItems, setOriginalPrescriptionItems] = useState<string[]>([]) // Track original item IDs

    // SOAP form
    const [subjective, setSubjective] = useState("")
    const [objective, setObjective] = useState("")
    const [assessment, setAssessment] = useState("")
    const [plan, setPlan] = useState("")

    // Disposition (Rencana Tindakan)
    const [disposition, setDisposition] = useState<'pulang' | 'rujuk_rs' | 'konsul_internal' | ''>('')
    const [dispositionNotes, setDispositionNotes] = useState('')
    const [externalHospital, setExternalHospital] = useState('')
    const [referralPoliId, setReferralPoliId] = useState('')
    const [referralDoctorId, setReferralDoctorId] = useState('')
    const [poliList, setPoliList] = useState<any[]>([])
    const [doctorList, setDoctorList] = useState<any[]>([])
    const [filteredDoctors, setFilteredDoctors] = useState<any[]>([])
    const [existingReferral, setExistingReferral] = useState<any>(null)

    // Prescription
    const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([])
    const [catatan, setCatatan] = useState("")
    const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false)
    const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)

    // Breadcrumb items based on navigation source
    const breadcrumbItems = useMemo(() => {
        const from = router.query.from as string | undefined;
        const poliName = visit?.poli?.nama || "Poli";
        const patientName = patient?.nama || "Pasien";
        const pageTitle = existingSOAP ? "Edit Tindakan" : "Tambah Data Kunjungan";

        if (from === 'history') {
            return [
                { label: poliName, href: "/doctor" },
                { label: "Riwayat Kunjungan", href: "/doctor/patients/history" },
                { label: patientName, href: `/doctor/patients/${visitId}?from=history` },
                { label: pageTitle },
            ];
        }
        return [
            { label: poliName, href: "/doctor" },
            { label: "Dashboard Dokter", href: "/doctor" },
            { label: patientName, href: `/doctor/patients/${visitId}` },
            { label: pageTitle },
        ];
    }, [router.query.from, visit?.poli?.nama, patient?.nama, visitId, existingSOAP]);

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

    // Helper to get auth headers (for APIs that need Bearer token)
    const getAuthHeaders = () => {
        return {
            'Content-Type': 'application/json',
        }
    }

    async function fetchData() {
        setLoading(true)

        try {
            // 1. Get visit data
            const { data: visitData } = await supabase
                .from("visits")
                .select(`
          *,
          patients:patient_id (*),
          poli:poli_id (
            id,
            nama
          )
        `)
                .eq("id", visitId)
                .single()

            if (visitData) {
                setVisit(visitData)
                setPatient(visitData.patients)
                console.log("Visit data loaded:", visitData)
                console.log("Patient data:", visitData.patients)
                console.log("Patient ID:", visitData.patients?.id)
            }

            // 2. Get TTV data
            try {
                const ttvRes = await fetch(`/api/triase?visit_id=${visitId}`, {
                    credentials: 'include', // Use cookie-based auth
                })
                const ttvJson = await ttvRes.json()

                console.log("TTV API Response:", ttvJson)

                if (ttvRes.ok && ttvJson.data) {
                    setTtvData(ttvJson.data)
                    console.log("TTV Data loaded:", ttvJson.data)
                } else if (ttvRes.ok && ttvJson.data === null) {
                    console.warn("No TTV data found for this visit")
                    setTtvData(null)
                } else {
                    console.error("TTV API Error:", ttvJson)
                    toast.warning("Gagal memuat data TTV")
                }
            } catch (error) {
                console.error("Error fetching TTV:", error)
                toast.error("Terjadi kesalahan saat memuat TTV")
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

                // Load saved disposition
                if (soapData.disposition) {
                    setDisposition(soapData.disposition)
                    console.log("Loaded saved disposition:", soapData.disposition)
                }

                // Load disposition notes and referred_to
                if (soapData.disposition_notes) {
                    setDispositionNotes(soapData.disposition_notes)
                    console.log("Loaded disposition notes:", soapData.disposition_notes)
                }
                if (soapData.referred_to) {
                    setExternalHospital(soapData.referred_to)
                    console.log("Loaded referred_to:", soapData.referred_to)
                }
            }

            // 4. Get existing prescriptions if any
            let prescriptionData: any = null
            try {
                const { data, error: prescError } = await supabase
                    .from("prescriptions")
                    .select(`
                        *,
                        prescription_items (
                            id,
                            medicine_id,
                            nama_obat,
                            qty,
                            satuan,
                            instruksi
                        )
                    `)
                    .eq("visit_id", visitId)
                    .order("created_at", { ascending: false })

                console.log("Prescription query result:", { data, prescError })

                if (prescError) {
                    console.error("Error fetching prescriptions:", prescError)
                } else if (data && data.length > 0) {
                    // Use the most recent prescription (first in ordered list)
                    prescriptionData = data[0]
                    setExistingPrescriptionId(prescriptionData.id)

                    // Aggregate all prescription items from all prescriptions
                    const allItems: any[] = []
                    data.forEach((prescription: any) => {
                        if (prescription.prescription_items) {
                            allItems.push(...prescription.prescription_items)
                        }
                    })

                    if (allItems.length > 0) {
                        // Track original item IDs for delete detection
                        setOriginalPrescriptionItems(allItems.map((item: any) => item.id))

                        // Map prescription items to form state
                        const items = allItems.map((item: any) => ({
                            id: item.id, // Keep original ID for updates
                            type: 'regular' as const,
                            medicine_id: item.medicine_id || "",
                            nama_obat: item.nama_obat,
                            qty: item.qty,
                            satuan: item.satuan,
                            instruksi: item.instruksi,
                            max_stock: 0, // Will be updated when medicines are loaded
                        }))
                        setPrescriptionItems(items)
                        console.log("Loaded existing prescriptions:", items)
                    }
                } else {
                    console.log("No existing prescriptions found for this visit")
                }
            } catch (error) {
                console.error("Exception fetching prescriptions:", error)
            }

            // 5. Get medicines with stock
            const medRes = await fetch("/api/master/medicines-with-stock", {
                credentials: 'include', // Use cookie-based auth
            })
            const medJson = await medRes.json()

            console.log("Medicine API response:", medJson)

            if (medJson.data) {
                setMedicines(medJson.data)
                console.log("Loaded medicines:", medJson.data.length)

                // Update prescription items with max_stock if they exist
                if (prescriptionData && prescriptionData.prescription_items && prescriptionData.prescription_items.length > 0) {
                    setPrescriptionItems(prevItems =>
                        prevItems.map(item => {
                            if (item.medicine_id) {
                                const medicine = medJson.data.find((m: any) => m.id === item.medicine_id)
                                return {
                                    ...item,
                                    max_stock: medicine?.total_stock || 0
                                }
                            }
                            return item
                        })
                    )
                }
            } else {
                console.warn("No medicine data returned")
                toast.warning("Tidak ada data obat tersedia. Silakan hubungi admin untuk menambahkan data obat.")
            }

            // 6. Get poli list for referral
            const { data: poliData, error: poliError } = await supabase
                .from("poli")
                .select("id, nama, kode")
                .order("nama")

            if (poliData && !poliError) {
                setPoliList(poliData)
            }

            // 7. Get all doctors with their poli assignments
            const { data: doctorData, error: doctorError } = await supabase
                .from("doctors")
                .select(`
                    id,
                    users:user_id (
                        id,
                        nama
                    ),
                    doctor_poli (
                        poli_id
                    )
                `)

            if (doctorData && !doctorError) {
                setDoctorList(doctorData)
            }

            // 8. Check if this visit already has a referral
            console.log("Checking for existing referral for visit:", visitId)
            const { data: referralData, error: referralError } = await supabase
                .from("referrals")
                .select(`
                    *,
                    to_poli:to_poli_id (
                        nama
                    ),
                    to_doctor:to_doctor_id (
                        users:user_id (
                            nama
                        )
                    )
                `)
                .eq("from_visit_id", visitId)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle()

            console.log("Referral fetch result:", { referralData, referralError })

            if (referralData && !referralError) {
                setExistingReferral(referralData)
                console.log("✅ Existing referral found and set:", referralData)
            } else if (referralError) {
                console.error("❌ Error fetching referral:", referralError)
            } else {
                console.log("ℹ️ No existing referral found for this visit")
            }
        } catch (error) {
            console.error("Error fetching data:", error)
            toast.error("Gagal memuat data")
        } finally {
            setLoading(false)
        }
    }

    // Filter doctors when poli is selected for referral
    useEffect(() => {
        if (referralPoliId && doctorList.length > 0) {
            const filtered = doctorList.filter((doctor: any) =>
                doctor.doctor_poli?.some((dp: any) => dp.poli_id === referralPoliId)
            )
            setFilteredDoctors(filtered)
            // Reset doctor selection when poli changes
            setReferralDoctorId('')
        } else {
            setFilteredDoctors([])
        }
    }, [referralPoliId, doctorList])

    // ================= PRESCRIPTION MANAGEMENT =================
    const handleAddPrescriptionItem = (item: PrescriptionItem) => {
        setPrescriptionItems([...prescriptionItems, item])
    }

    const addPrescriptionItem = () => {
        setPrescriptionItems([
            ...prescriptionItems,
            {
                id: `temp-${Date.now()}`,
                type: 'regular',
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
                            type: 'regular',
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
            // For regular medicines
            if (item.type === 'regular') {
                if (!item.medicine_id) {
                    toast.error("Pilih obat untuk semua item resep")
                    return false
                }
                if (item.qty <= 0) {
                    toast.error("Jumlah obat harus lebih dari 0")
                    return false
                }
                if (item.max_stock && item.qty > item.max_stock) {
                    toast.error(
                        `Stok ${item.nama_obat} tidak mencukupi (tersedia: ${item.max_stock})`
                    )
                    return false
                }
            }
            // For compounded medicines
            else if (item.type === 'compounded') {
                if (!item.nama_obat.trim()) {
                    toast.error("Nama obat racikan harus diisi")
                    return false
                }
                if (item.qty <= 0) {
                    toast.error("Jumlah obat harus lebih dari 0")
                    return false
                }
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
                disposition: disposition || null,
                disposition_notes: dispositionNotes || null,
                referred_to: externalHospital || null,
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

            // 2. Save/Update prescription if items exist
            if (prescriptionItems.length > 0) {
                let prescriptionId = existingPrescriptionId

                // Create prescription header if not exists
                if (!prescriptionId) {
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
                    prescriptionId = prescriptionData.id
                }

                // Detect which items to delete, update, or insert
                const currentItemIds = prescriptionItems.map(item => item.id)
                const itemsToDelete = originalPrescriptionItems.filter(id => !currentItemIds.includes(id))
                const itemsToUpdate = prescriptionItems.filter(item => !item.id.startsWith('temp-'))
                const itemsToInsert = prescriptionItems.filter(item => item.id.startsWith('temp-'))

                // Delete removed items
                if (itemsToDelete.length > 0) {
                    const { error: deleteError } = await supabase
                        .from("prescription_items")
                        .delete()
                        .in("id", itemsToDelete)

                    if (deleteError) throw deleteError
                    console.log("Deleted items:", itemsToDelete)
                }

                // Update existing items
                for (const item of itemsToUpdate) {
                    const { error: updateError } = await supabase
                        .from("prescription_items")
                        .update({
                            medicine_id: item.medicine_id,
                            nama_obat: item.nama_obat,
                            qty: item.qty,
                            satuan: item.satuan,
                            instruksi: item.instruksi,
                        })
                        .eq("id", item.id)

                    if (updateError) throw updateError
                }
                console.log("Updated items:", itemsToUpdate.length)

                // Insert new items
                if (itemsToInsert.length > 0) {
                    const items = itemsToInsert.map((item) => ({
                        prescription_id: prescriptionId,
                        medicine_id: item.medicine_id,
                        nama_obat: item.nama_obat,
                        qty: item.qty,
                        satuan: item.satuan,
                        instruksi: item.instruksi,
                    }))

                    const { error: insertError } = await supabase
                        .from("prescription_items")
                        .insert(items)

                    if (insertError) throw insertError
                    console.log("Inserted items:", itemsToInsert.length)
                }

                // Create pharmacy order if not exists
                const { data: existingOrder } = await supabase
                    .from("pharmacy_orders")
                    .select("id")
                    .eq("prescription_id", prescriptionId)
                    .single()

                if (!existingOrder) {
                    await supabase.from("pharmacy_orders").insert({
                        prescription_id: prescriptionId,
                        status: "waiting",
                    })
                }
            }

            // 3. Handle Disposition (Rencana Tindakan)
            // Only process disposition if it's NEW (not already saved)
            if (disposition && !existingReferral) {
                // IMPORTANT: Check if referral already exists to prevent duplicates
                if (disposition === 'konsul_internal' || disposition === 'rujuk_rs') {
                    const { data: existingRef } = await supabase
                        .from("referrals")
                        .select("id")
                        .eq("from_visit_id", visitId)
                        .maybeSingle()

                    if (existingRef) {
                        console.log("Referral already exists, skipping disposition processing")
                        // Don't show error, just skip - this is normal for edit mode
                    } else {
                        // Process new disposition
                        await processDisposition()
                    }
                } else if (disposition === 'pulang') {
                    // Process discharge
                    await processDisposition()
                }
            } else if (existingReferral) {
                console.log("Referral already exists, skipping disposition processing on edit")
            }

            async function processDisposition() {
                // Don't update visit status here - status should only change to 'selesai'
                // when user clicks "Selesaikan Kunjungan" button on patient detail page

                // Handle Internal Consultation (Konsul ke Poli Lain)
                if (disposition === 'konsul_internal' && referralPoliId && referralDoctorId) {
                    console.log("Creating internal referral...")

                    // Get current visit data for referral
                    const { data: currentVisit } = await supabase
                        .from("visits")
                        .select("patient_id, poli_id, dokter_id, kunjungan_ke, harga")
                        .eq("id", visitId)
                        .single()

                    if (currentVisit) {
                        // Create new visit for referral
                        const { data: newVisit, error: newVisitError } = await supabase
                            .from("visits")
                            .insert({
                                patient_id: currentVisit.patient_id,
                                poli_id: referralPoliId,
                                dokter_id: referralDoctorId,
                                status: "menunggu",
                                ttv_done: true,
                                ttv_status: "selesai",
                                is_referral: true,
                                kunjungan_ke: (currentVisit.kunjungan_ke || 0) + 1,
                                harga: 0, // No additional registration fee
                            })
                            .select()
                            .single()

                        if (newVisitError) throw newVisitError

                        console.log("New referral visit created:", newVisit.id)

                        // Create referral record
                        const { error: referralError } = await supabase
                            .from("referrals")
                            .insert({
                                from_visit_id: visitId,
                                to_visit_id: newVisit.id,
                                referral_type: "internal",
                                from_poli_id: currentVisit.poli_id,
                                to_poli_id: referralPoliId,
                                from_doctor_id: currentVisit.dokter_id,
                                to_doctor_id: referralDoctorId,
                                notes: dispositionNotes,
                                status: "pending",
                            })

                        if (referralError) throw referralError

                        console.log("Referral record created")

                        // Copy TTV data from original visit to new visit
                        console.log("Attempting to copy TTV from visit:", visitId, "to new visit:", newVisit.id)

                        const { data: originalTTV, error: ttvFetchError } = await supabase
                            .from("triase")
                            .select("*")
                            .eq("visit_id", visitId)
                            .maybeSingle()

                        if (ttvFetchError) {
                            console.error("Error fetching original TTV:", ttvFetchError)
                        } else if (originalTTV) {
                            console.log("Original TTV found:", originalTTV)

                            const { error: ttvCopyError } = await supabase
                                .from("triase")
                                .insert({
                                    visit_id: newVisit.id,
                                    perawat_id: originalTTV.perawat_id,
                                    tensi: originalTTV.tensi,
                                    nadi: originalTTV.nadi,
                                    suhu: originalTTV.suhu,
                                    spo2: originalTTV.spo2,
                                    resp: originalTTV.resp,
                                    catatan: originalTTV.catatan
                                        ? `[Rujukan dari poli sebelumnya] ${originalTTV.catatan}`
                                        : "[Rujukan dari poli sebelumnya]",
                                })

                            if (ttvCopyError) {
                                console.error("Error copying TTV:", ttvCopyError)
                                toast.warning("TTV tidak dapat di-copy, tapi rujukan tetap berhasil")
                            } else {
                                console.log("✅ TTV data successfully copied to new visit")
                            }
                        } else {
                            console.warn("No TTV data found in original visit to copy")
                        }

                        toast.success("Pasien berhasil dirujuk ke poli lain. Visit baru telah dibuat.")
                    }
                }

                // Handle External Referral (Rujuk ke RS Lain)
                else if (disposition === 'rujuk_rs' && externalHospital) {
                    console.log("Creating external referral...")

                    const { data: currentVisit } = await supabase
                        .from("visits")
                        .select("poli_id, dokter_id")
                        .eq("id", visitId)
                        .single()

                    if (currentVisit) {
                        // Create referral record for external
                        const { error: referralError } = await supabase
                            .from("referrals")
                            .insert({
                                from_visit_id: visitId,
                                to_visit_id: null, // No internal visit for external referral
                                referral_type: "external",
                                from_poli_id: currentVisit.poli_id,
                                from_doctor_id: currentVisit.dokter_id,
                                external_destination: externalHospital,
                                notes: dispositionNotes,
                                status: "completed",
                            })

                        if (referralError) throw referralError

                        console.log("External referral record created")
                        toast.success(`Pasien berhasil dirujuk ke ${externalHospital}`)
                    }
                }

                // Handle Discharge (Pulang)
                else if (disposition === 'pulang') {
                    console.log("Patient discharged with notes:", dispositionNotes)
                    toast.success("Pasien dipulangkan")
                }
            }

            toast.success("Data pemeriksaan berhasil disimpan")
            router.push(`/doctor/patients/${visitId}`)
        } catch (error: any) {
            console.error("Error saving:", error)
            toast.error(error.message || "Gagal menyimpan data")
        } finally {
            setSaving(false)
        }
    }

    // ================= COMPLETE VISIT =================
    const handleCompleteVisit = async () => {
        if (!existingSOAP) {
            toast.error("Simpan SOAP terlebih dahulu sebelum menyelesaikan kunjungan")
            return
        }

        if (!disposition) {
            toast.error("Pilih disposition (Pulang/Rujuk/Konsul) terlebih dahulu")
            return
        }

        try {
            setSaving(true)

            const response = await fetch("/api/doctor/complete-visit", {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({ visit_id: visitId }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Gagal menyelesaikan kunjungan")
            }

            toast.success("Kunjungan berhasil diselesaikan")

            // Reload page to refresh visit status and show locked state
            router.reload()
        } catch (error: any) {
            console.error("Error completing visit:", error)
            toast.error(error.message || "Gagal menyelesaikan kunjungan")
        } finally {
            setSaving(false)
        }
    }

    if (!user || loading) {
        return (
            <DoctorLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-gray-500">Memuat data...</div>
                </div>
            </DoctorLayout>
        )
    }

    // Check if visit is completed (for form locking)
    const isVisitCompleted = visit?.status === 'selesai'

    return (
        <DoctorLayout>
            <div className="bg-white">
                <div className="px-12 pb-12 py-12 pr-12 pl-12 pt-16">
                    {/* Breadcrumb */}
                    <Breadcrumb items={breadcrumbItems} />

                    {/* Patient Info Card */}
                    <div className="bg-white rounded-lg border border-gray-200 pt-4 pb-5 pl-6 mb-6">
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-2xl font-bold text-gray-900">{patient?.nama}</h2>
                            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                                Aktif
                            </Badge>
                        </div>
                        <div className="">
                            <div className="text-sm font-bold text-gray-600 space-y-1">
                                <p>NRM: {patient?.nrm}</p></div>
                            <div className="text-sm font-medium text-gray-500">
                                <p>Tanggal Masuk: {visit?.created_at ? new Date(visit.created_at).toLocaleDateString("id-ID", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric"
                                }) : "-"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Form Title */}

                    <div className="space-y-6">


                        {/* TTV Section (Read-only) */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h1 className="text-2xl font-bold text-gray-900 mb-6">
                                {existingSOAP ? "Edit Tindakan" : "Tambah Tindakan"}
                            </h1>
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
                                    <div>
                                        <p className="text-sm text-gray-500">Perawat</p>
                                        <p className="font-medium">{ttvData.nurses?.users?.nama || "-"}</p>
                                    </div>
                                    <div className="col-span-2 md:col-span-3">
                                        <p className="text-sm text-gray-500">Catatan Perawat</p>
                                        <p className="font-medium">{ttvData.catatan || "-"}</p>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-gray-500">TTV belum diisi oleh perawat</p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        Cek browser console untuk debug info
                                    </p>
                                </div>
                            )}
                            {/* Divider */}
                            <div className="border-t border-gray-200 my-6"></div>

                            {/* SOAP Form */}
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
                                        disabled={isVisitCompleted}
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
                                        disabled={isVisitCompleted}
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
                                        disabled={isVisitCompleted}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="plan">P (Plan) - Rencana Tindakan</Label>

                                    {/* Show disposition info box if SOAP already saved with disposition */}
                                    {existingSOAP && disposition ? (
                                        <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                            <div className="flex items-start gap-2">
                                                <div className="flex-shrink-0 mt-0.5">
                                                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-semibold text-blue-900 mb-1">
                                                        {disposition === 'konsul_internal' && 'Pasien Sudah Dirujuk ke Poli Lain'}
                                                        {disposition === 'rujuk_rs' && 'Pasien Sudah Dirujuk ke RS Lain'}
                                                        {disposition === 'pulang' && 'Pasien Sudah Diputuskan Pulang'}
                                                    </h4>
                                                    <div className="text-sm text-blue-800 space-y-1">
                                                        {disposition === 'konsul_internal' && (
                                                            <>
                                                                {existingReferral && (
                                                                    <>
                                                                        <p><strong>Poli Tujuan:</strong> {existingReferral.to_poli?.nama || '-'}</p>
                                                                        <p><strong>Dokter Tujuan:</strong> {existingReferral.to_doctor?.users?.nama || '-'}</p>
                                                                    </>
                                                                )}
                                                                {(existingSOAP?.disposition_notes || existingReferral?.notes) && (
                                                                    <p><strong>Catatan:</strong> {existingSOAP?.disposition_notes || existingReferral?.notes}</p>
                                                                )}
                                                            </>
                                                        )}
                                                        {disposition === 'rujuk_rs' && existingSOAP?.referred_to && (
                                                            <>
                                                                <p><strong>RS Tujuan:</strong> {existingSOAP.referred_to}</p>
                                                                {existingSOAP.disposition_notes && (
                                                                    <p><strong>Alasan:</strong> {existingSOAP.disposition_notes}</p>
                                                                )}
                                                            </>
                                                        )}
                                                        {disposition === 'pulang' && existingSOAP?.disposition_notes && (
                                                            <p><strong>Catatan:</strong> {existingSOAP.disposition_notes}</p>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                        </svg>
                                                        {disposition === 'konsul_internal' ? 'Rujukan' : 'Disposition'} tidak dapat diubah setelah dibuat
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Disposition Dropdown - Only show if no existing referral */
                                        <div className="mt-3 space-y-3">
                                            <div>
                                                <Label htmlFor="disposition-select" className="text-sm">Pilih Tindakan Lanjutan</Label>
                                                <Select
                                                    value={disposition}
                                                    onValueChange={(value) => setDisposition(value as any)}
                                                    disabled={isVisitCompleted}
                                                >
                                                    <SelectTrigger className="mt-1" id="disposition-select">
                                                        <SelectValue placeholder="Pilih tindakan lanjutan..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pulang">Pulang (Discharge)</SelectItem>
                                                        <SelectItem value="rujuk_rs">Rujuk ke RS Lain</SelectItem>
                                                        <SelectItem value="konsul_internal">Konsul ke Poli/Dokter Lain</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Conditional Forms based on disposition */}
                                            {disposition === 'pulang' && (
                                                <div>
                                                    <Label htmlFor="discharge-notes" className="text-sm">Catatan Dokter</Label>
                                                    <Textarea
                                                        id="discharge-notes"
                                                        value={dispositionNotes}
                                                        onChange={(e) => setDispositionNotes(e.target.value)}
                                                        placeholder="Catatan untuk pasien..."
                                                        rows={3}
                                                        className="mt-1"
                                                    />
                                                </div>
                                            )}

                                            {disposition === 'rujuk_rs' && (
                                                <div className="space-y-3">
                                                    <div>
                                                        <Label htmlFor="hospital-name" className="text-sm">Nama Rumah Sakit Tujuan</Label>
                                                        <Input
                                                            id="hospital-name"
                                                            value={externalHospital}
                                                            onChange={(e) => setExternalHospital(e.target.value)}
                                                            placeholder="Contoh: RSUD Kota"
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="referral-reason" className="text-sm">Alasan Rujukan</Label>
                                                        <Textarea
                                                            id="referral-reason"
                                                            value={dispositionNotes}
                                                            onChange={(e) => setDispositionNotes(e.target.value)}
                                                            placeholder="Alasan rujukan ke RS lain..."
                                                            rows={3}
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {disposition === 'konsul_internal' && (
                                                <div className="space-y-3">
                                                    <div>
                                                        <Label htmlFor="referral-poli" className="text-sm">Pilih Poli Tujuan</Label>
                                                        <Select
                                                            value={referralPoliId}
                                                            onValueChange={setReferralPoliId}
                                                        >
                                                            <SelectTrigger className="mt-1">
                                                                <SelectValue placeholder="Pilih poli..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {poliList.map((poli) => (
                                                                    <SelectItem key={poli.id} value={poli.id}>
                                                                        {poli.nama}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    {referralPoliId && (
                                                        <div>
                                                            <Label htmlFor="referral-doctor" className="text-sm">Pilih Dokter Tujuan</Label>
                                                            <Select
                                                                value={referralDoctorId}
                                                                onValueChange={setReferralDoctorId}
                                                            >
                                                                <SelectTrigger className="mt-1">
                                                                    <SelectValue placeholder="Pilih dokter..." />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {filteredDoctors.length > 0 ? (
                                                                        filteredDoctors.map((doctor: any) => (
                                                                            <SelectItem key={doctor.id} value={doctor.id}>
                                                                                {doctor.users?.nama || 'Nama tidak tersedia'}
                                                                            </SelectItem>
                                                                        ))
                                                                    ) : (
                                                                        <SelectItem value="no-doctor" disabled>
                                                                            Tidak ada dokter di poli ini
                                                                        </SelectItem>
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    )}

                                                    <div>
                                                        <Label htmlFor="consultation-notes" className="text-sm">Catatan Konsultasi</Label>
                                                        <Textarea
                                                            id="consultation-notes"
                                                            value={dispositionNotes}
                                                            onChange={(e) => setDispositionNotes(e.target.value)}
                                                            placeholder="Catatan untuk dokter tujuan konsultasi..."
                                                            rows={3}
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Optional: Keep original plan textarea for additional notes */}
                                            {disposition && (
                                                <div className="mt-4 pt-4 border-t">
                                                    <Label htmlFor="plan" className="text-sm text-gray-600">Catatan Tambahan (Opsional)</Label>
                                                    <Textarea
                                                        id="plan"
                                                        value={plan}
                                                        onChange={(e) => setPlan(e.target.value)}
                                                        placeholder="Catatan tambahan rencana tindakan..."
                                                        rows={2}
                                                        className="mt-1"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Prescription Section (Optional) */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h2 className="text-xl font-semibold">Resep Obat (Opsional)</h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {prescriptionItems.length === 0
                                            ? 'Belum ada obat ditambahkan'
                                            : `${prescriptionItems.length} obat ditambahkan`}
                                    </p>
                                </div>
                                <Button
                                    onClick={() => setPrescriptionModalOpen(true)}
                                    size="sm"
                                    disabled={isVisitCompleted}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    <Pill className="w-4 h-4 mr-2" />
                                    {prescriptionItems.length === 0 ? 'Tambah Resep' : 'Edit Resep'}
                                </Button>
                            </div>

                            {/* Prescription Summary */}
                            {prescriptionItems.length > 0 ? (
                                <div className="space-y-2">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <h3 className="text-sm font-semibold text-blue-900 mb-3">Ringkasan Resep:</h3>
                                        <div className="space-y-2">
                                            {prescriptionItems.map((item, index) => (
                                                <div key={item.id} className="flex items-start gap-2 text-sm">
                                                    <span className="text-blue-600 font-medium min-w-[20px]">{index + 1}.</span>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900">{item.nama_obat}</p>
                                                        <p className="text-gray-600 text-xs mt-0.5">
                                                            {item.qty} {item.satuan} - {item.instruksi}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {catatan && (
                                            <div className="mt-3 pt-3 border-t border-blue-200">
                                                <p className="text-xs text-gray-600">
                                                    <span className="font-semibold">Catatan:</span> {catatan}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                    <Pill className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-500 text-sm">Belum ada resep obat</p>
                                    <p className="text-gray-400 text-xs mt-1">Klik tombol "Tambah Resep" untuk menambahkan</p>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => router.back()}
                                className="border-2 border-blue-600 text-blue-700 hover:bg-blue-50"
                            >
                                {visit?.status === 'selesai' ? 'Kembali' : 'Batal'}
                            </Button>
                            {visit?.status !== 'selesai' && (
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {saving ? "Menyimpan..." : "Simpan Pemeriksaan"}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Invoice Modal */}
                {visit && (
                    <InvoiceModal
                        open={invoiceModalOpen}
                        onClose={() => setInvoiceModalOpen(false)}
                        visitId={visitId as string}
                    />
                )}

                {/* Prescription Modal */}
                <PrescriptionModal
                    isOpen={prescriptionModalOpen}
                    onClose={() => setPrescriptionModalOpen(false)}
                    medicines={medicines}
                    prescriptionItems={prescriptionItems}
                    onAddItem={addPrescriptionItem}
                    onRemoveItem={removePrescriptionItem}
                    onUpdateItem={updatePrescriptionItem}
                    catatan={catatan}
                    onCatatanChange={setCatatan}
                />
            </div>
        </DoctorLayout>
    )
}
