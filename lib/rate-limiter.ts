/**
 * Rate Limiter for Login Attempts
 * 
 * Prevents brute force attacks by limiting login attempts:
 * - Max 5 attempts per IP + Username combination
 * - 5 minute lockout after exceeding limit
 * - Automatic cleanup of old entries
 */

interface RateLimitAttempt {
    count: number;
    firstAttempt: number;
    lockedUntil: number | null;
}

class RateLimiter {
    private attempts = new Map<string, RateLimitAttempt>();
    private readonly maxAttempts = 5;
    private readonly windowMs = 5 * 60 * 1000; // 5 minutes
    private readonly lockDurationMs = 5 * 60 * 1000; // 5 minutes

    /**
     * Check if request is allowed
     */
    check(ip: string, username: string): {
        allowed: boolean;
        remainingAttempts?: number;
        remainingTime?: number;
        message?: string;
    } {
        const key = this.getKey(ip, username);
        const attempt = this.attempts.get(key);

        // No previous attempts - allow
        if (!attempt) {
            return {
                allowed: true,
                remainingAttempts: this.maxAttempts
            };
        }

        // Check if currently locked
        if (attempt.lockedUntil && Date.now() < attempt.lockedUntil) {
            const remainingMs = attempt.lockedUntil - Date.now();
            let remainingMinutes = Math.floor(remainingMs / 60000);
            let remainingSeconds = Math.ceil((remainingMs % 60000) / 1000);

            // Handle edge case: 60 seconds should be 1 minute 0 seconds
            if (remainingSeconds === 60) {
                remainingMinutes += 1;
                remainingSeconds = 0;
            }

            return {
                allowed: false,
                remainingTime: remainingMinutes,
                message: remainingSeconds > 0
                    ? `Terlalu banyak percobaan login gagal. Silakan coba lagi dalam ${remainingMinutes} menit ${remainingSeconds} detik.`
                    : `Terlalu banyak percobaan login gagal. Silakan coba lagi dalam ${remainingMinutes} menit.`
            };
        }

        // Reset if window expired
        if (Date.now() - attempt.firstAttempt > this.windowMs) {
            this.attempts.delete(key);
            return {
                allowed: true,
                remainingAttempts: this.maxAttempts
            };
        }

        // Check if at or exceeded max attempts
        // Block ALL attempts (even with correct password) if limit reached
        if (attempt.count >= this.maxAttempts) {
            // Lock the account
            attempt.lockedUntil = Date.now() + this.lockDurationMs;
            this.attempts.set(key, attempt);

            return {
                allowed: false,
                remainingTime: Math.ceil(this.lockDurationMs / 60000),
                message: `Terlalu banyak percobaan login gagal. Silakan coba lagi dalam 5 menit.`
            };
        }

        // Still have attempts remaining
        const remaining = this.maxAttempts - attempt.count;

        // If this is the last attempt, warn user
        if (remaining === 1) {
            return {
                allowed: true,
                remainingAttempts: remaining,
                message: `Ini adalah percobaan terakhir Anda. Setelah ini akun akan diblokir selama 5 menit.`
            };
        }

        return {
            allowed: true,
            remainingAttempts: remaining
        };
    }

    /**
     * Record a failed login attempt
     */
    recordFailure(ip: string, username: string): void {
        const key = this.getKey(ip, username);
        const attempt = this.attempts.get(key);

        if (!attempt) {
            // First failed attempt
            this.attempts.set(key, {
                count: 1,
                firstAttempt: Date.now(),
                lockedUntil: null,
            });
        } else {
            // Increment count
            attempt.count++;
            this.attempts.set(key, attempt);
        }

        // Log for monitoring
        console.log(`🚫 Failed login attempt ${attempt?.count || 1}/${this.maxAttempts} for ${username} from ${ip}`);
    }

    /**
     * Reset attempts (on successful login)
     */
    reset(ip: string, username: string): void {
        const key = this.getKey(ip, username);
        this.attempts.delete(key);
        console.log(`✅ Rate limit reset for ${username} from ${ip}`);
    }

    /**
     * Get current attempt info (for debugging)
     */
    getAttemptInfo(ip: string, username: string): RateLimitAttempt | null {
        const key = this.getKey(ip, username);
        return this.attempts.get(key) || null;
    }

    /**
     * Generate unique key for IP + Username combination
     */
    private getKey(ip: string, username: string): string {
        return `${ip}:${username.toLowerCase()}`;
    }

    /**
     * Cleanup old entries (run periodically)
     */
    cleanup(): void {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, attempt] of this.attempts.entries()) {
            // Remove if window expired and not locked
            if (now - attempt.firstAttempt > this.windowMs && !attempt.lockedUntil) {
                this.attempts.delete(key);
                cleaned++;
            }
            // Remove if lock expired
            else if (attempt.lockedUntil && now > attempt.lockedUntil) {
                this.attempts.delete(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            console.log(`🧹 Cleaned up ${cleaned} expired rate limit entries`);
        }
    }

    /**
     * Get statistics (for monitoring)
     */
    getStats(): {
        totalEntries: number;
        lockedAccounts: number;
        activeAttempts: number;
    } {
        const now = Date.now();
        let locked = 0;
        let active = 0;

        for (const attempt of this.attempts.values()) {
            if (attempt.lockedUntil && now < attempt.lockedUntil) {
                locked++;
            } else if (attempt.count > 0) {
                active++;
            }
        }

        return {
            totalEntries: this.attempts.size,
            lockedAccounts: locked,
            activeAttempts: active,
        };
    }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Cleanup every 10 minutes
setInterval(() => {
    rateLimiter.cleanup();
}, 10 * 60 * 1000);

// Export for testing
export { RateLimiter };
