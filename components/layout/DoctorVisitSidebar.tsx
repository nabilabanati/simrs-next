import Link from "next/link"
import { useRouter } from "next/router"
import { Home, History } from "lucide-react"

export default function DoctorVisitSidebar() {
    const router = useRouter()
    const isActive = (path: string) => router.pathname.includes(path)

    return (
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
            {/* Logo */}
            <div className="mb-8 px-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">S</span>
                    </div>
                    <span className="font-bold text-lg">SIMRS</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
                <Link
                    href="/doctor"
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive("/doctor") && !isActive("/doctor/patients")
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                >
                    <Home className="w-5 h-5" />
                    <span>Dashboard</span>
                </Link>

                <Link
                    href="/doctor/patients"
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive("/doctor/patients")
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                >
                    <History className="w-5 h-5" />
                    <span>Riwayat Kunjungan</span>
                </Link>
            </nav>

            {/* User Info at Bottom */}
            <div className="absolute bottom-4 left-4 right-4">
                <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Gustavo Xavier</p>
                            <button className="text-xs text-red-600 hover:text-red-700">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
