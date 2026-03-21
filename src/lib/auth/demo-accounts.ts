import "server-only";

import prisma from "@/lib/prisma/client";
import type { User } from "@prisma/client";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";

export type AppRole = "ADMIN" | "TEACHER" | "STUDENT";

type DemoAccountKey = "admin" | "teacher1" | "teacher2" | "student1" | "student2";

type DemoAccountSeed = {
    key: DemoAccountKey;
    fullName: string;
    email: string;
    registrationNumber: string;
    department: string;
    role: AppRole;
    plan: string;
    storageLimit: number;
    designation?: string;
    expertise?: string;
    examTarget?: string;
    preferredLanguage?: string;
    timezone?: string;
    bio?: string;
    phone?: string;
};

export const DEMO_LOGIN_PASSWORD = "demo123";

export const DEMO_ACCOUNTS: DemoAccountSeed[] = [
    {
        key: "admin",
        fullName: "Portal Admin",
        email: "admin@demo.local",
        registrationNumber: "ADMIN001",
        department: "Administration",
        role: "ADMIN",
        plan: "ENTERPRISE",
        storageLimit: 2147483647,
        designation: "Platform Administrator",
        expertise: "Operations, Support",
        preferredLanguage: "English",
        timezone: "Asia/Kolkata",
        bio: "Maintains the CA portal demo environment.",
        phone: "+91 90000 00001",
    },
    {
        key: "teacher1",
        fullName: "Nikhil Jain",
        email: "teacher1@demo.local",
        registrationNumber: "TCHR001",
        department: "Taxation",
        role: "TEACHER",
        plan: "PRO",
        storageLimit: 1073741824,
        designation: "Lead Instructor",
        expertise: "Direct Tax, GST",
        preferredLanguage: "English",
        timezone: "Asia/Kolkata",
        bio: "Handles taxation-focused CA batches and updates.",
        phone: "+91 90000 00011",
    },
    {
        key: "teacher2",
        fullName: "Rhea Mehta",
        email: "teacher2@demo.local",
        registrationNumber: "TCHR002",
        department: "Audit",
        role: "TEACHER",
        plan: "PRO",
        storageLimit: 1073741824,
        designation: "Senior Faculty",
        expertise: "Audit, Assurance",
        preferredLanguage: "English",
        timezone: "Asia/Kolkata",
        bio: "Runs audit-oriented batches and material distribution.",
        phone: "+91 90000 00012",
    },
    {
        key: "student1",
        fullName: "Aditya Sharma",
        email: "student1@demo.local",
        registrationNumber: "STUD001",
        department: "CA Intermediate",
        role: "STUDENT",
        plan: "ELITE",
        storageLimit: 52428800,
        examTarget: "November 2026",
        preferredLanguage: "English",
        timezone: "Asia/Kolkata",
        bio: "Preparing for direct tax and accounting papers.",
        phone: "+91 90000 10001",
    },
    {
        key: "student2",
        fullName: "Sneha Verma",
        email: "student2@demo.local",
        registrationNumber: "STUD002",
        department: "CA Intermediate",
        role: "STUDENT",
        plan: "PRO",
        storageLimit: 52428800,
        examTarget: "May 2027",
        preferredLanguage: "English",
        timezone: "Asia/Kolkata",
        bio: "Focused on audit, law, and revision workflows.",
        phone: "+91 90000 10002",
    },
];

const DEFAULT_REGISTRATION_BY_ROLE: Record<AppRole, string> = {
    ADMIN: "ADMIN001",
    TEACHER: "TCHR001",
    STUDENT: "STUD001",
};

function getStableSalt(seed: string) {
    return createHash("sha256").update(`modern-ca-portal-demo:${seed}`).digest("hex").slice(0, 32);
}

export function createPasswordHash(password: string, seed: string) {
    const salt = getStableSalt(seed);
    const derived = scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string | null | undefined) {
    if (!storedHash) return false;

    const [salt, digest] = storedHash.split(":");
    if (!salt || !digest) return false;

    const candidate = scryptSync(password, salt, 64);
    const expected = Buffer.from(digest, "hex");

    if (candidate.length !== expected.length) return false;
    return timingSafeEqual(candidate, expected);
}

async function upsertDemoUser(seed: DemoAccountSeed) {
  return prisma.user.upsert({
    where: { registrationNumber: seed.registrationNumber },
    update: {
      fullName: seed.fullName,
      email: seed.email,
      registrationNumber: seed.registrationNumber,
      department: seed.department,
      role: seed.role,
      plan: seed.plan,
      storageLimit: seed.storageLimit,
      designation: seed.designation ?? null,
      expertise: seed.expertise ?? null,
      examTarget: seed.examTarget ?? null,
      preferredLanguage: seed.preferredLanguage ?? null,
      timezone: seed.timezone ?? null,
      bio: seed.bio ?? null,
      phone: seed.phone ?? null,
      passwordHash: createPasswordHash(DEMO_LOGIN_PASSWORD, seed.registrationNumber),
    },
    create: {
            fullName: seed.fullName,
            email: seed.email,
            registrationNumber: seed.registrationNumber,
            department: seed.department,
            role: seed.role,
            plan: seed.plan,
            storageLimit: seed.storageLimit,
            designation: seed.designation ?? null,
            expertise: seed.expertise ?? null,
            examTarget: seed.examTarget ?? null,
            preferredLanguage: seed.preferredLanguage ?? null,
            timezone: seed.timezone ?? null,
            bio: seed.bio ?? null,
            phone: seed.phone ?? null,
            passwordHash: createPasswordHash(DEMO_LOGIN_PASSWORD, seed.registrationNumber),
        },
    });
}

async function ensureDemoTeachingData(users: Record<DemoAccountKey, User>) {
    const taxationBatch = await prisma.batch.upsert({
        where: { uniqueJoinCode: "TAXNOV26" },
        update: {
            name: "November 2026 Taxation Batch",
            teacherId: users.teacher1.id,
        },
        create: {
            name: "November 2026 Taxation Batch",
            uniqueJoinCode: "TAXNOV26",
            teacherId: users.teacher1.id,
        },
    });

    const auditBatch = await prisma.batch.upsert({
        where: { uniqueJoinCode: "AUDMAY27" },
        update: {
            name: "May 2027 Audit Batch",
            teacherId: users.teacher2.id,
        },
        create: {
            name: "May 2027 Audit Batch",
            uniqueJoinCode: "AUDMAY27",
            teacherId: users.teacher2.id,
        },
    });

  await prisma.enrollment.upsert({
    where: {
      studentId_batchId: {
        studentId: users.student1.id,
        batchId: taxationBatch.id,
      },
    },
    update: {},
    create: {
      studentId: users.student1.id,
      batchId: taxationBatch.id,
    },
  });

  await prisma.enrollment.upsert({
    where: {
      studentId_batchId: {
        studentId: users.student2.id,
        batchId: auditBatch.id,
      },
    },
    update: {},
    create: {
      studentId: users.student2.id,
      batchId: auditBatch.id,
    },
  });
}

export async function ensureDemoAccounts() {
    const users = {} as Record<DemoAccountKey, User>;

    for (const account of DEMO_ACCOUNTS) {
        users[account.key] = await upsertDemoUser(account);
    }

    await ensureDemoTeachingData(users);
    return users;
}

export async function getDefaultDemoUser(role: AppRole) {
    await ensureDemoAccounts();

    return prisma.user.findUnique({
        where: { registrationNumber: DEFAULT_REGISTRATION_BY_ROLE[role] },
    });
}

export function generateTemporaryPassword() {
    return randomBytes(6).toString("base64url");
}
