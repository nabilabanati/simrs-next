/**
 * Rate Limiter for Login Attempts - IP-Only Version
 * 
 * Prevents brute force attacks with IP-based rate limiting:
 * - Max 5 attempts per IP (all usernames combined)
 * - 5 minute lockout after exceeding limit
 * - Automatic cleanup of old entries
 */

interface RateLimitAttempt {
    count: number;
    firstAttempt: number;
    lockedUntil: number | null;
}

class RateLimiter {
    private ipAttempts = new Map<string, RateLimitAttempt>();

    private readonly maxAttempts = 10;           // Per IP (all usernames)
    private readonly windowMs = 5 * 60 * 1000;  // 5 minutes
    private readonly lockDurationMs = 5 * 60 * 1000; // 5 minutes

    /**
     * Check if request is allowed (IP-based only)
     */
    check(ip: string, username: string): {
        allowed: boolean;
        remainingAttempts?: number;
        remainingTime?: number;
        message?: string;
    } {
        const ipAttempt = this.ipAttempts.get(ip);

        // No previous attempts - allow
        if (!ipAttempt) {
            return {
                allowed: true,
                remainingAttempts: this.maxAttempts
            };
        }

        // Check if IP is locked
        if (ipAttempt.lockedUntil && Date.now() < ipAttempt.lockedUntil) {
            const remainingMs = ipAttempt.lockedUntil - Date.now();
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
        if (Date.now() - ipAttempt.firstAttempt > this.windowMs) {
            this.ipAttempts.delete(ip);
            return {
                allowed: true,
                remainingAttempts: this.maxAttempts
            };
        }

        // Check if exceeded IP limit
        if (ipAttempt.count >= this.maxAttempts) {
            // Lock the IP
            ipAttempt.lockedUntil = Date.now() + this.lockDurationMs;
            this.ipAttempts.set(ip, ipAttempt);

            return {
                allowed: false,
                remainingTime: Math.ceil(this.lockDurationMs / 60000),
                message: `Terlalu banyak percobaan login gagal. Silakan coba lagi dalam 5 menit.`
            };
        }

        // Still have attempts remaining
        const remaining = this.maxAttempts - ipAttempt.count;

        return {
            allowed: true,
            remainingAttempts: remaining
        };
    }

    /**
     * Record a failed login attempt (IP-based)
     */
    recordFailure(ip: string, username: string): void {
        const ipAttempt = this.ipAttempts.get(ip);

        if (!ipAttempt) {
            this.ipAttempts.set(ip, {
                count: 1,
                firstAttempt: Date.now(),
                lockedUntil: null,
            });
        } else {
            ipAttempt.count++;
            this.ipAttempts.set(ip, ipAttempt);
        }

        // Log for monitoring
        const currentCount = this.ipAttempts.get(ip)?.count || 1;
        console.log(`🚫 Failed login attempt ${currentCount}/${this.maxAttempts} for ${username} from ${ip}`);
    }

    /**
     * Reset attempts (on successful login)
     */
    reset(ip: string, username: string): void {
        this.ipAttempts.delete(ip);
        console.log(`✅ Rate limit reset for ${username} from ${ip}`);
    }

    /**
     * Get current attempt info (for debugging)
     */
    getAttemptInfo(ip: string, username: string): RateLimitAttempt | null {
        return this.ipAttempts.get(ip) || null;
    }

    /**
     * Cleanup old entries (run periodically)
     */
    cleanup(): void {
        const now = Date.now();
        let cleaned = 0;

        for (const [ip, attempt] of this.ipAttempts.entries()) {
            // Remove if window expired and not locked
            if (now - attempt.firstAttempt > this.windowMs && !attempt.lockedUntil) {
                this.ipAttempts.delete(ip);
                cleaned++;
            }
            // Remove if lock expired
            else if (attempt.lockedUntil && now > attempt.lockedUntil) {
                this.ipAttempts.delete(ip);
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
        lockedIPs: number;
        activeAttempts: number;
    } {
        const now = Date.now();
        let locked = 0;
        let active = 0;

        for (const attempt of this.ipAttempts.values()) {
            if (attempt.lockedUntil && now < attempt.lockedUntil) {
                locked++;
            } else if (attempt.count > 0) {
                active++;
            }
        }

        return {
            totalEntries: this.ipAttempts.size,
            lockedIPs: locked,
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
