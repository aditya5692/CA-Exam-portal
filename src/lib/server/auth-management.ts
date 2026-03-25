import "server-only";

import {
    createPasswordHash,
    ensureDemoAccounts,
    verifyPassword,
    generateTemporaryPassword,
    type AppRole,
} from "@/lib/auth/demo-accounts";
import prisma from "@/lib/prisma/client";
import type { User } from "@prisma/client";
import { isUniqueConstraintError } from "./action-utils";

export type AuthLoginInput = {
    identifier: string;
    password: string;
    role?: AppRole;
};

export type AuthLoginRecord = {
    user: User;
    redirectTo: string;
};

export type AuthRegistrationInput = {
    fullName: string;
    email?: string | null;
    phone?: string | null;
    registrationNumber: string;
    department?: string | null;
    role: string;
    password?: string | null;
};

const APP_ROLES = new Set<AppRole>(["ADMIN", "TEACHER", "STUDENT"]);

export function getRoleRedirectPath(role: AppRole) {
    if (role === "ADMIN") return "/admin/dashboard";
    if (role === "TEACHER") return "/teacher/dashboard";
    return "/student/dashboard";
}

export async function authenticateUserRecord(input: AuthLoginInput): Promise<AuthLoginRecord> {
    const identifier = input.identifier.trim();
    const password = input.password.trim();
    const role = input.role;

    if (!identifier || !password) {
        throw new Error("Registration number or email and password are required.");
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
        throw new Error("No user found for those credentials.");
    }

    if (user.isBlocked) {
        throw new Error(user.blockedReason?.trim() || "This account has been blocked by an administrator.");
    }

    if (role && user.role !== role) {
        throw new Error(`This account is not registered as a ${role.toLowerCase()}.`);
    }

    if (!verifyPassword(password, user.passwordHash)) {
        throw new Error("Incorrect password.");
    }

    return {
        user,
        redirectTo: getRoleRedirectPath(user.role as AppRole),
    };
}

export async function registerUserRecord(
    input: AuthRegistrationInput,
): Promise<AuthLoginRecord> {
    const normalizedRole = input.role?.trim().toUpperCase() as AppRole | undefined;
    if (
        !input.fullName?.trim() ||
        !input.registrationNumber?.trim() ||
        !input.password?.trim() ||
        !normalizedRole
    ) {
        throw new Error("Missing required registration details.");
    }

    if (!APP_ROLES.has(normalizedRole)) {
        throw new Error("Invalid role selected.");
    }

    const normalizedRegistrationNumber = input.registrationNumber.trim().toUpperCase();
    const normalizedEmail = input.email?.trim().toLowerCase() || null;
    const normalizedPhone = input.phone?.trim() || null;
    const trimmedFullName = input.fullName.trim();
    const trimmedDepartment = input.department?.trim() || null;
    const trimmedPassword = input.password?.trim() || generateTemporaryPassword();

    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { registrationNumber: normalizedRegistrationNumber },
                ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
                ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
            ],
        },
        select: {
            email: true,
            registrationNumber: true,
            phone: true,
        },
    });

    if (existingUser?.registrationNumber === normalizedRegistrationNumber) {
        throw new Error("An account with that registration number already exists.");
    }

    if (normalizedEmail && existingUser?.email === normalizedEmail) {
        throw new Error("An account with that email already exists.");
    }

    if (normalizedPhone && existingUser?.phone === normalizedPhone) {
        throw new Error("An account with that phone number already exists.");
    }

    try {
        const user = await prisma.user.create({
            data: {
                fullName: trimmedFullName,
                email: normalizedEmail,
                phone: normalizedPhone,
                registrationNumber: normalizedRegistrationNumber,
                department: trimmedDepartment,
                role: normalizedRole,
                passwordHash: createPasswordHash(trimmedPassword, normalizedRegistrationNumber),
            },
        });

        return {
            user,
            redirectTo: getRoleRedirectPath(normalizedRole),
        };
    } catch (error) {
        if (isUniqueConstraintError(error, ["registrationNumber"])) {
            throw new Error("An account with that registration number already exists.");
        }

        if (isUniqueConstraintError(error, ["email"])) {
            throw new Error("An account with that email already exists.");
        }

        throw error;
    }
}
