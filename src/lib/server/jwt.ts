import { jwtVerify, SignJWT } from "jose";

function getEncodedSecret() {
    const configuredSecret = process.env.JWT_SECRET?.trim();
    if (configuredSecret) {
        return new TextEncoder().encode(configuredSecret);
    }

    if (process.env.NODE_ENV === "production") {
        throw new Error("JWT_SECRET is not set.");
    }

    return new TextEncoder().encode("modern-ca-portal-dev-only-secret");
}

export type JWTPayload = {
    userId: string;
    role: string;
    fullName: string | null;
    email?: string;
    [key: string]: unknown;
};

export async function signAccessToken(payload: JWTPayload) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("15m")
        .sign(getEncodedSecret());
}

export async function verifyAccessToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, getEncodedSecret());
        return payload;
    } catch {
        return null;
    }
}
