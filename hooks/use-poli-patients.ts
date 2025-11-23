"use client"

import { useState, useEffect } from "react"

import type { PatientData } from "@/lib/shared/types/patient"
import { MASTER_PATIENTS } from "@/lib/dummy/master/patients"

/**
 * Hook untuk mengambil data pasien master.
 * Bisa dipakai di modul poli, farmasi, loket, dll.
 */
export function usePoliPatients() {
  const [patients, setPatients] = useState<PatientData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)

    // simulasi fetch backend
    setTimeout(() => {
      setPatients(MASTER_PATIENTS)
      setLoading(false)
    }, 300)
  }, [])

  return {
    patients,
    loading,
    total: patients.length,
  }
}
