
export async function login(username: string, password: string) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || "Login failed");
  }

  return res.json(); // { token, user }
}

// Logout → POST /api/auth/logout (optional)
export async function logout() {
  const res = await fetch("/api/auth/logout", {
    method: "POST",
  });

  return res.ok;
}

// Refresh token (optional)
export async function refreshToken() {
  const res = await fetch("/api/auth/refresh");
  if (!res.ok) return null;
  return res.json();
}
