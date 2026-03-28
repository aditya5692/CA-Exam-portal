function expireCookie(name: string, domain?: string) {
    const domainPart = domain ? `; domain=${domain}` : "";
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domainPart}`;
}

export function clearClientSessionState() {
    if (typeof window === "undefined") {
        return;
    }

    try {
        window.localStorage.clear();
    } catch {}

    try {
        window.sessionStorage.clear();
    } catch {}

    const cookieNames = document.cookie
        .split(";")
        .map((cookie) => cookie.trim().split("=")[0]?.trim())
        .filter(Boolean) as string[];

    const hostname = window.location.hostname;
    const hostnameParts = hostname.split(".").filter(Boolean);
    const cookieDomains = new Set<string | undefined>([undefined, hostname]);

    if (hostnameParts.length >= 2) {
        cookieDomains.add(`.${hostnameParts.slice(-2).join(".")}`);
    }

    for (const name of cookieNames) {
        for (const domain of cookieDomains) {
            expireCookie(name, domain);
        }
    }
}
