// pages/dev/add-patients.tsx

"use client";

import { useState } from "react";
import { DEV_ADDED_PATIENTS } from "@/lib/dummy/dev/dev-added";
import { PatientData } from "@/lib/shared/types/patient";
import { POLI_LIST } from "@/lib/poli/dummy/poli-list";

export default function AddPatientDev() {
  const [form, setForm] = useState({
    nama: "",
    nrm: "",
    jenisKelamin: "L" as "L" | "P",
    poliSlug: "",
  });

  function handleAdd() {
  DEV_ADDED_PATIENTS.push({
    idPasien: "DEV-" + Date.now(),
    nama: form.nama,
    nrm: form.nrm,
    jenisKelamin: form.jenisKelamin,

    poli: form.poliSlug,
    noAntrian: "DEV-" + Math.floor(Math.random() * 1000),
    noRegistrasi: form.poliSlug.toUpperCase().slice(0,2) + "-" + Date.now(),
    tanggalKunjungan: new Date().toISOString(),

    status: "waiting",
  });

  alert("Pasien DEV berhasil ditambahkan!");
}

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Add Patient (DEV MODE)</h1>

      <input
        className="border p-2 mb-2 w-full"
        placeholder="Nama pasien"
        onChange={(e) => setForm({ ...form, nama: e.target.value })}
      />

      <input
        className="border p-2 mb-2 w-full"
        placeholder="NRM"
        onChange={(e) => setForm({ ...form, nrm: e.target.value })}
      />

      <select
        className="border p-2 mb-2 w-full"
        onChange={(e) => setForm({ ...form, jenisKelamin: e.target.value as "L" | "P" })}
      >
        <option value="L">Laki-laki</option>
        <option value="P">Perempuan</option>
      </select>

      <select
        className="border p-2 mb-2 w-full"
        onChange={(e) => setForm({ ...form, poliSlug: e.target.value })}
      >
        <option value="">-- Pilih Poli --</option>
        {POLI_LIST.map((p) => (
          <option key={p.slug} value={p.slug}>{p.name}</option>
        ))}
      </select>

      <button
        onClick={handleAdd}
        className="bg-blue-600 text-white py-2 px-4 rounded"
      >
        Tambah Pasien DEV
      </button>
    </div>
  );
}
