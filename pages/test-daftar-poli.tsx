import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function TestDaftarPoli() {
  const [polis, setPolis] = useState<any[]>([])
  const [dokters, setDokters] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])

  const [poliId, setPoliId] = useState("")
  const [dokterId, setDokterId] = useState("")
  const [patientId, setPatientId] = useState("")

  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  // ================= LOAD POLI =================
  useEffect(() => {
    async function loadPoli() {
      const { data } = await supabase
        .from("poli")
        .select("id, nama")
        .order("nama")

      setPolis(data || [])
    }

    loadPoli()
  }, [])

  // ================= LOAD DOKTER BY POLI =================
  useEffect(() => {
    if (!poliId) {
      setDokters([])
      setDokterId("")
      return
    }

    async function loadDokter() {
      const { data } = await supabase
        .from("dokter_poli")
        .select(`
          dokter:dokter_id (
            id,
            spesialis,
            users:user_id ( nama )
          )
        `)
        .eq("poli_id", poliId)

      const formatted =
        data?.map((d: any) => ({
          id: d.dokter.id,
          nama: d.dokter.users.nama,
          spesialis: d.dokter.spesialis,
        })) || []

      setDokters(formatted)
    }

    loadDokter()
  }, [poliId])

  // ================= LOAD PASIEN (UNTUK DROPDOWN) =================
  useEffect(() => {
    async function loadPatients() {
      const { data } = await supabase
        .from("patients")
        .select("id, nrm, nama")
        .order("nama")
        .limit(300)

      setPatients(data || [])
    }

    loadPatients()
  }, [])

  // ================= SUBMIT =================
  async function handleSubmit(e: any) {
    e.preventDefault()
    setMessage("")
    setLoading(true)

    if (!poliId || !dokterId || !patientId) {
      setMessage("❌ Semua field harus diisi!")
      setLoading(false)
      return
    }

    const { error } = await supabase.from("visits").insert({
      patient_id: patientId,
      poli_id: poliId,
      dokter_id: dokterId,
      status: "menunggu",
      // ✅ no_reg auto dari trigger Supabase
    })

    if (error) {
      setMessage("❌ GAGAL: " + error.message)
      setLoading(false)
      return
    }

    setMessage("✅ BERHASIL! Pasien masuk ke visits 🎉")
    setPatientId("")
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow w-full max-w-lg"
      >
        <h1 className="text-xl font-bold mb-4">
          TEST DAFTAR PASIEN KE POLI
        </h1>

        {/* ================== POLI ================== */}
        <label className="block text-sm font-medium mb-1">Pilih Poli</label>
        <select
          className="border p-2 rounded w-full mb-4"
          value={poliId}
          onChange={(e) => setPoliId(e.target.value)}
        >
          <option value="">-- Pilih Poli --</option>
          {polis.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama}
            </option>
          ))}
        </select>

        {/* ================== DOKTER ================== */}
        <label className="block text-sm font-medium mb-1">Pilih Dokter</label>
        <select
          className="border p-2 rounded w-full mb-4"
          value={dokterId}
          onChange={(e) => setDokterId(e.target.value)}
          disabled={!poliId}
        >
          <option value="">-- Pilih Dokter --</option>
          {dokters.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nama} — {d.spesialis}
            </option>
          ))}
        </select>

        {/* ================== PASIEN (DROPDOWN ONLY) ================== */}
        <label className="block text-sm font-medium mb-1">
          Pilih Pasien (NRM - Nama)
        </label>
        <select
          className="border p-2 rounded w-full mb-4"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          disabled={!dokterId}
        >
          <option value="">-- Pilih Pasien --</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nrm} — {p.nama}
            </option>
          ))}
        </select>

        {/* ================== SUBMIT ================== */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded"
        >
          {loading ? "Menyimpan..." : "DAFTARKAN"}
        </button>

        {message && (
          <p className="mt-4 text-sm text-center">{message}</p>
        )}
      </form>
    </div>
  )
}
