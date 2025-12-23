import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { createClient } from "@supabase/supabase-js";

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "dev-secret"
);

// Supabase client for middleware (edge runtime compatible)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
    auth: { persistSession: false },
});

// Define route permissions
const ROUTE_PERMISSIONS: Record<string, string[]> = {
    "/admin": ["superadmin"],
    "/doctor": ["dokter"],
    "/dokter": ["dokter"],
    "/nurse": ["nurse"],
    "/counter/loket-1": ["loket", "admin_loket"],
    "/counter/loket-2": ["loket", "admin_loket"],
    "/counter/loket-3": ["loket", "admin_loket"],
    "/counter/loket-4": ["loket", "admin_loket"],
    "/counter/loket-5": ["loket", "admin_loket"],
    "/counter/patients": ["loket", "admin_loket"],
    "/counter": ["admin_loket"], // Dashboard admin - hanya admin_loket
    "/pharmacy": ["farmasi"],
    "/cashier": ["kasir"],
};

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/register"];

// Public API routes that don't require authentication
const PUBLIC_API_ROUTES = ["/api/auth/login", "/api/auth/logout"];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    console.log(`🔒 [Middleware] Checking: ${pathname}`);

    // Allow exact match for homepage
    if (pathname === "/") {
        console.log(`✅ [Middleware] Homepage - public route`);
        return NextResponse.next();
    }

    // Allow public routes
    if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
        console.log(`✅ [Middleware] Public route: ${pathname}`);
        return NextResponse.next();
    }

    // Allow specific public API routes
    if (PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route))) {
        console.log(`✅ [Middleware] Public API route: ${pathname}`);
        return NextResponse.next();
    }

    // All other API routes require authentication (will be checked below)
    // Don't skip API routes - they need token validation too!

    // Get token from cookie or Authorization header
    const tokenFromCookie = request.cookies.get("token")?.value;
    const authHeader = request.headers.get("authorization");
    const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    const token = tokenFromCookie || tokenFromHeader;

    // No token found - redirect to login
    if (!token) {
        console.log(`❌ [Middleware] No token, redirecting to login from: ${pathname}`);
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }

    try {
        // Verify JWT token using jose
        const { payload } = await jwtVerify(token, JWT_SECRET);

        const decoded = payload as {
            id: string;
            role: string;
            username: string;
            nama: string;
            sessionId?: string;
        };

        console.log("🔍 [Middleware] Token decoded:", {
            username: decoded.username,
            hasSessionId: !!decoded.sessionId,
            sessionId: decoded.sessionId
        });

        // === SESSION VALIDATION ===
        // If token has sessionId, validate it's still active
        if (decoded.sessionId) {
            console.log("🔍 [Middleware] Checking session:", decoded.sessionId);

            const { data: session, error: sessionError } = await supabase
                .from('sessions')
                .select('is_active, expires_at')
                .eq('id', decoded.sessionId)
                .single();

            console.log("🔍 [Middleware] Session check result:", {
                found: !!session,
                isActive: session?.is_active,
                error: sessionError?.message
            });

            // Session not found, inactive, or expired
            if (sessionError || !session || !session.is_active) {
                console.log("❌ [Middleware] Session invalidated, redirecting to login");
                const loginUrl = new URL("/login", request.url);
                loginUrl.searchParams.set("redirect", pathname);
                loginUrl.searchParams.set("reason", "session_invalidated");
                return NextResponse.redirect(loginUrl);
            }

            // Check if session expired
            const expiresAt = new Date(session.expires_at);
            if (expiresAt < new Date()) {
                console.log("❌ [Middleware] Session expired, redirecting to login");
                const loginUrl = new URL("/login", request.url);
                loginUrl.searchParams.set("redirect", pathname);
                loginUrl.searchParams.set("reason", "session_expired");
                return NextResponse.redirect(loginUrl);
            }

            console.log("✅ [Middleware] Session valid, allowing access");
        } else {
            console.log("⚠️ [Middleware] No sessionId in token (old token or backward compatibility)");
        }

        // Check route permissions
        for (const [route, allowedRoles] of Object.entries(ROUTE_PERMISSIONS)) {
            if (pathname.startsWith(route)) {
                if (!allowedRoles.includes(decoded.role)) {
                    // User doesn't have permission for this route
                    return NextResponse.redirect(new URL("/unauthorized", request.url));
                }

                // === LOKET ASSIGNMENT CHECK ===
                // If user has role 'loket' and trying to access specific loket page, check assignment
                if (decoded.role === 'loket' && pathname.match(/\/counter\/loket-(\d+)/)) {
                    const loketMatch = pathname.match(/\/counter\/loket-(\d+)/);
                    const requestedLoketId = loketMatch ? parseInt(loketMatch[1]) : null;

                    if (requestedLoketId) {
                        console.log(`🔍 [Middleware] Checking loket assignment for user ${decoded.username} to loket ${requestedLoketId}`);

                        // Check if user is assigned to this loket
                        const { data: assignments, error: assignmentError } = await supabase
                            .from('user_loket_assignment')
                            .select('loket_id')
                            .eq('user_id', decoded.id);

                        if (assignmentError) {
                            console.error('❌ [Middleware] Error checking loket assignment:', assignmentError);
                            return NextResponse.redirect(new URL("/unauthorized", request.url));
                        }

                        const assignedLokets = assignments?.map(a => a.loket_id) || [];
                        console.log(`📋 [Middleware] User assigned to lokets:`, assignedLokets);

                        if (assignedLokets.length === 0) {
                            console.log('❌ [Middleware] User has no loket assignments');
                            return NextResponse.redirect(new URL("/unauthorized", request.url));
                        }

                        if (!assignedLokets.includes(requestedLoketId)) {
                            console.log(`❌ [Middleware] User not assigned to loket ${requestedLoketId}`);
                            return NextResponse.redirect(new URL("/unauthorized", request.url));
                        }

                        console.log(`✅ [Middleware] User has access to loket ${requestedLoketId}`);
                    }
                }
                // admin_loket can access all lokets without assignment check

                // User has permission, allow access
                return NextResponse.next();
            }
        }

        // If no specific route matched, allow access (for other routes)
        return NextResponse.next();
    } catch (error) {
        // Invalid or expired token - redirect to login
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }
}

// Specify which routes this middleware should run on
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         * 
         * EXPLICITLY INCLUDE:
         * - /counter/* (all counter routes)
         * - /admin/* (all admin routes)
         * - /doctor/* (all doctor routes)
         * - /nurse/* (all nurse routes)
         * - /pharmacy/* (all pharmacy routes)
         * - /cashier/* (all cashier routes)
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
