import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Lock, User, Eye, EyeOff } from "lucide-react";

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
    // Check if already logged in (user data exists)
    // Token is in HttpOnly cookie, so we don't check localStorage for it
    const user = localStorage.getItem("user");

    if (user) {
      const userData = JSON.parse(user);
      redirectByRole(userData.role, userData.id);
    }
  }, [router]);

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
          // No assignment - show error
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

        console.log("✅ Login successful, session expires at:", json.data.sessionExpiresAt);

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md px-4">
        <Card className="shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Lock className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">SIMRS Login</CardTitle>
            <CardDescription>
              Sistem Informasi Manajemen Rumah Sakit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Masukkan username"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className="pl-10"
                    required
                    disabled={loading}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="pl-10 pr-10"
                    required
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>

            {/* Test Credentials */}
            <div className="mt-6 pt-6 border-t">
              <p className="text-xs text-center text-gray-500 mb-2">
                Test Credentials:
              </p>
              <div className="bg-gray-50 p-3 rounded text-xs space-y-1">
                <p>
                  <span className="font-semibold">Super Admin:</span>{" "}
                  <code className="bg-white px-1 py-0.5 rounded">superadmin</code> /{" "}
                  <code className="bg-white px-1 py-0.5 rounded">passsuperadmin</code>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          © 2025 SIMRS. All rights reserved.
        </p>
      </div>
    </div>
  );
}
