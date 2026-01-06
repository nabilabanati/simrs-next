import { useRouter } from "next/router"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"

interface DoctorNavbarProps {
    userName?: string
}

export default function DoctorNavbar({ userName }: DoctorNavbarProps) {
    const router = useRouter()

    const handleLogout = async () => {
        try {
            // Call logout API
            await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include"
            })

            // Clear localStorage
            localStorage.removeItem("user")
            localStorage.removeItem("token")

            // Redirect to login
            router.push("/login")
        } catch (error) {
            console.error("Logout error:", error)
            // Force logout even if API fails
            localStorage.removeItem("user")
            localStorage.removeItem("token")
            router.push("/login")
        }
    }

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo/Title */}
                    <div className="flex items-center">
                        <h1 className="text-xl font-bold text-blue-600">Sistem Informasi Manajemen Rumah Sakit </h1>
                        <span className="ml-3 text-gray-400">|</span>
                        <span className="ml-3 text-gray-700">Portal Dokter</span>
                    </div>

                    {/* User Info & Logout */}
                    <div className="flex items-center gap-4">
                        {userName && (
                            <div className="flex items-center gap-2 text-gray-700">
                                <User className="w-4 h-4" />
                                <span className="text-sm font-medium">{userName}</span>
                            </div>
                        )}

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLogout}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </div>
        </nav>
    )
}
