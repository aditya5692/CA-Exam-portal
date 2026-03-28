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
  type AppRole,
} from "@/lib/server/auth-management";
import { ActionResponse } from "@/types/shared";
import prisma from "@/lib/prisma/client";

import { sendMsg91Otp, verifyMsg91Otp, verifyMsg91WidgetToken, normalizePhone } from "@/lib/server/msg91";

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

        await prisma.user.update({
            where: { id: user.id },
            data: { loginCount: { increment: 1 } },
        });

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
        return { success: false, message: "Verification failed." };
    }
}

/**
 * Verifies the MSG91 widget access token and handle the full login/registration flow.
 */
export async function verifyWidgetOtpAndLogin(accessToken: string): Promise<ActionResponse<LoginResult | { needsRegistration: boolean }>> {
    console.log("AuthAction: Starting verifyWidgetOtpAndLogin");
    
    try {
        // 1. Server-side Token Verification
        if (!process.env.MSG91_AUTH_KEY) {
            console.error("FATAL: MSG91_AUTH_KEY is MISSING in backend environment! Verification will fail.");
            return { success: false, message: "Server configuration error: Contact Administrator (Missing Auth Key)." };
        }

        const verification = await verifyMsg91WidgetToken(accessToken);
        if (!verification.success || !verification.phone) {
            console.error("AuthAction: MSG91 Verification Failed:", verification.message);
            return { success: false, message: verification.message };
        }

        const phone = verification.phone;
        const normalizedPhone = normalizePhone(phone);
        console.log(`AuthAction: Verified phone ${normalizedPhone}`);

        // 2. Database Synchronization & User Lookup
        await ensureDemoAccounts();
        
        const user = await prisma.user.findUnique({
            where: { phone: normalizedPhone },
        });

        // 3. Conditional Branching (New vs Existing User)
        if (!user) {
            console.log("AuthAction: User not found in database. Sign-up required.");
            return { 
                success: true, 
                data: { needsRegistration: true }, 
                message: "Phone verified. Please create your profile." 
            };
        }

        // 4. Update Persistence (Login Tracking)
        console.log(`AuthAction: User ${user.registrationNumber} found. Finalizing login.`);
        await prisma.user.update({
            where: { id: user.id },
            data: { 
                loginCount: { increment: 1 },
            },
        });

        // 5. Session Establishment
        await setAuthSession(user);

        // 6. Role-Based Routing
        const redirectTo = getRoleRedirectPath(user.role as AppRole);
        console.log(`AuthAction: Login complete. Redirecting to ${redirectTo}`);

        return {
            success: true,
            message: "Logged in successfully.",
            data: {
                redirectTo, 
                user: {
                    fullName: user.fullName,
                    role: user.role,
                    registrationNumber: user.registrationNumber,
                    phone: user.phone,
                },
            }
        };
    } catch (error) {
        console.error("AuthAction: Critical Failure in verifyWidgetOtpAndLogin:", error);
        return { 
            success: false, 
            message: "A server error occurred during verification. Please contact support." 
        };
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

export async function verifyOtpAndRegister(formData: {
    phone: string;
    otp: string;
    token?: string;
    fullName: string;
    email?: string;
    password?: string;
    role: "STUDENT" | "TEACHER";
    department?: string;
    dob?: string;
    location?: string;
    examTargetLevel?: string;
    examTargetMonth?: number;
    examTargetYear?: number;
}): Promise<ActionResponse<LoginResult>> {
    console.log(`AuthAction: Registering user ${formData.phone} with OTP/Token`);
    
    try {
        // 1. Verification Handshake
        let verificationSuccess = false;
        
        if (formData.token && formData.otp === "VERIFIED") {
            const verification = await verifyMsg91WidgetToken(formData.token);
            if (verification.success && verification.phone) {
                const normalizedIncoming = normalizePhone(formData.phone);
                const normalizedVerified = normalizePhone(verification.phone);
                
                if (normalizedIncoming === normalizedVerified) {
                    verificationSuccess = true;
                    console.log("AuthAction: Token verification matched phone number.");
                } else {
                    console.error("AuthAction: Phone mismatch", { expected: normalizedIncoming, actual: normalizedVerified });
                    return { success: false, message: "Security Check: Verified phone number does not match registration number." };
                }
            } else {
                return { success: false, message: verification.message || "Session verification failed. Please try again." };
            }
        } else {
            const verification = await verifyMsg91Otp(formData.phone, formData.otp);
            verificationSuccess = verification.success;
            if (!verificationSuccess) return { success: false, message: verification.message };
        }

        const prefix = formData.role === "TEACHER" ? "TCH" : "STU";
        
        const registered = await registerUserRecord({
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            role: formData.role,
            registrationNumber: `${prefix}-${Date.now().toString().slice(-6)}`,
            department: formData.department,
            dob: formData.dob,
            location: formData.location,
            examTargetLevel: formData.examTargetLevel,
            examTargetMonth: formData.examTargetMonth,
            examTargetYear: formData.examTargetYear,
        });

        await setAuthSession(registered.user);
        return {
            success: true,
            message: "Account created successfully",
            data: {
                redirectTo: registered.redirectTo,
                user: {
                    fullName: registered.user.fullName,
                    role: registered.user.role,
                    registrationNumber: registered.user.registrationNumber,
                    phone: registered.user.phone,
                }
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
/**
 * Logs in directly as a demo user (for testing purposes).
 */
export async function loginAsDemoUser(registrationNumber: string): Promise<ActionResponse<LoginResult>> {
    try {
        await ensureDemoAccounts();

        const demoAccount = DEMO_ACCOUNTS.find(a => a.registrationNumber === registrationNumber);
        if (!demoAccount) {
            return { success: false, message: "Invalid demo account." };
        }

        const user = await prisma.user.findUnique({
            where: { registrationNumber },
        });

        if (!user) {
            return { success: false, message: "User record not found." };
        }

        await setAuthSession(user);

        return {
            success: true,
            message: "Logged in as demo user.",
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
        console.error("Direct login failed:", error);
        return { success: false, message: "Direct login failed." };
    }
}
