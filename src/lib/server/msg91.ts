import "server-only";

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_OTP_TEMPLATE_ID = process.env.MSG91_OTP_TEMPLATE_ID;

/**
 * Helper to normalize phone numbers for consistency (remove spaces, dashes, etc.)
 */
export function normalizePhone(phone: string): string {
    const digitsOnly = phone.replace(/\D/g, "");
    // If it starts with 91 and has 12 digits, it's already formatted
    if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
        return digitsOnly;
    }
    // Assume 10-digit numbers are Indian and prepend 91
    if (digitsOnly.length === 10) {
        return `91${digitsOnly}`;
    }
    return digitsOnly;
}

const MOCK_OTPS: Record<string, string> = {
    "91123456789": "1234",  // Legacy Sample Student
    "91987654321": "4321",  // Legacy Sample Admin
    "911123456789": "1234", // User Provided Sample Student
    "919987654321": "4321", // User Provided Sample Admin
    "919000000001": "1234", // Demo Portal Admin
    "919000000011": "1234", // Demo Teacher 1
    "919000000012": "1234", // Demo Teacher 2
    "919000010001": "1234", // Demo Student 1
    "919000010002": "1234", // Demo Student 2
};

/**
 * Sends an OTP to the specified phone number using Msg91.
 */
export async function sendMsg91Otp(phone: string): Promise<{ success: boolean; message: string }> {
    const formattedPhone = normalizePhone(phone);

    // Bypass for mock numbers
    if (MOCK_OTPS[formattedPhone]) {
        console.log(`Mock OTP requested for ${formattedPhone}. No SMS sent.`);
        return { success: true, message: "OTP sent successfully (Mock)." };
    }

    if (!MSG91_AUTH_KEY || !MSG91_OTP_TEMPLATE_ID) {
        console.warn("Msg91 credentials not configured. OTP will not be sent.");
        return { success: false, message: "SMS configuration missing." };
    }

    try {
        const response = await fetch(`https://control.msg91.com/api/v5/otp?template_id=${MSG91_OTP_TEMPLATE_ID}&mobile=${formattedPhone}&authkey=${MSG91_AUTH_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });

        const result = await response.json();
        if (result.type === "success") {
            return { success: true, message: "OTP sent successfully." };
        }

        return { success: false, message: result.message || "Failed to send OTP." };
    } catch (error) {
        console.error("Msg91 sendOtp error:", error);
        return { success: false, message: "Network error while sending OTP." };
    }
}

export async function verifyMsg91Otp(phone: string, otp: string): Promise<{ success: boolean; message: string }> {
    const formattedPhone = normalizePhone(phone);

    // Mock OTP logic for development/testing
    // Allow the specific mock OTP OR a 'VERIFIED' bypass string for staged registrations
    if (MOCK_OTPS[formattedPhone] === otp || (MOCK_OTPS[formattedPhone] && otp === "VERIFIED")) {
        return { success: true, message: "OTP verified (Mock)." };
    }

    if (!MSG91_AUTH_KEY) {
        console.warn("Msg91 auth key missing. OTP verification skipped.");
        return { success: false, message: "SMS configuration missing." };
    }

    try {
        const response = await fetch(`https://control.msg91.com/api/v5/otp/verify?otp=${otp}&mobile=${formattedPhone}&authkey=${MSG91_AUTH_KEY}`, {
            method: "GET",
        });

        const result = await response.json();
        if (result.type === "success") {
            return { success: true, message: "OTP verified." };
        }

        return { success: false, message: result.message || "Invalid OTP." };
    } catch (error) {
        console.error("Msg91 verifyOtp error:", error);
        return { success: false, message: "Network error while verifying OTP." };
    }
}

/**
 * Verifies an access token (JWT) obtained from the MSG91 OTP widget.
 * This should be called from the server after the client-side verification is complete.
 */
export async function verifyMsg91WidgetToken(token: string): Promise<{ success: boolean; message: string; phone?: string }> {
    if (!MSG91_AUTH_KEY) {
        console.warn("Msg91 auth key missing for widget token verification.");
        return { success: false, message: "SMS configuration missing." };
    }

    try {
        const response = await fetch(`https://api.msg91.com/api/v5/widget/verifyAccessToken`, {
            method: "POST",
            headers: { 
                "authkey": MSG91_AUTH_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ token })
        });

        const result = await response.json();
        
        // MSG91 Verify Access Token API typical response:
        // { "status": "success", "data": { "mobile": "911234567890", ... } }
        if (result.status === "success" || result.type === "success") {
            const phone = result.data?.mobile || result.mobile;
            return { 
                success: true, 
                message: "Verification successful.", 
                phone 
            };
        }

        return { success: false, message: result.message || "Invalid or expired token." };
    } catch (error) {
        console.error("Msg91 verifyWidgetToken error:", error);
        return { success: false, message: "Network error during token verification." };
    }
}
