import { Calendar, Clock, CheckCircle } from 'lucide-react';

interface SummaryCardsProps {
  total: number;
  waiting: number;
  completed: number;
  loading?: boolean;
}

export default function SummaryCards({ total, waiting, completed }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Pasien Hari Ini */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 p-4 rounded-lg">
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-1">Total Pasien Hari Ini</p>
            <p className="text-3xl font-bold text-gray-900">{total}</p>
          </div>
        </div>
      </div>

      {/* Menunggu Penanganan */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 p-4 rounded-lg">
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-1">Menunggu Penanganan</p>
            <p className="text-3xl font-bold text-gray-900">{waiting}</p>
          </div>
        </div>
      </div>

      {/* Sudah Ditangani */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 p-4 rounded-lg">
            <CheckCircle className="w-8 h-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-1">Sudah Ditangani</p>
            <p className="text-3xl font-bold text-gray-900">{completed}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
