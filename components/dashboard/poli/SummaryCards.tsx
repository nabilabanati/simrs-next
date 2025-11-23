interface SummaryCardsProps {
  total: number;
  waiting: number;
  completed: number;
  loading?: boolean;
}

export default function SummaryCards({ total, waiting, completed }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 border rounded-lg">
        <p className="text-sm text-gray-600">Total Pasien Hari Ini</p>
        <p className="text-3xl font-bold">{total}</p>
      </div>

      <div className="bg-white p-6 border rounded-lg">
        <p className="text-sm text-gray-600">Menunggu Penanganan</p>
        <p className="text-3xl font-bold">{waiting}</p>
      </div>

      <div className="bg-white p-6 border rounded-lg">
        <p className="text-sm text-gray-600">Sudah Ditangani</p>
        <p className="text-3xl font-bold">{completed}</p>
      </div>
    </div>
  )
}
