import { useState } from "react"
import { useRouter } from "next/router"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const router = useRouter()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .eq("password", password)
      .single()

    if (error || !data) {
      setError("Username atau password salah")
      setLoading(false)
      return
    }

    // ✅ SIMPAN USER KE LOCALSTORAGE (FORMAT BENAR!)
    localStorage.setItem("user", JSON.stringify({
      id: data.id,
      username: data.username,
      nama: data.nama,
      role: data.role
    }))

    // ✅ REDIRECT SESUAI ROLE
    if (data.role === "dokter") router.push("/dokter")
    else if (data.role === "perawat") router.push("/perawat")
    else if (data.role === "admin") router.push("/admin")
    else router.push("/")

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded shadow w-full max-w-sm"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Login SIMRS</h1>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-100 p-2 rounded">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block mb-1 text-sm font-medium">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Masuk..." : "Login"}
        </button>
      </form>
    </div>
  )
}
