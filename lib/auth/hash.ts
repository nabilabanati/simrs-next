// PROTOTYPE ONLY - Plain text password storage (NOT SECURE)
// DO NOT USE IN PRODUCTION

export async function hashPassword(password: string) {
  // Return password as-is (no hashing for prototype)
  return password;
}

export async function verifyPassword(password: string, stored: string) {
  // Simple string comparison
  return password === stored;
}
