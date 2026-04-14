"use server";

const IS_PROD = process.env.NODE_ENV === "production";

import {
    DEMO_ACCOUNTS,
    DEMO_LOGIN_PASSWORD,
    ensureDemoAccounts,
} from "@/lib/auth/demo-accounts";
import { clearAuthSession, setAuthSession } from "@/lib/auth/session";
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
import { normalizePhone } from "@/lib/server/msg91";
import { verifyIdToken } from "@/lib/server/firebase-admin";
import { loginSchema, requestOtpSchema, verifyOtpSchema, registrationSchema } from "@/lib/validations/auth-schemas";

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
        message: `This identity is already registered for the ${formatRoleLabel(actualRole)} workspace. Switch to ${formatRoleLabel(actualRole)} login to continue.`,
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

async function finalizeVerifiedIdentityLogin(
    identity: { phone?: string; email?: string },
    requestedRole?: RequestedOtpRole,
): Promise<ActionResponse<LoginResult | RegistrationRequiredResult | RoleMismatchResult>> {
    await ensureDemoAccounts();

    const normalizedPhone = identity.phone ? normalizePhone(identity.phone) : null;
    const normalizedEmail = identity.email?.toLowerCase() || null;

    const user = await prisma.user.findFirst({
        where: {
            OR: [
                ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
                ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
            ],
        },
    });

    if (!user) {
        console.log(`AuthAction: [Signup Required] No account found for ${normalizedEmail || normalizedPhone}`);
        return {
            success: true,
            data: {
                needsRegistration: true,
                verifiedPhone: normalizedPhone || "",
                requestedRole,
            },
            message: "Identity verified. Please complete your registration.",
        };
    }

    if (user.isBlocked) {
        return {
            success: false,
            message: user.blockedReason?.trim() || "This account has been blocked by an administrator.",
        };
    }

    // Role check: If user already exists, we ignore the requested role and use their database role
    console.log(`AuthAction: [Login Success] Found user ${user.registrationNumber} with role ${user.role}`);

    const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { loginCount: { increment: 1 } },
    });

    let sessionUser = updatedUser;
    if (normalizedPhone) {
        const normalizedUser = await normalizeStoredUserPhone(user.id, updatedUser.phone || "", normalizedPhone);
        if (normalizedUser) sessionUser = normalizedUser;
    }

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
        const validated = requestOtpSchema.safeParse({ phone });
        if (!validated.success) {
            return { success: false, message: validated.error.issues[0].message };
        }

        return { success: false, message: "Direct OTP request via MSG91 is currently disabled." };
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
        const validated = verifyOtpSchema.safeParse({ phone, otp });
        if (!validated.success) {
            return { success: false, message: validated.error.issues[0].message };
        }

        // --- Demo Bypass Logic ---
        const normalizedPhone = normalizePhone(phone);
        const isDemoTeacher = normalizedPhone === "917065751756" && otp === "0424";
        const isDemoStudent = normalizedPhone === "919000010001" && otp === "0424";

        if (!IS_PROD && (isDemoTeacher || isDemoStudent)) {
            console.log(`AuthAction: [Demo Bypass] Logging in ${normalizedPhone}`);
            return finalizeVerifiedIdentityLogin({ phone: normalizedPhone }, requestedRole);
        }
        // -------------------------

        return { success: false, message: "Direct OTP verification via MSG91 is currently disabled." };
    } catch {
        return { success: false, message: "Verification failed." };
    }
}

/**
 * Verifies the Firebase ID token and handles the full login/registration flow.
 */
export async function verifyFirebaseTokenAndLogin(
    idToken: string,
    requestedRole?: RequestedOtpRole,
): Promise<ActionResponse<LoginResult | RegistrationRequiredResult | RoleMismatchResult>> {
    try {
        let decodedToken;
        if (!IS_PROD && idToken === "mock-firebase-token") {
            decodedToken = { phone_number: "917065751756", email: "student1@demo.local", uid: "mock-uid" };
        } else {
            decodedToken = await verifyIdToken(idToken);
        }

        const decoded = decodedToken as any;
        const phone = decoded.phone_number;
        const email = decoded.email;

        if (!phone && !email) {
            return { success: false, message: "Could not retrieve identity information from verification." };
        }

        console.log(`AuthAction: [VerifyFirebase] Initializing login for: ${email || phone}`);

        return finalizeVerifiedIdentityLogin(
            { phone, email },
            normalizeRequestedRole(requestedRole)
        );
    } catch (error) {
        console.error("AuthAction: Firebase Verification Failed:", error);
        return {
            success: false,
            message: "Authentication failed. Please try again.",
        };
    }
}

/**
 * Verifies the MSG91 widget access token and handle the full login/registration flow.
 * @deprecated Switching to Firebase Auth
 */
export async function verifyWidgetOtpAndLogin(
    accessToken: string,
    requestedRole?: RequestedOtpRole,
): Promise<ActionResponse<LoginResult | RegistrationRequiredResult | RoleMismatchResult>> {
    // --- Demo Bypass Logic ---
    if (!IS_PROD && accessToken.startsWith("mock-verified-token")) {
        let phone = "917065751756"; // Default demo teacher
        if (accessToken.includes(":")) {
            phone = accessToken.split(":")[1];
        }
        console.log(`AuthAction: [Widget Demo Bypass] Logging in ${phone}`);
        return finalizeVerifiedIdentityLogin({ phone }, requestedRole);
    }
    // -------------------------

    return { success: false, message: "MSG91 login is currently disabled. Please use the modern login." };
}

/**
 * Authenticates a user and establishes a session.
 */
export async function login(input: AuthLoginInput): Promise<ActionResponse<LoginResult>> {
    try {
        const validated = loginSchema.safeParse(input);
        if (!validated.success) {
            return { success: false, message: validated.error.issues[0].message };
        }

        const authenticated = await authenticateUserRecord({
            identifier: validated.data.email,
            password: validated.data.password,
        } as AuthLoginInput);
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
    city: string;
    state: string;
    experienceYears?: number;
    articleshipFirmType?: string;
    expertise?: string;
}
): Promise<ActionResponse<LoginResult | RoleMismatchResult>> {
    console.log(`AuthAction: Registering user ${formData.phone} with OTP/Token`);

    try {
        const validatedForm = registrationSchema.safeParse(formData);
        if (!validatedForm.success && !formData.token) {
            return { success: false, message: validatedForm.error.issues[0].message };
        }

        // 1. Verification Handshake
        const normalizedPhone = normalizePhone(formData.phone);

        if (formData.token && formData.otp === "VERIFIED") {
            const decodedToken = (await verifyIdToken(formData.token)) as any;
            const verifiedPhone = decodedToken.phone_number ? normalizePhone(decodedToken.phone_number) : null;
            const verifiedEmail = decodedToken.email?.toLowerCase() || null;

            const matchesPhone = verifiedPhone && normalizedPhone === verifiedPhone;
            const matchesEmail = verifiedEmail && formData.email?.toLowerCase() === verifiedEmail;

            if (matchesPhone || matchesEmail) {
                console.log("AuthAction: Firebase verification matched identity.");
            } else {
                console.error("AuthAction: Identity mismatch", {
                    phoneMatch: matchesPhone,
                    emailMatch: matchesEmail
                });
                return { success: false, message: "Security Check: Verified identity does not match registration details." };
            }
        } else {
            return { success: false, message: "Direct OTP verification via MSG91 is disabled." };
        }

        const existingUser = await findUserByVerifiedPhone(normalizedPhone);

        if (existingUser) {
            console.log(`AuthAction: [Register Bypass] User ${normalizedPhone} already exists. Signing in instead.`);
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

        console.log(`AuthAction: [Create User] Registering new ${formData.role} account for ${normalizedPhone}`);

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
            city: formData.city,
            state: formData.state,
            experienceYears: formData.experienceYears,
            articleshipFirmType: formData.articleshipFirmType,
            expertise: formData.expertise,
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
