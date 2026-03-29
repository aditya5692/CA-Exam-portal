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

type RequestedOtpRole = "STUDENT" | "TEACHER";

type LoginResult = {
    redirectTo: string;
    user: {
        fullName: string | null;
        role: string;
        registrationNumber: string | null;
        phone: string | null;
    };
};

type RegistrationRequiredResult = {
    needsRegistration: true;
    verifiedPhone: string;
    requestedRole?: RequestedOtpRole;
};

type RoleMismatchResult = {
    roleMismatch: true;
    actualRole: AppRole;
    requestedRole: RequestedOtpRole;
    redirectTo: string;
};

function normalizeRequestedRole(role?: string | null): RequestedOtpRole | undefined {
    const normalizedRole = role?.trim().toUpperCase();
    if (normalizedRole === "STUDENT" || normalizedRole === "TEACHER") {
        return normalizedRole;
    }

    return undefined;
}

function formatRoleLabel(role: string) {
    return `${role.slice(0, 1)}${role.slice(1).toLowerCase()}`;
}

function buildRoleMismatchResponse(
    actualRole: AppRole,
    requestedRole: RequestedOtpRole,
): ActionResponse<RoleMismatchResult> {
    return {
        success: false,
        message: `This phone number is already registered for the ${formatRoleLabel(actualRole)} workspace. Switch to ${formatRoleLabel(actualRole)} login to continue.`,
        data: {
            roleMismatch: true,
            actualRole,
            requestedRole,
            redirectTo: getRoleRedirectPath(actualRole),
        },
    };
}

function getPhoneLookupCandidates(phone: string) {
    const normalizedPhone = normalizePhone(phone);
    const candidates = new Set<string>([normalizedPhone]);

    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length === 10) {
        candidates.add(digitsOnly);
    } else if (normalizedPhone.length === 12 && normalizedPhone.startsWith("91")) {
        candidates.add(normalizedPhone.slice(-10));
    }

    return Array.from(candidates);
}

async function findUserByVerifiedPhone(phone: string) {
    const candidates = getPhoneLookupCandidates(phone);

    return prisma.user.findFirst({
        where: {
            OR: candidates.map((candidate) => ({ phone: candidate })),
        },
    });
}

async function normalizeStoredUserPhone(userId: string, currentPhone: string | null, verifiedPhone: string) {
    if (!currentPhone || currentPhone === verifiedPhone) {
        return null;
    }

    try {
        return await prisma.user.update({
            where: { id: userId },
            data: { phone: verifiedPhone },
        });
    } catch (error) {
        console.warn("AuthAction: Unable to normalize stored user phone.", error);
        return null;
    }
}

function getSessionErrorMessage(error: unknown) {
    if (error instanceof Error) {
        if (error.message.includes("JWT_SECRET is not set")) {
            return "Login could not be completed because the server auth secret is missing. Set JWT_SECRET in your environment and retry.";
        }
    }

    return "An unexpected error occurred during verification. Please try again or contact support.";
}

async function finalizeVerifiedPhoneLogin(
    phone: string,
    requestedRole?: RequestedOtpRole,
): Promise<ActionResponse<LoginResult | RegistrationRequiredResult | RoleMismatchResult>> {
    await ensureDemoAccounts();

    const normalizedPhone = normalizePhone(phone);
    const user = await findUserByVerifiedPhone(normalizedPhone);

    if (!user) {
        return {
            success: true,
            data: {
                needsRegistration: true,
                verifiedPhone: normalizedPhone,
                requestedRole,
            },
            message: "Phone verified. Please complete your registration.",
        };
    }

    if (user.isBlocked) {
        return {
            success: false,
            message: user.blockedReason?.trim() || "This account has been blocked by an administrator.",
        };
    }

    if (requestedRole && user.role !== requestedRole) {
        return buildRoleMismatchResponse(user.role as AppRole, requestedRole);
    }

    const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { loginCount: { increment: 1 } },
    });

    const normalizedUser = await normalizeStoredUserPhone(user.id, updatedUser.phone, normalizedPhone);
    const sessionUser = normalizedUser ?? updatedUser;

    await setAuthSession(sessionUser);

    return {
        success: true,
        message: "Logged in successfully.",
        data: {
            redirectTo: getRoleRedirectPath(sessionUser.role as AppRole),
            user: {
                fullName: sessionUser.fullName,
                role: sessionUser.role,
                registrationNumber: sessionUser.registrationNumber,
                phone: sessionUser.phone,
            },
        },
    };
}

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
export async function verifyOtpAndLogin(
    phone: string,
    otp: string,
    requestedRole?: RequestedOtpRole,
): Promise<ActionResponse<LoginResult | RegistrationRequiredResult | RoleMismatchResult>> {
    try {
        const verification = await verifyMsg91Otp(phone, otp);
        if (!verification.success) {
            return { success: false, message: verification.message };
        }

        return finalizeVerifiedPhoneLogin(phone, normalizeRequestedRole(requestedRole));
    } catch {
        return { success: false, message: "Verification failed." };
    }
}

/**
 * Verifies the MSG91 widget access token and handle the full login/registration flow.
 */
export async function verifyWidgetOtpAndLogin(
    accessToken: string,
    requestedRole?: RequestedOtpRole,
): Promise<ActionResponse<LoginResult | RegistrationRequiredResult | RoleMismatchResult>> {
    const IS_PROD = process.env.NODE_ENV === "production";
    
    try {
        // 1. Server-side Token Verification
        const verification = await verifyMsg91WidgetToken(accessToken);
        if (!verification.success || !verification.phone) {
            // Internal logging for admins
            if (!IS_PROD) console.error("AuthAction: MSG91 Verification Failed:", verification.message);
            return { success: false, message: verification.message };
        }

        const phone = verification.phone;
        const normalizedPhone = normalizePhone(phone);
        
        if (!IS_PROD) console.log(`AuthAction: Verified phone ${normalizedPhone}`);

        return finalizeVerifiedPhoneLogin(normalizedPhone, normalizeRequestedRole(requestedRole));
    } catch (error) {
        console.error("AuthAction: Critical Failure in verifyWidgetOtpAndLogin:", error);
        return { 
            success: false, 
            message: getSessionErrorMessage(error),
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
}): Promise<ActionResponse<LoginResult | RoleMismatchResult>> {
    console.log(`AuthAction: Registering user ${formData.phone} with OTP/Token`);
    
    try {
        // 1. Verification Handshake
        const normalizedPhone = normalizePhone(formData.phone);

        if (formData.token && formData.otp === "VERIFIED") {
            const verification = await verifyMsg91WidgetToken(formData.token);
            if (verification.success && verification.phone) {
                const normalizedVerified = normalizePhone(verification.phone);
                
                if (normalizedPhone === normalizedVerified) {
                    console.log("AuthAction: Token verification matched phone number.");
                } else {
                    console.error("AuthAction: Phone mismatch", { expected: normalizedPhone, actual: normalizedVerified });
                    return { success: false, message: "Security Check: Verified phone number does not match registration number." };
                }
            } else {
                return { success: false, message: verification.message || "Session verification failed. Please try again." };
            }
        } else {
            const verification = await verifyMsg91Otp(formData.phone, formData.otp);
            if (!verification.success) return { success: false, message: verification.message };
        }

        const existingUser = await findUserByVerifiedPhone(normalizedPhone);

        if (existingUser) {
            if (existingUser.role !== formData.role) {
                return buildRoleMismatchResponse(existingUser.role as AppRole, formData.role);
            }

            const updatedUser = await prisma.user.update({
                where: { id: existingUser.id },
                data: { loginCount: { increment: 1 } },
            });

            const normalizedUser = await normalizeStoredUserPhone(existingUser.id, updatedUser.phone, normalizedPhone);
            const sessionUser = normalizedUser ?? updatedUser;

            await setAuthSession(sessionUser);

            return {
                success: true,
                message: "Account already exists. Signed you in.",
                data: {
                    redirectTo: getRoleRedirectPath(sessionUser.role as AppRole),
                    user: {
                        fullName: sessionUser.fullName,
                        role: sessionUser.role,
                        registrationNumber: sessionUser.registrationNumber,
                        phone: sessionUser.phone,
                    },
                },
            };
        }

        const prefix = formData.role === "TEACHER" ? "TCH" : "STU";
        
        const registered = await registerUserRecord({
            fullName: formData.fullName,
            email: formData.email,
            phone: normalizedPhone,
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
