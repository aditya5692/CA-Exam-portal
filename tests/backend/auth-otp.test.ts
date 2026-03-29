import assert from "node:assert/strict";
import test, { after, before } from "node:test";

type LoginResultData = {
    redirectTo: string;
    user: {
        role: string;
        phone: string | null;
    };
};

type LoginActionResult = {
    success: boolean;
    data?: LoginResultData;
    message?: string;
};

type MockCookieStore = {
    cookies: Map<string, string>;
};

type NextHeadersStubModule = {
    __setMockCookies: (initialValues?: Record<string, string>) => MockCookieStore;
};

type StubUser = {
    id: string;
    email: string | null;
    fullName: string | null;
    registrationNumber: string | null;
    department: string | null;
    role: string;
    storageLimit: number;
    plan: string;
    designation: string | null;
    expertise: string | null;
    examTarget: string | null;
    preferredLanguage: string | null;
    timezone: string | null;
    bio: string | null;
    phone: string | null;
    isSuperAdmin: boolean;
    passwordHash: string | null;
    isBlocked: boolean;
    blockedReason: string | null;
    loginCount: number;
    createdAt: Date;
    updatedAt: Date;
};

type StubSession = {
    id: string;
    userId: string;
    refreshToken: string;
    expiresAt: Date;
    lastActiveAt: Date;
    createdAt: Date;
};

type StubBatch = {
    id: string;
    uniqueJoinCode: string;
    name: string;
    teacherId: string;
};

type StubEnrollment = {
    id: string;
    studentId: string;
    batchId: string;
};

type PrismaStub = ReturnType<typeof createPrismaStub>;

let authActions: typeof import("../../src/actions/auth-actions");
let demoAccounts: typeof import("../../src/lib/auth/demo-accounts");
let sessionCookieSync: typeof import("../../src/lib/auth/session-cookie-sync");
let nextHeadersStub: NextHeadersStubModule;

function createPrismaStub() {
    const users = new Map<string, StubUser>();
    const sessions = new Map<string, StubSession>();
    const batches = new Map<string, StubBatch>();
    const enrollments = new Map<string, StubEnrollment>();
    let idCounter = 0;

    function createId(prefix: string) {
        idCounter += 1;
        return `${prefix}-${idCounter}`;
    }

    function cloneUser(user: StubUser) {
        return {
            ...user,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt),
        };
    }

    function matchesUserWhere(user: StubUser, where: Record<string, unknown>): boolean {
        if ("OR" in where && Array.isArray(where.OR)) {
            return where.OR.some((candidate) => matchesUserWhere(user, candidate as Record<string, unknown>));
        }

        if ("id" in where && where.id !== user.id) {
            return false;
        }

        if ("registrationNumber" in where && where.registrationNumber !== user.registrationNumber) {
            return false;
        }

        if ("phone" in where && where.phone !== user.phone) {
            return false;
        }

        if ("email" in where && where.email !== user.email) {
            return false;
        }

        return true;
    }

    return {
        user: {
            async upsert({
                where,
                update,
                create,
            }: {
                where: { registrationNumber: string };
                update: Record<string, unknown>;
                create: Record<string, unknown>;
            }) {
                const existing = Array.from(users.values()).find((user) => user.registrationNumber === where.registrationNumber);

                if (existing) {
                    const updatedUser: StubUser = {
                        ...existing,
                        ...update,
                        email: (update.email as string | null | undefined) ?? existing.email,
                        fullName: (update.fullName as string | null | undefined) ?? existing.fullName,
                        registrationNumber: (update.registrationNumber as string | null | undefined) ?? existing.registrationNumber,
                        department: (update.department as string | null | undefined) ?? existing.department,
                        role: (update.role as string | undefined) ?? existing.role,
                        storageLimit: (update.storageLimit as number | undefined) ?? existing.storageLimit,
                        plan: (update.plan as string | undefined) ?? existing.plan,
                        designation: (update.designation as string | null | undefined) ?? existing.designation,
                        expertise: (update.expertise as string | null | undefined) ?? existing.expertise,
                        examTarget: (update.examTarget as string | null | undefined) ?? existing.examTarget,
                        preferredLanguage: (update.preferredLanguage as string | null | undefined) ?? existing.preferredLanguage,
                        timezone: (update.timezone as string | null | undefined) ?? existing.timezone,
                        bio: (update.bio as string | null | undefined) ?? existing.bio,
                        phone: (update.phone as string | null | undefined) ?? existing.phone,
                        isSuperAdmin: (update.isSuperAdmin as boolean | undefined) ?? existing.isSuperAdmin,
                        passwordHash: (update.passwordHash as string | null | undefined) ?? existing.passwordHash,
                        updatedAt: new Date(),
                    };
                    users.set(updatedUser.id, updatedUser);
                    return cloneUser(updatedUser);
                }

                const createdUser: StubUser = {
                    id: createId("user"),
                    email: (create.email as string | null | undefined) ?? null,
                    fullName: (create.fullName as string | null | undefined) ?? null,
                    registrationNumber: (create.registrationNumber as string | null | undefined) ?? null,
                    department: (create.department as string | null | undefined) ?? null,
                    role: (create.role as string | undefined) ?? "STUDENT",
                    storageLimit: (create.storageLimit as number | undefined) ?? 0,
                    plan: (create.plan as string | undefined) ?? "FREE",
                    designation: (create.designation as string | null | undefined) ?? null,
                    expertise: (create.expertise as string | null | undefined) ?? null,
                    examTarget: (create.examTarget as string | null | undefined) ?? null,
                    preferredLanguage: (create.preferredLanguage as string | null | undefined) ?? null,
                    timezone: (create.timezone as string | null | undefined) ?? null,
                    bio: (create.bio as string | null | undefined) ?? null,
                    phone: (create.phone as string | null | undefined) ?? null,
                    isSuperAdmin: Boolean(create.isSuperAdmin),
                    passwordHash: (create.passwordHash as string | null | undefined) ?? null,
                    isBlocked: false,
                    blockedReason: null,
                    loginCount: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                users.set(createdUser.id, createdUser);
                return cloneUser(createdUser);
            },
            async findUnique({ where }: { where: Record<string, unknown> }) {
                const user = Array.from(users.values()).find((candidate) => matchesUserWhere(candidate, where));
                return user ? cloneUser(user) : null;
            },
            async findFirst({ where }: { where: Record<string, unknown> }) {
                const user = Array.from(users.values()).find((candidate) => matchesUserWhere(candidate, where));
                return user ? cloneUser(user) : null;
            },
            async update({ where, data }: { where: { id: string }; data: Record<string, unknown> }) {
                const user = users.get(where.id);
                if (!user) {
                    throw new Error(`User ${where.id} not found`);
                }

                const loginCountDelta =
                    typeof data.loginCount === "object" &&
                    data.loginCount !== null &&
                    "increment" in data.loginCount
                        ? Number((data.loginCount as { increment: number }).increment)
                        : 0;

                const updatedUser: StubUser = {
                    ...user,
                    ...data,
                    phone: (data.phone as string | null | undefined) ?? user.phone,
                    loginCount: user.loginCount + loginCountDelta,
                    updatedAt: new Date(),
                };
                users.set(updatedUser.id, updatedUser);
                return cloneUser(updatedUser);
            },
        },
        session: {
            async create({ data }: { data: { userId: string; refreshToken: string; expiresAt: Date } }) {
                const session: StubSession = {
                    id: createId("session"),
                    userId: data.userId,
                    refreshToken: data.refreshToken,
                    expiresAt: new Date(data.expiresAt),
                    lastActiveAt: new Date(),
                    createdAt: new Date(),
                };
                sessions.set(session.id, session);
                return { ...session };
            },
            async deleteMany({ where }: { where: Record<string, unknown> }) {
                let deletedCount = 0;
                for (const [sessionId, session] of sessions.entries()) {
                    const matchesRefreshToken =
                        "refreshToken" in where ? where.refreshToken === session.refreshToken : false;
                    const matchesUserId = "userId" in where ? where.userId === session.userId : false;

                    if (matchesRefreshToken || matchesUserId) {
                        sessions.delete(sessionId);
                        deletedCount += 1;
                    }
                }

                return { count: deletedCount };
            },
        },
        batch: {
            async upsert({
                where,
                update,
                create,
            }: {
                where: { uniqueJoinCode: string };
                update: Partial<StubBatch>;
                create: Partial<StubBatch>;
            }) {
                const existing = Array.from(batches.values()).find((batch) => batch.uniqueJoinCode === where.uniqueJoinCode);
                if (existing) {
                    const updatedBatch: StubBatch = {
                        ...existing,
                        ...update,
                        name: update.name ?? existing.name,
                        teacherId: update.teacherId ?? existing.teacherId,
                    };
                    batches.set(updatedBatch.id, updatedBatch);
                    return { ...updatedBatch };
                }

                const createdBatch: StubBatch = {
                    id: createId("batch"),
                    uniqueJoinCode: create.uniqueJoinCode ?? where.uniqueJoinCode,
                    name: create.name ?? "Batch",
                    teacherId: create.teacherId ?? "",
                };
                batches.set(createdBatch.id, createdBatch);
                return { ...createdBatch };
            },
        },
        enrollment: {
            async upsert({
                where,
                create,
            }: {
                where: { studentId_batchId: { studentId: string; batchId: string } };
                update: Record<string, unknown>;
                create: { studentId: string; batchId: string };
            }) {
                const key = `${where.studentId_batchId.studentId}:${where.studentId_batchId.batchId}`;
                const existing = enrollments.get(key);
                if (existing) {
                    return { ...existing };
                }

                const enrollment: StubEnrollment = {
                    id: createId("enrollment"),
                    studentId: create.studentId,
                    batchId: create.batchId,
                };
                enrollments.set(key, enrollment);
                return { ...enrollment };
            },
        },
        async $disconnect() {
            return undefined;
        },
    };
}

before(async () => {
    Object.assign(process.env, {
        NODE_ENV: "development",
        JWT_SECRET: "backend-auth-otp-test-secret",
    });

    const globalStore = globalThis as typeof globalThis & {
        modernCaPortalPrismaV2?: unknown;
    };
    globalStore.modernCaPortalPrismaV2 = createPrismaStub() as unknown;

    nextHeadersStub = (await import("../support/next-headers-stub.cjs")).default as NextHeadersStubModule;
    authActions = await import("../../src/actions/auth-actions");
    demoAccounts = await import("../../src/lib/auth/demo-accounts");
    sessionCookieSync = await import("../../src/lib/auth/session-cookie-sync");

    await demoAccounts.ensureDemoAccounts();
});

after(async () => {
    const globalStore = globalThis as typeof globalThis & {
        modernCaPortalPrismaV2?: unknown;
    };
    const prismaStub = globalStore.modernCaPortalPrismaV2 as PrismaStub | undefined;
    await prismaStub?.$disconnect();
    delete globalStore.modernCaPortalPrismaV2;
});

function assertLoginSuccess(result: LoginActionResult, redirectTo: string, role: string, phone: string) {
    assert.equal(result.success, true);
    assert.equal(result.data?.redirectTo, redirectTo);
    assert.equal(result.data?.user.role, role);
    assert.equal(result.data?.user.phone, phone);
}

function assertSessionCookiesWritten(cookieStore: MockCookieStore) {
    assert.ok(cookieStore.cookies.get(sessionCookieSync.ACCESS_COOKIE_NAME));
    assert.ok(cookieStore.cookies.get(sessionCookieSync.REFRESH_COOKIE_NAME));
}

test("verifyOtpAndLogin signs in the demo teacher with 7065751756 / 0424", async () => {
    const cookieStore = nextHeadersStub.__setMockCookies();

    const result = await authActions.verifyOtpAndLogin("7065751756", "0424", "TEACHER") as LoginActionResult;

    assertLoginSuccess(result, "/teacher/dashboard", "TEACHER", "917065751756");
    assertSessionCookiesWritten(cookieStore);
});

test("verifyOtpAndLogin signs in the demo student with 9000010001 / 0424", async () => {
    const cookieStore = nextHeadersStub.__setMockCookies();

    const result = await authActions.verifyOtpAndLogin("9000010001", "0424", "STUDENT") as LoginActionResult;

    assertLoginSuccess(result, "/student/dashboard", "STUDENT", "919000010001");
    assertSessionCookiesWritten(cookieStore);
});

test("verifyWidgetOtpAndLogin signs in the demo teacher with a mock widget token", async () => {
    const cookieStore = nextHeadersStub.__setMockCookies();

    const result = await authActions.verifyWidgetOtpAndLogin("mock-verified-token", "TEACHER") as LoginActionResult;

    assertLoginSuccess(result, "/teacher/dashboard", "TEACHER", "917065751756");
    assertSessionCookiesWritten(cookieStore);
});

test("verifyWidgetOtpAndLogin signs in the demo student with a mock widget token", async () => {
    const cookieStore = nextHeadersStub.__setMockCookies();

    const result = await authActions.verifyWidgetOtpAndLogin("mock-verified-token:919000010001", "STUDENT") as LoginActionResult;

    assertLoginSuccess(result, "/student/dashboard", "STUDENT", "919000010001");
    assertSessionCookiesWritten(cookieStore);
});
