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
import { getActionErrorMessage, isUniqueConstraintError } from "@/lib/server/action-utils";
import { ActionResponse } from "@/types/shared";

type LoginInput = {
    identifier: string;
    password: string;
    role?: AppRole;
};

type LoginResult = {
    redirectTo: string;
    user: {
        fullName: string | null;
        role: string;
        registrationNumber: string | null;
    };
};

const APP_ROLES = new Set<AppRole>(["ADMIN", "TEACHER", "STUDENT"]);

function getRedirectPath(role: AppRole) {
    if (role === "ADMIN") return "/admin/dashboard";
    if (role === "TEACHER") return "/teacher/dashboard";
    return "/student/dashboard";
}

/**
 * Authenticates a user and establishes a session.
 */
export async function login(input: LoginInput): Promise<ActionResponse<LoginResult>> {
    try {
        const identifier = input.identifier.trim();
        const password = input.password.trim();
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

        if (user.isBlocked) {
            return {
                success: false,
                message: user.blockedReason?.trim() || "This account has been blocked by an administrator.",
            };
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
            data: {
                redirectTo: getRedirectPath(user.role as AppRole),
                user: {
                    fullName: user.fullName,
                    role: user.role,
                    registrationNumber: user.registrationNumber,
                },
            }
        };
    } catch (error) {
        console.error("Login failed:", error);
        return { success: false, message: getActionErrorMessage(error, "Failed to log in.") };
    }
}

/**
 * Registers a new user and automatically logs them in.
 */
export async function register(formData: Record<string, string>): Promise<ActionResponse<{ redirectTo: string }>> {
    const { fullName, email, registrationNumber, department, role, password } = formData;

    try {
        const normalizedRole = role?.trim().toUpperCase() as AppRole | undefined;
        if (!fullName?.trim() || !registrationNumber?.trim() || !password?.trim() || !normalizedRole) {
            return { success: false, message: "Missing required registration details." };
        }

        if (!APP_ROLES.has(normalizedRole)) {
            return { success: false, message: "Invalid role selected." };
        }

        const normalizedRegistrationNumber = registrationNumber.trim().toUpperCase();
        const normalizedEmail = email?.trim().toLowerCase() || null;
        const trimmedFullName = fullName.trim();
        const trimmedDepartment = department?.trim() || null;
        const trimmedPassword = password.trim();

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { registrationNumber: normalizedRegistrationNumber },
                    ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
                ],
            },
            select: {
                email: true,
                registrationNumber: true,
            },
        });

        if (existingUser?.registrationNumber === normalizedRegistrationNumber) {
            return { success: false, message: "An account with that registration number already exists." };
        }

        if (normalizedEmail && existingUser?.email === normalizedEmail) {
            return { success: false, message: "An account with that email already exists." };
        }

        const user = await prisma.user.create({
            data: {
                fullName: trimmedFullName,
                email: normalizedEmail,
                registrationNumber: normalizedRegistrationNumber,
                department: trimmedDepartment,
                role: normalizedRole,
                passwordHash: createPasswordHash(trimmedPassword, normalizedRegistrationNumber),
            },
        });

        await setAuthSession(user);
        return {
            success: true,
            message: "Account created successfully",
            data: {
                redirectTo: getRedirectPath(normalizedRole),
            }
        };
    } catch (error: unknown) {
        console.error("Registration failed:", error);
        if (isUniqueConstraintError(error, ["registrationNumber"])) {
            return { success: false, message: "An account with that registration number already exists." };
        }

        if (isUniqueConstraintError(error, ["email"])) {
            return { success: false, message: "An account with that email already exists." };
        }

        return { success: false, message: getActionErrorMessage(error, "Failed to create account") };
    }
}

/**
 * Clears the user's authentication session.
 */
export async function logout(): Promise<ActionResponse<void>> {
    try {
        await clearAuthSession();
        return { success: true, message: "Logged out.", data: undefined };
    } catch (error) {
        console.error("Logout failed:", error);
        return { success: false, message: "Logout failed." };
    }
}

type DemoLoginData = {
    password: typeof DEMO_LOGIN_PASSWORD;
    users: {
        label: string;
        role: string;
        fullName: string;
        registrationNumber: string;
        email: string;
    }[];
};

/**
 * Fetches demo login credentials for quick access.
 */
export async function getDemoLogins(): Promise<ActionResponse<DemoLoginData>> {
    try {
        await ensureDemoAccounts();

        return {
            success: true,
            data: {
                password: DEMO_LOGIN_PASSWORD,
                users: DEMO_ACCOUNTS.map((account) => ({
                    label: account.key,
                    role: account.role,
                    fullName: account.fullName,
                    registrationNumber: account.registrationNumber,
                    email: account.email,
                })),
            }
        };
    } catch (error) {
        console.error("Failed to fetch demo logins:", error);
        return { success: false, message: "Failed to fetch demo logins." };
    }
}
