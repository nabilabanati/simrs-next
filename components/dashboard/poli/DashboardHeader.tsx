import { useState, useEffect } from "react"
import { getFormattedDateTime } from "@/lib/shared/utils"

interface DashboardHeaderProps {
  doctorName?: string
  greeting?: string
}

export default function DashboardHeader({
  doctorName = "Dokter",
  greeting = "Selamat Datang",
}: DashboardHeaderProps) {
  
  const [dateTime, setDateTime] = useState(() => getFormattedDateTime())

  useEffect(() => {
    const interval = setInterval(() => {
      setDateTime(getFormattedDateTime())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="mb-6 flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Dashboard Dokter
        </h1>
        <h2 className="text-2xl font-bold text-blue-600 mt-1">
          {greeting}, {doctorName}!
        </h2>
      </div>

      <div className="text-right">
        <div className="text-lg font-semibold text-gray-800">
          {dateTime.dateString}
        </div>
        <div className="text-sm text-gray-600">
          {dateTime.timeString}
        </div>
      </div>
    </div>
  )
}
