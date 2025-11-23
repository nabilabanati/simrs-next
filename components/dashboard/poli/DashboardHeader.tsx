"use client"

interface DashboardHeaderProps {
  doctorName?: string
  greeting?: string
  dateString: string
  timeString: string
}

export default function DashboardHeader({
  doctorName = "Dokter",
  greeting = "Selamat Datang!",
  dateString,
  timeString,
}: DashboardHeaderProps) {
  return (
    <div className="mb-6 flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Dokter</h1>
        <h2 className="text-2xl font-bold text-blue-600 mt-1">
          {greeting}, {doctorName}!
        </h2>
      </div>

      <div className="text-right">
        <div className="text-lg font-semibold text-gray-800">{dateString}</div>
        <div className="text-sm text-gray-600">{timeString}</div>
      </div>
    </div>
  )
}
