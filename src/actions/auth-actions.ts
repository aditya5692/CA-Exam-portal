"use server";

import prisma from "@/lib/prisma/client";
import { clearAuthSession, setAuthSession } from "@/lib/auth/session";
import {
    createPasswordHash,
    DEMO_ACCOUNTS,
    DEMO_LOGIN_PASSWORD,
    ensureDemoAccounts,
    type AppRole,
    verifyPassword,
} from "@/lib/auth/demo-accounts";

type LoginInput = {
    identifier: string;
    password: string;
    role?: AppRole;
};

function getRedirectPath(role: AppRole) {
    if (role === "ADMIN") return "/admin/dashboard";
    if (role === "TEACHER") return "/teacher/dashboard";
    return "/student/dashboard";
}

export async function login(input: LoginInput) {
    const identifier = input.identifier.trim();
    const password = input.password;
    const role = input.role;

    if (!identifier || !password) {
        return { success: false, message: "Registration number or email and password are required." };
    }

    await ensureDemoAccounts();

    const normalizedRegistrationNumber = identifier.toUpperCase();
    const normalizedEmail = identifier.toLowerCase();

    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { registrationNumber: normalizedRegistrationNumber },
                { email: normalizedEmail },
            ],
        },
    });

    if (!user) {
        return { success: false, message: "No user found for those credentials." };
    }

    if (role && user.role !== role) {
        return { success: false, message: `This account is not registered as a ${role.toLowerCase()}.` };
    }

    if (!verifyPassword(password, user.passwordHash)) {
        return { success: false, message: "Incorrect password." };
    }

    await setAuthSession(user);

    return {
        success: true,
        message: "Logged in successfully.",
        redirectTo: getRedirectPath(user.role as AppRole),
        user: {
            fullName: user.fullName,
            role: user.role,
            registrationNumber: user.registrationNumber,
        },
    };
}

export async function register(formData: Record<string, string>) {
    const { fullName, email, registrationNumber, department, role, password } = formData as Record<string, string>;

    try {
        const normalizedRole = role?.toUpperCase() as AppRole | undefined;
        if (!fullName?.trim() || !registrationNumber?.trim() || !password?.trim() || !normalizedRole) {
            return { success: false, message: "Missing required registration details." };
        }

        const normalizedRegistrationNumber = registrationNumber.trim().toUpperCase();
        const normalizedEmail = email?.trim().toLowerCase() || null;

        const user = await prisma.user.create({
            data: {
                fullName: fullName.trim(),
                email: normalizedEmail,
                registrationNumber: normalizedRegistrationNumber,
                department: department?.trim() || null,
                role: normalizedRole,
                passwordHash: createPasswordHash(password.trim(), normalizedRegistrationNumber),
            },
        });

        await setAuthSession(user);
        return {
            success: true,
            message: "Account created successfully",
            redirectTo: getRedirectPath(normalizedRole),
        };
    } catch (error: unknown) {
        return { success: false, message: error instanceof Error ? error.message : "Failed to create account" };
    }
}

export async function logout() {
    await clearAuthSession();
    return { success: true };
}

export async function getDemoLogins() {
    await ensureDemoAccounts();

    return {
        success: true,
        password: DEMO_LOGIN_PASSWORD,
        users: DEMO_ACCOUNTS.map((account) => ({
            label: account.key,
            role: account.role,
            fullName: account.fullName,
            registrationNumber: account.registrationNumber,
            email: account.email,
        })),
    };
}
