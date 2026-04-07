import { type NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// ── Constants ────────────────────────────────────────────────────────────────

const ACCESS_COOKIE = "modern_ca_access_token";
const REFRESH_COOKIE = "modern_ca_refresh_token";

// Routes that require an authenticated session (any role)
const AUTH_REQUIRED_PREFIXES = [
    "/student",
    "/teacher",
    "/admin",
    "/exam",
    "/payment",
];

// If authenticated and trying to enter these routes → redirect away
const GUEST_ONLY_PATHS = ["/auth/login", "/auth/signup"];

// Routes that are fully public regardless of auth state
const PUBLIC_PREFIXES = [
    "/api",
    "/_next",
    "/favicon.ico",
    "/public",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function getEncodedSecret() {
    const secret = process.env.JWT_SECRET?.trim();
    if (secret) return new TextEncoder().encode(secret);
    // In middleware (edge runtime), we allow a dev fallback so local dev still works
    if (process.env.NODE_ENV !== "production") {
        return new TextEncoder().encode("modern-ca-portal-dev-only-secret");
    }
    return null;
}

async function getVerifiedRole(request: NextRequest): Promise<string | null> {
    const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
    const secret = getEncodedSecret();

    if (!secret) return null;

    if (accessToken) {
        try {
            const { payload } = await jwtVerify(accessToken, secret);
            return (payload.role as string) ?? null;
        } catch {
            // Expired or invalid — fall through to check refresh token
        }
    }

    // If refresh token exists, the user likely still has a valid server session.
    // We can't verify DB from edge middleware, but we know they logged in previously.
    // The layout's requireSessionRole() will do the real DB check and handle expiry.
    const hasRefreshToken = Boolean(request.cookies.get(REFRESH_COOKIE)?.value);
    return hasRefreshToken ? "UNKNOWN" : null;
}

function getRoleHomePath(role: string): string {
    if (role === "TEACHER") return "/teacher/dashboard";
    if (role === "ADMIN") return "/admin/dashboard";
    return "/student/dashboard";
}

function isPublicAsset(pathname: string): boolean {
    return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function requiresAuth(pathname: string): boolean {
    return AUTH_REQUIRED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isGuestOnly(pathname: string): boolean {
    return GUEST_ONLY_PATHS.some((path) => pathname === path || pathname.startsWith(path + "/"));
}

// ── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Always pass public assets and API routes through
    if (isPublicAsset(pathname)) {
        return NextResponse.next();
    }

    const role = await getVerifiedRole(request);

    // ── Case 1: Protected route, no session → redirect to login
    if (requiresAuth(pathname) && !role) {
        const loginUrl = new URL("/auth/login", request.url);
        // Preserve the original URL so we can redirect back after login if needed
        loginUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // ── Case 2: Already logged in, hitting login/signup → redirect home
    if (isGuestOnly(pathname) && role) {
        const home = role === "UNKNOWN"
            ? "/student/dashboard" // Safe default; layout will handle wrong-role redirect
            : getRoleHomePath(role);
        return NextResponse.redirect(new URL(home, request.url));
    }

    return NextResponse.next();
}

// ── Matcher ──────────────────────────────────────────────────────────────────
// Only run middleware on routes that actually need checking.
// Excludes _next internals, static files, and API routes (handled separately).

export const config = {
    matcher: [
        /*
         * Match all paths EXCEPT:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico
         * - public folder files (png, jpg, svg, etc.)
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|otf|eot|css|js|map)$).*)",
    ],
};
