import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "dev-secret"
);

// Define route permissions
const ROUTE_PERMISSIONS: Record<string, string[]> = {
    "/admin": ["superadmin"],
    "/doctor": ["dokter"],
    "/dokter": ["dokter"],
    "/nurse": ["nurse"],
    "/loket-pendaftaran": ["loket"],
    "/loket-antrian": ["loket"],
    "/pharmacy": ["farmasi"],
    "/cashier": ["kasir"],
};

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/register", "/", "/api/auth/login", "/api/auth/logout"];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public routes
    if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // Allow API routes (they have their own auth)
    if (pathname.startsWith("/api/")) {
        return NextResponse.next();
    }

    // Get token from cookie or Authorization header
    const tokenFromCookie = request.cookies.get("token")?.value;
    const authHeader = request.headers.get("authorization");
    const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    const token = tokenFromCookie || tokenFromHeader;

    // No token found - redirect to login
    if (!token) {
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
        };

        // Check route permissions
        for (const [route, allowedRoles] of Object.entries(ROUTE_PERMISSIONS)) {
            if (pathname.startsWith(route)) {
                if (!allowedRoles.includes(decoded.role)) {
                    // User doesn't have permission for this route
                    return NextResponse.redirect(new URL("/unauthorized", request.url));
                }
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
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
