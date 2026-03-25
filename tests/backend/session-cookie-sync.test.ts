import assert from "node:assert/strict";
import test from "node:test";

import {
    ACCESS_COOKIE_MAX_AGE_SECONDS,
    ACCESS_COOKIE_NAME,
    buildSessionPayload,
    REFRESH_COOKIE_NAME,
    syncSessionCookiePayload,
} from "../../src/lib/auth/session-cookie-sync";

function createCookieStore(values: Record<string, string> = {}) {
    const cookies = new Map(Object.entries(values));
    const setCalls: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];

    return {
        store: {
            get(name: string) {
                const value = cookies.get(name);
                return value ? { value } : undefined;
            },
            set(name: string, value: string, options: Record<string, unknown>) {
                cookies.set(name, value);
                setCalls.push({ name, value, options });
            },
        },
        setCalls,
        cookies,
    };
}

test("buildSessionPayload preserves updated profile identity fields", () => {
    const payload = buildSessionPayload({
        id: "student-1",
        role: "STUDENT",
        fullName: "Updated Student",
        registrationNumber: "CRO-001",
        plan: "PRO",
        isSuperAdmin: false,
    });

    assert.deepEqual(payload, {
        userId: "student-1",
        role: "STUDENT",
        fullName: "Updated Student",
        registrationNumber: "CRO-001",
        plan: "PRO",
        isSuperAdmin: false,
    });
});

test("syncSessionCookiePayload skips writes when no auth cookies exist", async () => {
    const cookieStore = createCookieStore();
    let signerCalled = false;

    const synced = await syncSessionCookiePayload(
        cookieStore.store,
        {
            id: "student-1",
            role: "STUDENT",
            fullName: "Updated Student",
            registrationNumber: "CRO-001",
            plan: "PRO",
            isSuperAdmin: false,
        },
        async () => {
            signerCalled = true;
            return "signed-token";
        },
        false,
    );

    assert.equal(synced, false);
    assert.equal(signerCalled, false);
    assert.equal(cookieStore.setCalls.length, 0);
});

test("syncSessionCookiePayload rewrites the access cookie when a session exists", async () => {
    const cookieStore = createCookieStore({ [REFRESH_COOKIE_NAME]: "refresh-token" });
    let signedPayload: Awaited<ReturnType<typeof buildSessionPayload>> | null = null;

    const synced = await syncSessionCookiePayload(
        cookieStore.store,
        {
            id: "student-1",
            role: "STUDENT",
            fullName: "Renamed Student",
            registrationNumber: "CRO-009",
            plan: "FREE",
            isSuperAdmin: false,
        },
        async (payload) => {
            signedPayload = payload;
            return "signed-token";
        },
        true,
    );

    assert.equal(synced, true);
    assert.deepEqual(signedPayload, {
        userId: "student-1",
        role: "STUDENT",
        fullName: "Renamed Student",
        registrationNumber: "CRO-009",
        plan: "FREE",
        isSuperAdmin: false,
    });
    assert.deepEqual(cookieStore.setCalls, [
        {
            name: ACCESS_COOKIE_NAME,
            value: "signed-token",
            options: {
                httpOnly: true,
                sameSite: "lax",
                secure: true,
                path: "/",
                maxAge: ACCESS_COOKIE_MAX_AGE_SECONDS,
            },
        },
    ]);
});
