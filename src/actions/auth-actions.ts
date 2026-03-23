"use server";

import {
  DEMO_ACCOUNTS,
  DEMO_LOGIN_PASSWORD,
  ensureDemoAccounts,
} from "@/lib/auth/demo-accounts";
import { clearAuthSession,setAuthSession } from "@/lib/auth/session";
import { getActionErrorMessage } from "@/lib/server/action-utils";
import {
  authenticateUserRecord,
  registerUserRecord,
  getRoleRedirectPath,
  type AuthLoginInput,
} from "@/lib/server/auth-management";
import type { AppRole } from "@/lib/auth/demo-accounts";
import { ActionResponse } from "@/types/shared";
import prisma from "@/lib/prisma/client";

import { sendMsg91Otp, verifyMsg91Otp } from "@/lib/server/msg91";

type LoginResult = {
    redirectTo: string;
    user: {
        fullName: string | null;
        role: string;
        registrationNumber: string | null;
        phone: string | null;
    };
};

/**
 * Requests an OTP for a given phone number.
 */
export async function requestOtp(phone: string): Promise<ActionResponse<void>> {
    try {
        const result = await sendMsg91Otp(phone);
        if (result.success) {
            return { success: true, data: undefined, message: result.message };
        }
        return { success: false, message: result.message };
    } catch (error) {
        console.error("requestOtp error:", error);
        return { success: false, message: "Failed to send OTP." };
    }
}

/**
 * Verifies OTP and logs in or redirects to registration.
 */
export async function verifyOtpAndLogin(phone: string, otp: string): Promise<ActionResponse<LoginResult | { needsRegistration: boolean }>> {
    try {
        const verification = await verifyMsg91Otp(phone, otp);
        if (!verification.success) {
            return { success: false, message: verification.message };
        }

        await ensureDemoAccounts();
        
        const normalizedPhone = (await import("@/lib/server/msg91")).normalizePhone(phone);

        // Logic to find user by phone and log them in
        // If not found, tell frontend we need registration details
        const user = await prisma.user.findUnique({
            where: { phone: normalizedPhone },
        });

        if (!user) {
            return { success: true, data: { needsRegistration: true }, message: "OTP verified. Please complete your registration." };
        }

        await setAuthSession(user);

        return {
            success: true,
            message: "Logged in successfully.",
            data: {
                redirectTo: getRoleRedirectPath(user.role as AppRole), 
                user: {
                    fullName: user.fullName,
                    role: user.role,
                    registrationNumber: user.registrationNumber,
                    phone: user.phone,
                },
            }
        };
    } catch (error) {
        console.error("verifyOtpAndLogin error:", error);
        return { success: false, message: "Verification failed." };
    }
}

/**
 * Authenticates a user and establishes a session.
 */
export async function login(input: AuthLoginInput): Promise<ActionResponse<LoginResult>> {
    try {
        const authenticated = await authenticateUserRecord(input);
        await setAuthSession(authenticated.user);

        return {
            success: true,
            message: "Logged in successfully.",
            data: {
                redirectTo: authenticated.redirectTo,
                user: {
                    fullName: authenticated.user.fullName,
                    role: authenticated.user.role,
                    registrationNumber: authenticated.user.registrationNumber,
                    phone: authenticated.user.phone,
                },
            }
        };
    } catch (error) {
        console.error("Login failed:", error);
        return { success: false, message: getActionErrorMessage(error, "Failed to log in.") };
    }
}

/**
 * Verifies OTP and completes registration.
 */
export async function verifyOtpAndRegister(formData: {
    phone: string;
    otp: string;
    fullName: string;
    password?: string;
    role: "STUDENT" | "TEACHER";
}): Promise<ActionResponse<{ redirectTo: string }>> {
    try {
        const verification = await verifyMsg91Otp(formData.phone, formData.otp);
        if (!verification.success) {
            return { success: false, message: verification.message };
        }

        const registered = await registerUserRecord({
            fullName: formData.fullName,
            phone: formData.phone,
            password: formData.password,
            role: formData.role,
            registrationNumber: `STU-${Date.now().toString().slice(-6)}`,
        });

        await setAuthSession(registered.user);
        return {
            success: true,
            message: "Account created successfully",
            data: {
                redirectTo: registered.redirectTo,
            }
        };
    } catch (error: unknown) {
        console.error("verifyOtpAndRegister error:", error);
        return { success: false, message: getActionErrorMessage(error, "Failed to create account") };
    }
}
export async function register(formData: Record<string, string>): Promise<ActionResponse<{ redirectTo: string }>> {
    try {
        const registered = await registerUserRecord({
            fullName: formData.fullName ?? "",
            email: formData.email,
            registrationNumber: formData.registrationNumber ?? "",
            department: formData.department,
            role: formData.role ?? "",
            password: formData.password ?? "",
        });
        await setAuthSession(registered.user);
        return {
            success: true,
            message: "Account created successfully",
            data: {
                redirectTo: registered.redirectTo,
            }
        };
    } catch (error: unknown) {
        console.error("Registration failed:", error);
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
