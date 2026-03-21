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
  type AuthLoginInput,
} from "@/lib/server/auth-management";
import { ActionResponse } from "@/types/shared";

type LoginResult = {
    redirectTo: string;
    user: {
        fullName: string | null;
        role: string;
        registrationNumber: string | null;
    };
};

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
