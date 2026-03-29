import "server-only";

import crypto from "node:crypto";
import prisma from "@/lib/prisma/client";
import type { PlatformConfig } from "@prisma/client";

export type PlatformConfigKey =
    | "msg91AuthKey"
    | "msg91WidgetId"
    | "msg91OtpTemplateId"
    | "msg91TokenAuth"
    | "razorpayKeyId"
    | "razorpayKeySecret"
    | "razorpayWebhookSecret"
    | "razorpayPlanBasic"
    | "razorpayPlanPro";

export type PlatformConfigSource = "database" | "env" | "missing";

export type PlatformConfigFieldDefinition = {
    key: PlatformConfigKey;
    label: string;
    group: "MSG91" | "RAZORPAY";
    description: string;
    envKeys: readonly string[];
    isSecret: boolean;
    isPublicClientValue: boolean;
    requiredForRuntime: boolean;
    inputType?: "text" | "password";
};

export type PlatformConfigFieldStatus = PlatformConfigFieldDefinition & {
    value: string;
    source: PlatformConfigSource;
    isConfigured: boolean;
};

const ENCRYPTED_VALUE_PREFIX = "enc::v1::";

export const PLATFORM_CONFIG_FIELDS: readonly PlatformConfigFieldDefinition[] = [
    {
        key: "msg91AuthKey",
        label: "MSG91 Auth Key",
        group: "MSG91",
        description: "Server-side auth key used for OTP verification and widget token validation.",
        envKeys: ["MSG91_AUTH_KEY"],
        isSecret: true,
        isPublicClientValue: false,
        requiredForRuntime: true,
        inputType: "password",
    },
    {
        key: "msg91WidgetId",
        label: "MSG91 Widget ID",
        group: "MSG91",
        description: "Widget identifier consumed by login and signup screens at runtime.",
        envKeys: ["MSG91_WIDGET_ID", "NEXT_PUBLIC_MSG91_WIDGET_ID"],
        isSecret: false,
        isPublicClientValue: true,
        requiredForRuntime: true,
        inputType: "text",
    },
    {
        key: "msg91OtpTemplateId",
        label: "MSG91 OTP Template ID",
        group: "MSG91",
        description: "Template used when fallback OTP APIs are triggered server-side.",
        envKeys: ["MSG91_OTP_TEMPLATE_ID"],
        isSecret: false,
        isPublicClientValue: false,
        requiredForRuntime: false,
        inputType: "text",
    },
    {
        key: "msg91TokenAuth",
        label: "MSG91 Token Auth",
        group: "MSG91",
        description: "Runtime client token used by the embedded MSG91 widget on auth pages.",
        envKeys: ["MSG91_TOKEN_AUTH", "NEXT_PUBLIC_MSG91_TOKEN_AUTH"],
        isSecret: false,
        isPublicClientValue: true,
        requiredForRuntime: true,
        inputType: "text",
    },
    {
        key: "razorpayKeyId",
        label: "Razorpay Key ID",
        group: "RAZORPAY",
        description: "Public checkout key shared with pricing and subscription flows at runtime.",
        envKeys: ["RAZORPAY_KEY_ID", "NEXT_PUBLIC_RAZORPAY_KEY_ID"],
        isSecret: false,
        isPublicClientValue: true,
        requiredForRuntime: true,
        inputType: "text",
    },
    {
        key: "razorpayKeySecret",
        label: "Razorpay Key Secret",
        group: "RAZORPAY",
        description: "Server-side secret used to create orders and verify payment signatures.",
        envKeys: ["RAZORPAY_KEY_SECRET"],
        isSecret: true,
        isPublicClientValue: false,
        requiredForRuntime: true,
        inputType: "password",
    },
    {
        key: "razorpayWebhookSecret",
        label: "Razorpay Webhook Secret",
        group: "RAZORPAY",
        description: "Server-side secret used to verify Razorpay webhook payloads.",
        envKeys: ["RAZORPAY_WEBHOOK_SECRET"],
        isSecret: true,
        isPublicClientValue: false,
        requiredForRuntime: true,
        inputType: "password",
    },
    {
        key: "razorpayPlanBasic",
        label: "Student Basic Monthly Plan ID",
        group: "RAZORPAY",
        description: "Recurring Razorpay plan ID for the student Basic monthly subscription.",
        envKeys: ["RAZORPAY_PLAN_BASIC", "NEXT_PUBLIC_RAZORPAY_PLAN_BASIC"],
        isSecret: false,
        isPublicClientValue: true,
        requiredForRuntime: false,
        inputType: "text",
    },
    {
        key: "razorpayPlanPro",
        label: "Student Pro Monthly Plan ID",
        group: "RAZORPAY",
        description: "Recurring Razorpay plan ID for the student Pro monthly subscription.",
        envKeys: ["RAZORPAY_PLAN_PRO", "NEXT_PUBLIC_RAZORPAY_PLAN_PRO"],
        isSecret: false,
        isPublicClientValue: true,
        requiredForRuntime: false,
        inputType: "text",
    },
] as const;

const PLATFORM_CONFIG_KEY_SET = new Set<PlatformConfigKey>(
    PLATFORM_CONFIG_FIELDS.map((field) => field.key),
);
const PLATFORM_CONFIG_SECRET_KEY_SET = new Set<PlatformConfigKey>(
    PLATFORM_CONFIG_FIELDS.filter((field) => field.isSecret).map((field) => field.key),
);

function normalizeOptionalString(value: string | null | undefined) {
    const normalized = value?.trim() ?? "";
    return normalized.length > 0 ? normalized : null;
}

function getPlatformConfigEncryptionKey() {
    const secret =
        normalizeOptionalString(process.env.PLATFORM_CONFIG_ENCRYPTION_KEY) ??
        normalizeOptionalString(process.env.JWT_SECRET);

    if (!secret) {
        return null;
    }

    return crypto.createHash("sha256").update(secret).digest();
}

function encryptPlatformConfigSecret(value: string) {
    const key = getPlatformConfigEncryptionKey();
    if (!key) {
        return value;
    }

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return `${ENCRYPTED_VALUE_PREFIX}${iv.toString("base64url")}.${authTag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptPlatformConfigSecret(value: string | null | undefined) {
    const normalized = normalizeOptionalString(value);
    if (!normalized) {
        return null;
    }

    if (!normalized.startsWith(ENCRYPTED_VALUE_PREFIX)) {
        return normalized;
    }

    const key = getPlatformConfigEncryptionKey();
    if (!key) {
        return null;
    }

    const payload = normalized.slice(ENCRYPTED_VALUE_PREFIX.length);
    const [ivPart, authTagPart, encryptedPart] = payload.split(".");

    if (!ivPart || !authTagPart || !encryptedPart) {
        return null;
    }

    try {
        const decipher = crypto.createDecipheriv(
            "aes-256-gcm",
            key,
            Buffer.from(ivPart, "base64url"),
        );
        decipher.setAuthTag(Buffer.from(authTagPart, "base64url"));

        const decrypted = Buffer.concat([
            decipher.update(Buffer.from(encryptedPart, "base64url")),
            decipher.final(),
        ]);

        return normalizeOptionalString(decrypted.toString("utf8"));
    } catch {
        return null;
    }
}

function readFirstEnvValue(envKeys: readonly string[]) {
    for (const envKey of envKeys) {
        const value = normalizeOptionalString(process.env[envKey]);
        if (value) {
            return value;
        }
    }

    return null;
}

export async function getStoredPlatformConfig() {
    return prisma.platformConfig.findUnique({
        where: { singletonKey: "default" },
    });
}

function resolveFieldStatus(
    field: PlatformConfigFieldDefinition,
    storedConfig: PlatformConfig | null,
): PlatformConfigFieldStatus {
    const databaseValue = field.isSecret
        ? decryptPlatformConfigSecret(storedConfig?.[field.key])
        : normalizeOptionalString(storedConfig?.[field.key]);
    const envValue = readFirstEnvValue(field.envKeys);
    const resolvedValue = databaseValue ?? envValue ?? "";
    const source: PlatformConfigSource = databaseValue
        ? "database"
        : envValue
            ? "env"
            : "missing";

    return {
        ...field,
        value: resolvedValue,
        source,
        isConfigured: resolvedValue.length > 0,
    };
}

export async function getResolvedPlatformConfigFields() {
    const storedConfig = await getStoredPlatformConfig();
    return PLATFORM_CONFIG_FIELDS.map((field) => resolveFieldStatus(field, storedConfig));
}

export async function getResolvedPlatformConfig() {
    const fields = await getResolvedPlatformConfigFields();

    const valueByKey = Object.fromEntries(
        fields.map((field) => [field.key, field.value || null]),
    ) as Record<PlatformConfigKey, string | null>;

    const sourceByKey = Object.fromEntries(
        fields.map((field) => [field.key, field.source]),
    ) as Record<PlatformConfigKey, PlatformConfigSource>;

    return {
        fields,
        values: valueByKey,
        sources: sourceByKey,
        isRuntimeReady: fields
            .filter((field) => field.requiredForRuntime)
            .every((field) => field.isConfigured),
    };
}

export async function getPublicPlatformConfig() {
    const fields = await getResolvedPlatformConfigFields();
    const publicFields = fields.filter((field) => field.isPublicClientValue);

    return {
        msg91WidgetId: publicFields.find((field) => field.key === "msg91WidgetId")?.value ?? "",
        msg91TokenAuth: publicFields.find((field) => field.key === "msg91TokenAuth")?.value ?? "",
        razorpayKeyId: publicFields.find((field) => field.key === "razorpayKeyId")?.value ?? "",
        razorpayPlanBasic: publicFields.find((field) => field.key === "razorpayPlanBasic")?.value ?? "",
        razorpayPlanPro: publicFields.find((field) => field.key === "razorpayPlanPro")?.value ?? "",
        sources: Object.fromEntries(
            publicFields.map((field) => [field.key, field.source]),
        ) as Partial<Record<PlatformConfigKey, PlatformConfigSource>>,
    };
}

export async function getRazorpayRecurringPlanId(planId: string) {
    const config = await getResolvedPlatformConfig();

    if (planId === "s-basic") {
        return config.values.razorpayPlanBasic;
    }

    if (planId === "s-pro" || planId === "s-elite") {
        return config.values.razorpayPlanPro;
    }

    return null;
}

export function sanitizePlatformConfigInput(
    input: Record<string, FormDataEntryValue | null>,
): Partial<Record<PlatformConfigKey, string | null>> {
    const entries = Object.entries(input).filter(([key]) =>
        PLATFORM_CONFIG_KEY_SET.has(key as PlatformConfigKey),
    );

    return Object.fromEntries(
        entries.map(([key, value]) => [key, normalizeOptionalString(String(value ?? ""))]),
    ) as Partial<Record<PlatformConfigKey, string | null>>;
}

export function preparePlatformConfigForPersistence(
    input: Partial<Record<PlatformConfigKey, string | null>>,
) {
    return Object.fromEntries(
        Object.entries(input).map(([key, value]) => {
            const normalizedValue = normalizeOptionalString(value);
            if (!normalizedValue) {
                return [key, null];
            }

            if (!PLATFORM_CONFIG_SECRET_KEY_SET.has(key as PlatformConfigKey)) {
                return [key, normalizedValue];
            }

            return [key, encryptPlatformConfigSecret(normalizedValue)];
        }),
    ) as Partial<Record<PlatformConfigKey, string | null>>;
}

export function validatePlatformConfigInput(
    input: Partial<Record<PlatformConfigKey, string | null>>,
) {
    const errors: string[] = [];
    const widgetId = normalizeOptionalString(input.msg91WidgetId);
    const tokenAuth = normalizeOptionalString(input.msg91TokenAuth);
    const razorpayKeyId = normalizeOptionalString(input.razorpayKeyId);
    const razorpayPlanBasic = normalizeOptionalString(input.razorpayPlanBasic);
    const razorpayPlanPro = normalizeOptionalString(input.razorpayPlanPro);

    if ((widgetId && !tokenAuth) || (!widgetId && tokenAuth)) {
        errors.push("MSG91 Widget ID and Token Auth must be saved together.");
    }

    if (razorpayKeyId && !/^rzp_(test|live)_[A-Za-z0-9]+$/.test(razorpayKeyId)) {
        errors.push("Razorpay Key ID must start with rzp_test_ or rzp_live_.");
    }

    if (razorpayPlanBasic && !/^plan_[A-Za-z0-9]+$/.test(razorpayPlanBasic)) {
        errors.push("Student Basic Monthly Plan ID must start with plan_.");
    }

    if (razorpayPlanPro && !/^plan_[A-Za-z0-9]+$/.test(razorpayPlanPro)) {
        errors.push("Student Pro Monthly Plan ID must start with plan_.");
    }

    return errors;
}
