import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Lock, User, Eye, EyeOff, Activity } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Wait for router to be ready to avoid infinite loops
    if (!router.isReady) return;

    // Check if already logged in (user data exists)
    // Token is in HttpOnly cookie, so we don't check localStorage for it
    const user = localStorage.getItem("user");

    if (user) {
      const userData = JSON.parse(user);
      redirectByRole(userData.role, userData.id);
      return;
    }

    // Check for session expiration or error messages from URL
    const { reason } = router.query;
    if (reason) {
      const messages: Record<string, string> = {
        session_expired: "Sesi Anda telah berakhir. Silakan login kembali.",
        session_invalidated: "Anda telah login dari perangkat lain. Silakan login kembali.",
        unauthorized: "Sesi Anda tidak valid. Silakan login kembali.",
        invalid_response: "Terjadi kesalahan. Silakan login kembali.",
      };

      const message = messages[reason as string];
      if (message) {
        setError(message);
      }
    }
  }, [router.isReady, router.query]);

  const redirectByRole = async (role: string, userId?: string) => {
    // For role 'loket', check their assignment and redirect to first assigned loket
    if (role === "loket" && userId) {
      try {
        const { supabase } = await import('@/lib/supabase');
        const { data: assignments } = await supabase
          .from('user_loket_assignment')
          .select('loket_id')
          .eq('user_id', userId)
          .order('loket_id', { ascending: true });

        if (assignments && assignments.length > 0) {
          // Redirect to first assigned loket
          router.push(`/counter/loket-${assignments[0].loket_id}`);
          return;
        } else {
          setError("Anda belum di-assign ke loket manapun. Hubungi admin.");
          return;
        }
      } catch (error) {
        console.error("Error checking loket assignment:", error);
      }
    }

    const redirectMap: Record<string, string> = {
      superadmin: "/admin",
      dokter: "/doctor",
      nurse: "/nurse",
      admin_loket: "/counter",
      farmasi: "/pharmacy",
      kasir: "/cashier",
    };

    const redirectPath = redirectMap[role] || "/";
    router.push(redirectPath);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "include", // Important: include cookies
      });

      const json = await res.json();

      if (res.ok && json.data) {
        // Token is now in HttpOnly cookie, no need to store in localStorage
        // Only store user info (non-sensitive data)
        localStorage.setItem("user", JSON.stringify(json.data.user));

        console.log("Login successful, session expires at:", json.data.sessionExpiresAt);

        // Redirect based on role
        await redirectByRole(json.data.user.role, json.data.user.id);
      } else {
        setError(json.error || "Login failed. Please try again.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Hospital Photo Background */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/photos/rsud.webp)' }}
        />

        {/* Blue Overlay */}
        <div className="absolute inset-0 bg-blue-900/50" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8">
            {/* Logos */}
            <div className="flex items-center justify-center gap-8 mb-8">
              <img
                src="/photos/cv.png"
                alt="Logo CV"
                className="h-25 object-contain"
              />
              {/* <img
                src="/photos/drs.png"
                alt="Logo Tegal"
                className="h-30 object-contain"
              /> */}
              <img
                src="/photos/tegal.svg"
                alt="Logo Tegal"
                className="h-25 object-contain"
              />
            </div>

            <h1 className="text-2xl font-semibold mb-2 text-center">
              SISTEM INFORMASI MANAJEMEN RUMAH SAKIT
            </h1>
            <p className="text-blue-100 text-xl leading-relaxed text-center">
              PROTOTIPE CV DIGITALOGI
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Selamat Datang!</h2>
            <p className="text-gray-600">Masuk untuk mengakses SIMRS</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Masukkan username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="h-11"
                required
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="h-11 pr-10"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-gray-500 mt-8">
            © 2025 Digitalogi. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
