import { jwtVerify, SignJWT } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "modern-ca-portal-fallback-secret-123456";
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

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
        .setExpirationTime("15m") // Short-lived access token
        .sign(encodedSecret);
}

export async function verifyAccessToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, encodedSecret);
        return payload;
    } catch {
        return null;
    }
}
