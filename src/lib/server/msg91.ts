import "server-only";

import { getResolvedPlatformConfig } from "./platform-config";

/**
 * Validates that the necessary MSG91 configuration is present.
 * In production, this will throw an error if keys are missing.
 */
function validateConfig(msg91AuthKey: string | null) {
    if (!msg91AuthKey) {
        const msg = "MSG91_AUTH_KEY is not configured in environment variables.";
        if (process.env.NODE_ENV === "production") throw new Error(msg);
        console.warn(msg);
        return false;
    }
    return true;
}

/**
 * Helper to normalize phone numbers for consistency.
 * In Production: Strictly follows E.164-like formatting without '+' for MSG91.
 */
export function normalizePhone(phone: string): string {
    const digitsOnly = phone.replace(/\D/g, "");
    
    // Handle Indian numbers (10 digits) -> Prepend 91
    if (digitsOnly.length === 10) {
        return `91${digitsOnly}`;
    }
    
    // Already has 12 digits (91XXXXXXXXXX)
    if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
        return digitsOnly;
    }

    // Default: return as is if it doesn't match standard Indian format
    return digitsOnly;
}

const IS_PROD = process.env.NODE_ENV === "production";

// Mock OTPS are ONLY accessible in non-production environments
const MOCK_OTPS: Record<string, string> = !IS_PROD ? {
    "91123456789": "1234",
    "91987654321": "4321",
    "911123456789": "1234",
    "919987654321": "4321",
    "919000000001": "1234",
    "919000000011": "1234",
    "919000000012": "1234",
    "919000010001": "1234",
    "919000010002": "1234",
    "917065751756": "0424",
} : {};

/**
 * Sends an OTP to the specified phone number using Msg91.
 */
export async function sendMsg91Otp(phone: string): Promise<{ success: boolean; message: string }> {
    const formattedPhone = normalizePhone(phone);
    const { values } = await getResolvedPlatformConfig();
    const msg91AuthKey = values.msg91AuthKey;
    const msg91OtpTemplateId = values.msg91OtpTemplateId;

    // Bypass for mock numbers (Dev/Test only)
    if (!IS_PROD && MOCK_OTPS[formattedPhone]) {
        console.log(`[DEV] Mock OTP requested for ${formattedPhone}. No real SMS sent.`);
        return { success: true, message: "OTP sent successfully (Mock)." };
    }

    if (!validateConfig(msg91AuthKey)) {
        return { success: false, message: "SMS service is currently unavailable (Config)." };
    }

    if (!msg91OtpTemplateId) {
        console.warn("MSG91_OTP_TEMPLATE_ID is missing.");
        return { success: false, message: "SMS configuration error (Template)." };
    }

    try {
        // Updated to api.msg91.com for standard production access
        const response = await fetch(`https://api.msg91.com/api/v5/otp?template_id=${msg91OtpTemplateId}&mobile=${formattedPhone}&authkey=${msg91AuthKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });

        const result = await response.json();
        if (result.type === "success") {
            return { success: true, message: "OTP sent successfully." };
        }

        console.error("MSG91 API Business Error:", result);
        return { success: false, message: result.message || "Failed to deliver OTP." };
    } catch (error) {
        console.error("MSG91 Network Error (sendOtp):", error);
        return { success: false, message: "Temporary network issue. Please try again later." };
    }
}

/**
 * Verifies the OTP entered by the user.
 */
export async function verifyMsg91Otp(phone: string, otp: string): Promise<{ success: boolean; message: string }> {
    const formattedPhone = normalizePhone(phone);
    const { values } = await getResolvedPlatformConfig();
    const msg91AuthKey = values.msg91AuthKey;

    // Dev/Test bypass
    if (!IS_PROD && MOCK_OTPS[formattedPhone]) {
        if (MOCK_OTPS[formattedPhone] === otp || otp === "VERIFIED") {
            return { success: true, message: "OTP verified (Mock)." };
        }
    }

    if (!validateConfig(msg91AuthKey)) {
        return { success: false, message: "Verification service temporarily unavailable." };
    }

    try {
        const response = await fetch(`https://api.msg91.com/api/v5/otp/verify?otp=${otp}&mobile=${formattedPhone}&authkey=${msg91AuthKey}`, {
            method: "GET",
        });

        const result = await response.json();
        if (result.type === "success") {
            return { success: true, message: "OTP verified." };
        }

        return { success: false, message: result.message || "The entered OTP is incorrect." };
    } catch (error) {
        console.error("MSG91 Network Error (verifyOtp):", error);
        return { success: false, message: "Could not connect to verification service." };
    }
}

/**
 * Verifies an access token (JWT) obtained from the MSG91 OTP widget.
 * Crucial for the embedded widget flow.
 */
export async function verifyMsg91WidgetToken(token: string): Promise<{ success: boolean; message: string; phone?: string }> {
    const { values } = await getResolvedPlatformConfig();
    const msg91AuthKey = values.msg91AuthKey;

    if (!validateConfig(msg91AuthKey)) {
        return { success: false, message: "Configuration error. Please contact support." };
    }

    // Dev/Test bypass for specific widget tokens
    if (!IS_PROD && (token === "mock-verified-token" || (token && token.length > 50 && token.startsWith("ey")))) {
        console.log("[DEV] Bypassing real verification for development JWT");
        // Defaulting to user's test number for dev bypass
        return { success: true, message: "Verified via Mock Bypass.", phone: "917065751756" };
    }

    try {
        const response = await fetch(`https://api.msg91.com/api/v5/widget/verifyAccessToken`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ 
                "authkey": msg91AuthKey,
                "access-token": token 
            })
        });

        const result = await response.json();
        
        if (result.status === "success" || result.type === "success") {
            const phone = result.data?.mobile || result.mobile;
            return { 
                success: true, 
                message: "Verification successful.", 
                phone 
            };
        }

        console.error("MSG91 Widget Token Validation Failed:", result);
        return { success: false, message: result.message || "Authentication token is invalid." };
    } catch (error) {
        console.error("MSG91 Network Error (verifyWidgetToken):", error);
        return { success: false, message: "Server connection failed during token validation." };
    }
}
