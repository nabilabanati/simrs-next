

"use client"

import { useState, useEffect } from "react"

import type { PatientVisit } from "@/lib/shared/types/visit"

// data sources
import { TODAY_PD_VISITS } from "@/lib/dummy/poli/penyakit-dalam/today"
import { HISTORY_PD_VISITS } from "@/lib/dummy/poli/penyakit-dalam/history"
import { DEV_ADDED_PATIENTS } from "@/lib/dummy/dev/dev-added"

/**
 * Helper: ambil TODAY VISITS per poli
 */
function getTodayByPoli(poliSlug: string): PatientVisit[] {
  const today = TODAY_PD_VISITS.filter(v => v.poli === poliSlug)
  const added = DEV_ADDED_PATIENTS.filter(v => v.poli === poliSlug)
  return [...today, ...added]
}

/**
 * Helper: ambil HISTORY VISITS per poli
 */
function getHistoryByPoli(poliSlug: string): PatientVisit[] {
  return HISTORY_PD_VISITS.filter(v => v.poli === poliSlug)
}

/**
 * MAIN HOOK
 * dipakai oleh halaman dashboard poli
 */
export function useVisits(poliSlug: string) {
  const [today, setToday] = useState<PatientVisit[]>([])
  const [history, setHistory] = useState<PatientVisit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate fetch / processing
    setLoading(true)

    setTimeout(() => {
      setToday(getTodayByPoli(poliSlug))
      setHistory(getHistoryByPoli(poliSlug))
      setLoading(false)
    }, 300) // biar keliatan smooth (optional)
  }, [poliSlug])

  return {
    today,
    history,
    loading,
    totalToday: today.length,
    totalWaiting: today.filter(v => v.status === "waiting").length,
    totalCompleted: today.filter(v => v.status === "completed").length,
  }
}
