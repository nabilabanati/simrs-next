import { useState, useEffect } from "react"
import { getFormattedDateTime } from "@/lib/shared/utils/date"

export function useDateTime() {
  const [dateTime, setDateTime] = useState(getFormattedDateTime())

  useEffect(() => {
    const i = setInterval(() => setDateTime(getFormattedDateTime()), 1000)
    return () => clearInterval(i)
  }, [])

  return dateTime
}
