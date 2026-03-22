import Razorpay from "razorpay";
import crypto from "crypto";

// Singleton Razorpay instance
let _razorpay: Razorpay | null = null;

function getRazorpayInstance(): Razorpay {
    if (!_razorpay) {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            throw new Error(
                "Razorpay credentials missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env"
            );
        }

        _razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    }
    return _razorpay;
}

export { getRazorpayInstance };

/**
 * Verifies a Razorpay payment signature.
 * Must be called server-side only.
 */
export function verifyPaymentSignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    signature: string
): boolean {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) throw new Error("RAZORPAY_KEY_SECRET is not set.");

    const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

    return generatedSignature === signature;
}

// Plan amounts in paise
export const PLAN_AMOUNTS: Record<string, number> = {
    "s-elite": 39900,    // ₹399 — Student PRO
    "t-pro": 249900,     // ₹2,499 — Teacher Studio Pro
};

// Plan display names
export const PLAN_NAMES: Record<string, string> = {
    "s-elite": "CA Pass PRO",
    "t-pro": "Studio Pro",
};

// Years of validity per plan
export const PLAN_VALIDITY_YEARS: Record<string, number> = {
    "s-elite": 1,
    "t-pro": 1,
};
