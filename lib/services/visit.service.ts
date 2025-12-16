import { supabase } from "@/lib/supabase"

/**
 * Get today's visits by poli ID
 * @param poliId - ID of the poli
 * @returns Object with data and error
 */
export async function getTodayVisitsByPoli(poliId: string) {
  try {
    // Get today's date range (start and end of day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStart = today.toISOString()
    
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)
    const todayEndStr = todayEnd.toISOString()

    // Query visits for today by poli
    const { data, error } = await supabase
      .from("visits")
      .select(`
        id,
        no_reg,
        status,
        created_at,
        patients (
          id,
          nrm,
          nama,
          jk
        )
      `)
      .eq("poli_id", poliId)
      .gte("created_at", todayStart)
      .lte("created_at", todayEndStr)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching visits:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (err) {
    console.error("Unexpected error in getTodayVisitsByPoli:", err)
    return { 
      data: null, 
      error: err instanceof Error ? err : new Error("Unknown error") 
    }
  }
}

/**
 * Get all visits by poli ID (not limited to today)
 * @param poliId - ID of the poli
 * @returns Object with data and error
 */
export async function getVisitsByPoli(poliId: string) {
  try {
    const { data, error } = await supabase
      .from("visits")
      .select(`
        id,
        no_reg,
        status,
        created_at,
        patients (
          id,
          nrm,
          nama,
          jk
        )
      `)
      .eq("poli_id", poliId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching visits:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (err) {
    console.error("Unexpected error in getVisitsByPoli:", err)
    return { 
      data: null, 
      error: err instanceof Error ? err : new Error("Unknown error") 
    }
  }
}
