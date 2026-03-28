export function getAuthCookieDomain() {
    const domain = process.env.AUTH_COOKIE_DOMAIN?.trim();
    return domain ? domain : undefined;
}

export function buildAuthCookieOptions({
    secure,
    maxAge,
    httpOnly = true,
}: {
    secure: boolean;
    maxAge: number;
    httpOnly?: boolean;
}) {
    const domain = getAuthCookieDomain();

    return {
        httpOnly,
        sameSite: "lax" as const,
        secure,
        path: "/",
        maxAge,
        ...(domain ? { domain } : {}),
    };
}
