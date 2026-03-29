type DemoOtpEntry = {
    phone: string;
    otp: string;
    widgetToken: string;
};

const DEFAULT_WIDGET_TOKEN = "mock-verified-token";
const EXPLICIT_WIDGET_TOKEN_PREFIX = "mock-verified-token:";

const DEMO_OTP_ENTRIES: DemoOtpEntry[] = [
    { phone: "91123456789", otp: "1234", widgetToken: `${EXPLICIT_WIDGET_TOKEN_PREFIX}91123456789` },
    { phone: "91987654321", otp: "4321", widgetToken: `${EXPLICIT_WIDGET_TOKEN_PREFIX}91987654321` },
    { phone: "911123456789", otp: "0424", widgetToken: `${EXPLICIT_WIDGET_TOKEN_PREFIX}911123456789` },
    { phone: "919987654321", otp: "0424", widgetToken: `${EXPLICIT_WIDGET_TOKEN_PREFIX}919987654321` },
    { phone: "917065751756", otp: "0424", widgetToken: DEFAULT_WIDGET_TOKEN },
    { phone: "919000000001", otp: "0424", widgetToken: `${EXPLICIT_WIDGET_TOKEN_PREFIX}919000000001` },
    { phone: "919000000011", otp: "0424", widgetToken: `${EXPLICIT_WIDGET_TOKEN_PREFIX}919000000011` },
    { phone: "919000000012", otp: "0424", widgetToken: `${EXPLICIT_WIDGET_TOKEN_PREFIX}919000000012` },
    { phone: "919000010001", otp: "0424", widgetToken: `${EXPLICIT_WIDGET_TOKEN_PREFIX}919000010001` },
    { phone: "919000010002", otp: "0424", widgetToken: `${EXPLICIT_WIDGET_TOKEN_PREFIX}919000010002` },
];

export function normalizeDemoOtpPhone(phone: string) {
    const digitsOnly = phone.replace(/\D/g, "");

    if (digitsOnly.length === 10) {
        return `91${digitsOnly}`;
    }

    if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
        return digitsOnly;
    }

    return digitsOnly;
}

export function getDemoOtpEntryByPhone(phone: string) {
    const normalizedPhone = normalizeDemoOtpPhone(phone);
    return DEMO_OTP_ENTRIES.find((entry) => entry.phone === normalizedPhone);
}

export function getDemoOtpEntryByWidgetToken(token: string) {
    if (token === DEFAULT_WIDGET_TOKEN) {
        return DEMO_OTP_ENTRIES.find((entry) => entry.widgetToken === DEFAULT_WIDGET_TOKEN);
    }

    if (!token.startsWith(EXPLICIT_WIDGET_TOKEN_PREFIX)) {
        return null;
    }

    const normalizedPhone = normalizeDemoOtpPhone(token.slice(EXPLICIT_WIDGET_TOKEN_PREFIX.length));
    return DEMO_OTP_ENTRIES.find((entry) => entry.phone === normalizedPhone) ?? null;
}
