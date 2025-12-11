import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function TestForm() {
  const [nama, setNama] = useState("")
  const [tgl, setTgl] = useState("")
  const [jk, setJk] = useState("")
  const [alamat, setAlamat] = useState("")
  const [message, setMessage] = useState("")

  async function handleSubmit(e: any) {
    e.preventDefault()
    setMessage("")

    // ⬇️ TIDAK PERLU NRM, karena Supabase sudah auto-generate
    const { data, error } = await supabase
      .from("patients")
      .insert({
        nama: nama,
        tanggal_lahir: tgl,
        jenis_kelamin: jk,
        alamat: alamat
      })

    if (error) {
      console.error(error)
      setMessage("❌ Error: " + error.message)
      return
    }

    setMessage("✅ Data berhasil masuk! Cek NRM nya di Supabase (otomatis).")

    // Reset form
    setNama("")
    setTgl("")
    setJk("")
    setAlamat("")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow w-full max-w-sm"
      >
        <h1 className="text-xl font-bold mb-4">Test Insert Pasien (Auto NRM)</h1>

        <label className="block mb-2 text-sm">Nama Pasien</label>
        <input
          className="border p-2 rounded w-full mb-3"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          required
        />

        <label className="block mb-2 text-sm">Tanggal Lahir</label>
        <input
          type="date"
          className="border p-2 rounded w-full mb-3"
          value={tgl}
          onChange={(e) => setTgl(e.target.value)}
        />

        <label className="block mb-2 text-sm">Jenis Kelamin</label>
        <select
          className="border p-2 rounded w-full mb-3"
          value={jk}
          onChange={(e) => setJk(e.target.value)}
        >
          <option value="">Pilih</option>
          <option value="L">Laki-laki</option>
          <option value="P">Perempuan</option>
        </select>

        <label className="block mb-2 text-sm">Alamat</label>
        <input
          className="border p-2 rounded w-full mb-3"
          value={alamat}
          onChange={(e) => setAlamat(e.target.value)}
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded"
        >
          Simpan
        </button>

        {message && (
          <p className="mt-4 text-sm">{message}</p>
        )}
      </form>
    </div>
  )
}
