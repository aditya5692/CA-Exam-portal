export type ProfileRole = "TEACHER" | "STUDENT";

export type ProfileFieldName =
    | "fullName"
    | "email"
    | "registrationNumber"
    | "department"
    | "phone"
    | "preferredLanguage"
    | "timezone"
    | "bio"
    | "designation"
    | "expertise"
    | "examTarget"
    | "examTargetMonth"
    | "examTargetYear"
    | "caLevel"
    | "batch"
    | "dob"
    | "location"
    | "firm"
    | "firmRole"
    | "articleshipYear"
    | "articleshipTotal"
    | "resumeUrl";

export type ProfileFieldErrors = Partial<Record<ProfileFieldName, string>>;

type TextValidationOptions = {
    field: ProfileFieldName;
    label: string;
    maxLength: number;
    allowLineBreaks?: boolean;
};

type NormalizedProfileValues = {
    fullName: string | null;
    email: string | null;
    registrationNumber: string | null;
    department: string | null;
    phone: string | null;
    preferredLanguage: string | null;
    timezone: string | null;
    bio: string | null;
    designation: string | null;
    expertise: string | null;
    examTarget: string | null;
    caLevel: string | null;
    examTargetMonth: number | null;
    examTargetYear: number | null;
    isPublicProfile: boolean;
    batch: string | null;
    dob: string | null;
    location: string | null;
    firm: string | null;
    firmRole: string | null;
    articleshipYear: number | null;
    articleshipTotal: number | null;
    foundationCleared: boolean;
    intermediateCleared: boolean;
    finalCleared: boolean;
    resumeUrl: string | null;
};

const REGISTRATION_PATTERN = /^[A-Z0-9/-]{3,40}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_ALLOWED_PATTERN = /^[+\d()\-\s]{7,30}$/;
const VALID_CA_LEVELS = new Set(["foundation", "ipc", "final"]);
const MONTH_NAME_TO_NUMBER = new Map([
    ["jan", 1],
    ["january", 1],
    ["feb", 2],
    ["february", 2],
    ["mar", 3],
    ["march", 3],
    ["apr", 4],
    ["april", 4],
    ["may", 5],
    ["jun", 6],
    ["june", 6],
    ["jul", 7],
    ["july", 7],
    ["aug", 8],
    ["august", 8],
    ["sep", 9],
    ["sept", 9],
    ["september", 9],
    ["oct", 10],
    ["october", 10],
    ["nov", 11],
    ["november", 11],
    ["dec", 12],
    ["december", 12],
]);

function normalizeOptionalString(input: FormDataEntryValue | string | null | undefined) {
    const value = String(input ?? "").trim();
    return value || null;
}

function normalizeOptionalEmail(input: FormDataEntryValue | null) {
    const value = String(input ?? "").trim().toLowerCase();
    return value || null;
}

function normalizeOptionalRegistration(input: FormDataEntryValue | null) {
    const value = String(input ?? "").trim().toUpperCase();
    return value || null;
}

function hasUnsafeControlCharacters(value: string, allowLineBreaks = false) {
    const pattern = allowLineBreaks
        ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/
        : /[\u0000-\u001F\u007F]/;

    return pattern.test(value);
}

function setFieldError(
    fieldErrors: ProfileFieldErrors,
    field: ProfileFieldName,
    message: string,
) {
    if (!fieldErrors[field]) {
        fieldErrors[field] = message;
    }
}

function validateTextField(
    fieldErrors: ProfileFieldErrors,
    rawValue: FormDataEntryValue | string | null | undefined,
    options: TextValidationOptions,
) {
    const value = normalizeOptionalString(rawValue);
    if (!value) {
        return null;
    }

    if (value.length > options.maxLength) {
        setFieldError(fieldErrors, options.field, `${options.label} must be ${options.maxLength} characters or fewer.`);
    }

    if (hasUnsafeControlCharacters(value, options.allowLineBreaks)) {
        setFieldError(fieldErrors, options.field, `${options.label} contains unsupported control characters.`);
    }

    return value;
}

function parseStrictOptionalBoundedInt(
    fieldErrors: ProfileFieldErrors,
    rawValue: FormDataEntryValue | null,
    field: ProfileFieldName,
    label: string,
    min: number,
    max: number,
) {
    const value = String(rawValue ?? "").trim();
    if (!value) {
        return null;
    }

    if (!/^-?\d+$/.test(value)) {
        setFieldError(fieldErrors, field, `${label} must be a whole number.`);
        return null;
    }

    const parsedValue = Number.parseInt(value, 10);
    if (parsedValue < min || parsedValue > max) {
        setFieldError(fieldErrors, field, `${label} must be between ${min} and ${max}.`);
        return null;
    }

    return parsedValue;
}

export function isSafeExternalUrl(value: string | null | undefined) {
    if (!value?.trim()) {
        return false;
    }

    try {
        const url = new URL(value.trim());
        return url.protocol === "https:" || url.protocol === "http:";
    } catch {
        return false;
    }
}

function normalizeExternalUrl(value: string | null | undefined) {
    if (!value?.trim()) {
        return null;
    }

    const normalized = value.trim();
    if (!isSafeExternalUrl(normalized)) {
        return null;
    }

    return new URL(normalized).toString();
}

function isValidPhoneNumber(value: string) {
    if (!PHONE_ALLOWED_PATTERN.test(value)) {
        return false;
    }

    const digitsOnly = value.replace(/\D/g, "");
    return digitsOnly.length >= 7 && digitsOnly.length <= 15;
}

function isValidDatePart(day: number, month: number, year: number) {
    if (year < 1900 || year > 2100) {
        return false;
    }

    const candidate = new Date(year, month - 1, day);
    return (
        candidate.getFullYear() === year &&
        candidate.getMonth() === month - 1 &&
        candidate.getDate() === day
    );
}

export function isValidProfileDate(value: string | null | undefined) {
    if (!value?.trim()) {
        return true;
    }

    const normalized = value.trim();
    if (hasUnsafeControlCharacters(normalized)) {
        return false;
    }

    const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
        const [, yearValue, monthValue, dayValue] = isoMatch;
        return isValidDatePart(
            Number.parseInt(dayValue, 10),
            Number.parseInt(monthValue, 10),
            Number.parseInt(yearValue, 10),
        );
    }

    const slashMatch = normalized.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (slashMatch) {
        const [, dayValue, monthValue, yearValue] = slashMatch;
        return isValidDatePart(
            Number.parseInt(dayValue, 10),
            Number.parseInt(monthValue, 10),
            Number.parseInt(yearValue, 10),
        );
    }

    const monthNameMatch = normalized.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
    if (monthNameMatch) {
        const [, dayValue, monthValue, yearValue] = monthNameMatch;
        const monthNumber = MONTH_NAME_TO_NUMBER.get(monthValue.toLowerCase());
        if (!monthNumber) {
            return false;
        }

        return isValidDatePart(
            Number.parseInt(dayValue, 10),
            monthNumber,
            Number.parseInt(yearValue, 10),
        );
    }

    const parsedDate = new Date(normalized);
    if (Number.isNaN(parsedDate.getTime())) {
        return false;
    }

    const parsedYear = parsedDate.getFullYear();
    return parsedYear >= 1900 && parsedYear <= 2100;
}

export class ProfileValidationError extends Error {
    fieldErrors: ProfileFieldErrors;

    constructor(fieldErrors: ProfileFieldErrors, message = "Please correct the highlighted fields.") {
        super(message);
        this.name = "ProfileValidationError";
        this.fieldErrors = fieldErrors;
    }
}

export function validateProfileInput(role: ProfileRole, formData: FormData): NormalizedProfileValues {
    const fieldErrors: ProfileFieldErrors = {};

    const fullName = validateTextField(fieldErrors, formData.get("fullName"), {
        field: "fullName",
        label: "Full name",
        maxLength: 120,
    });
    const email = normalizeOptionalEmail(formData.get("email"));
    if (email && !EMAIL_PATTERN.test(email)) {
        setFieldError(fieldErrors, "email", "Enter a valid email address.");
    }

    const registrationNumber = normalizeOptionalRegistration(formData.get("registrationNumber"));
    if (registrationNumber && !REGISTRATION_PATTERN.test(registrationNumber)) {
        setFieldError(fieldErrors, "registrationNumber", "Registration number can only contain letters, numbers, hyphens, and slashes.");
    }

    const department = validateTextField(fieldErrors, formData.get("department"), {
        field: "department",
        label: "Department",
        maxLength: 80,
    });
    const phone = validateTextField(fieldErrors, formData.get("phone"), {
        field: "phone",
        label: "Phone number",
        maxLength: 30,
    });
    if (phone && !isValidPhoneNumber(phone)) {
        setFieldError(fieldErrors, "phone", "Enter a valid phone number.");
    }

    const preferredLanguage = validateTextField(fieldErrors, formData.get("preferredLanguage"), {
        field: "preferredLanguage",
        label: "Preferred language",
        maxLength: 40,
    });
    const timezone = validateTextField(fieldErrors, formData.get("timezone"), {
        field: "timezone",
        label: "Timezone",
        maxLength: 80,
    });
    const bio = validateTextField(fieldErrors, formData.get("bio"), {
        field: "bio",
        label: "Bio",
        maxLength: 1000,
        allowLineBreaks: true,
    });
    const designation = validateTextField(fieldErrors, formData.get("designation"), {
        field: "designation",
        label: "Designation",
        maxLength: 80,
    });
    const expertise = validateTextField(fieldErrors, formData.get("expertise"), {
        field: "expertise",
        label: "Expertise",
        maxLength: 160,
    });
    const examTarget = validateTextField(fieldErrors, formData.get("examTarget"), {
        field: "examTarget",
        label: "Exam target",
        maxLength: 80,
    });
    const caLevel = normalizeOptionalString(formData.get("caLevel"));
    if (role === "STUDENT" && caLevel && !VALID_CA_LEVELS.has(caLevel)) {
        setFieldError(fieldErrors, "caLevel", "Choose a valid CA level.");
    }

    const examTargetMonth = parseStrictOptionalBoundedInt(
        fieldErrors,
        formData.get("examTargetMonth"),
        "examTargetMonth",
        "Attempt month",
        1,
        12,
    );
    const examTargetYear = parseStrictOptionalBoundedInt(
        fieldErrors,
        formData.get("examTargetYear"),
        "examTargetYear",
        "Attempt year",
        2000,
        2100,
    );

    if (role === "STUDENT" && ((examTargetMonth === null) !== (examTargetYear === null))) {
        setFieldError(fieldErrors, "examTargetMonth", "Select both attempt month and attempt year.");
        setFieldError(fieldErrors, "examTargetYear", "Select both attempt month and attempt year.");
    }

    const batch = validateTextField(fieldErrors, formData.get("batch"), {
        field: "batch",
        label: "Batch",
        maxLength: 60,
    });
    const dob = validateTextField(fieldErrors, formData.get("dob"), {
        field: "dob",
        label: "Date of birth",
        maxLength: 40,
    });
    if (dob && !isValidProfileDate(dob)) {
        setFieldError(fieldErrors, "dob", "Enter a valid date.");
    }

    const location = validateTextField(fieldErrors, formData.get("location"), {
        field: "location",
        label: "Location",
        maxLength: 80,
    });
    const firm = validateTextField(fieldErrors, formData.get("firm"), {
        field: "firm",
        label: "Current firm",
        maxLength: 120,
    });
    const firmRole = validateTextField(fieldErrors, formData.get("firmRole"), {
        field: "firmRole",
        label: "Role",
        maxLength: 80,
    });
    const articleshipYear = parseStrictOptionalBoundedInt(
        fieldErrors,
        formData.get("articleshipYear"),
        "articleshipYear",
        "Articleship year",
        0,
        10,
    );
    const articleshipTotal = parseStrictOptionalBoundedInt(
        fieldErrors,
        formData.get("articleshipTotal"),
        "articleshipTotal",
        "Total duration",
        0,
        10,
    );

    if (
        articleshipYear !== null &&
        articleshipTotal !== null &&
        articleshipYear > articleshipTotal
    ) {
        setFieldError(fieldErrors, "articleshipYear", "Articleship year cannot exceed total duration.");
    }

    const rawResumeUrl = validateTextField(fieldErrors, formData.get("resumeUrl"), {
        field: "resumeUrl",
        label: "Resume URL",
        maxLength: 2048,
    });
    const resumeUrl = normalizeExternalUrl(rawResumeUrl);
    if (rawResumeUrl && !resumeUrl) {
        setFieldError(fieldErrors, "resumeUrl", "Enter a valid http:// or https:// URL.");
    }

    if (Object.keys(fieldErrors).length > 0) {
        throw new ProfileValidationError(fieldErrors);
    }

    return {
        fullName,
        email,
        registrationNumber,
        department,
        phone,
        preferredLanguage,
        timezone,
        bio,
        designation,
        expertise,
        examTarget,
        caLevel,
        examTargetMonth,
        examTargetYear,
        isPublicProfile: formData.get("isPublicProfile") === "true",
        batch,
        dob,
        location,
        firm,
        firmRole,
        articleshipYear,
        articleshipTotal,
        foundationCleared: formData.get("foundationCleared") === "true",
        intermediateCleared: formData.get("intermediateCleared") === "true",
        finalCleared: formData.get("finalCleared") === "true",
        resumeUrl,
    };
}
