// lib/data/visits.ts

import { TODAY_PD_VISITS } from "@/lib/dummy/poli/penyakit-dalam/today"
import { HISTORY_PD_VISITS } from "@/lib/dummy/poli/penyakit-dalam/history"
import { DEV_ADDED_PATIENTS } from "@/lib/dummy/dev/dev-added"

import type { PatientVisit } from "@/lib/shared/types/visit"

export function getVisitsForToday(poliSlug: string): PatientVisit[] {
  const today = TODAY_PD_VISITS.filter(v => v.poli === poliSlug)
  const added = DEV_ADDED_PATIENTS.filter(v => v.poli === poliSlug)

  return [...today, ...added]
}

export function getVisitHistory(poliSlug: string): PatientVisit[] {
  return HISTORY_PD_VISITS.filter(v => v.poli === poliSlug)
}
