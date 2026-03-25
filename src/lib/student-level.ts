// Refresh: 2026-03-26-v1
export type CaLevelKey = "foundation" | "ipc" | "final";

const STUDENT_ATTEMPT_MONTH_LABELS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
] as const;

const LEVEL_PATTERNS: Array<{ key: CaLevelKey; patterns: string[] }> = [
    {
        key: "foundation",
        patterns: ["foundation"],
    },
    {
        key: "ipc",
        patterns: ["intermediate", "ca inter", "inter", "ipc"],
    },
    {
        key: "final",
        patterns: ["final"],
    },
];

export type StudentExamTargetSource = {
    examTarget?: string | null;
    examTargetLevel?: string | null;
    examTargetMonth?: number | string | null;
    examTargetYear?: number | string | null;
    department?: string | null;
};

type StudentStatusSource = StudentExamTargetSource & {
    foundationCleared?: boolean;
    intermediateCleared?: boolean;
    finalCleared?: boolean;
};

export type ResolvedStudentExamTarget = {
    caLevelKey: CaLevelKey;
    caLevelLabel: string;
    attemptMonth: number | null;
    attemptMonthLabel: string | null;
    attemptYear: number | null;
    cycleLabel: string | null;
    label: string;
    daysToExam: number;
    targetDate: Date | null;
};

function normalizeLevelSource(value: string | null | undefined) {
    return (value ?? "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

export function normalizeStudentCALevel(value: string | null | undefined): CaLevelKey | null {
    const normalizedValue = normalizeLevelSource(value);
    if (!normalizedValue) {
        return null;
    }

    for (const matcher of LEVEL_PATTERNS) {
        if (matcher.patterns.some((pattern) => normalizedValue.includes(pattern))) {
            return matcher.key;
        }
    }

    return null;
}

function detectStudentCALevel(
    examTarget: string | null | undefined,
    department?: string | null | undefined,
) {
    return normalizeStudentCALevel(examTarget) ?? normalizeStudentCALevel(department);
}

export function resolveStudentCALevel(
    examTarget: string | null | undefined,
    department?: string | null | undefined,
): CaLevelKey {
    return detectStudentCALevel(examTarget, department) ?? "final";
}

export function getStudentCACategory(level: CaLevelKey) {
    if (level === "foundation") {
        return "CA Foundation";
    }

    if (level === "ipc") {
        return "CA Intermediate";
    }

    return "CA Final";
}

export function getStudentAttemptMonthOptions() {
    return STUDENT_ATTEMPT_MONTH_LABELS.map((label, index) => ({
        label,
        value: String(index + 1),
    }));
}

export function normalizeStudentAttemptMonth(value: number | string | null | undefined) {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    if (typeof value === "number") {
        if (Number.isInteger(value) && value >= 1 && value <= 12) {
            return value;
        }

        return null;
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
        return null;
    }

    const numericValue = Number.parseInt(trimmedValue, 10);
    if (Number.isInteger(numericValue) && numericValue >= 1 && numericValue <= 12) {
        return numericValue;
    }

    const normalizedValue = trimmedValue.toLowerCase();
    const monthIndex = STUDENT_ATTEMPT_MONTH_LABELS.findIndex((label) =>
        label.toLowerCase() === normalizedValue ||
        normalizedValue.startsWith(label.toLowerCase()),
    );

    return monthIndex >= 0 ? monthIndex + 1 : null;
}

export function normalizeStudentAttemptYear(value: number | string | null | undefined) {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    const numericValue = typeof value === "number"
        ? value
        : Number.parseInt(value.trim(), 10);

    if (!Number.isInteger(numericValue)) {
        return null;
    }

    if (numericValue >= 2000 && numericValue <= 2100) {
        return numericValue;
    }

    if (numericValue >= 0 && numericValue <= 99) {
        return 2000 + numericValue;
    }

    return null;
}

function parseLegacyStudentAttemptCycle(value: string | null | undefined) {
    const trimmedValue = (value ?? "").trim();
    if (!trimmedValue) {
        return { month: null, year: null };
    }

    const parts = trimmedValue.split(/\s+/);
    if (parts.length < 2) {
        return { month: null, year: null };
    }

    const month = normalizeStudentAttemptMonth(parts[parts.length - 2]);
    const year = normalizeStudentAttemptYear(parts[parts.length - 1]);

    if (month === null || year === null) {
        return { month: null, year: null };
    }

    return { month, year };
}

function getStudentAttemptMonthLabel(month: number | null) {
    if (month === null) {
        return null;
    }

    return STUDENT_ATTEMPT_MONTH_LABELS[month - 1] ?? null;
}

function getStudentAttemptCycleLabel(month: number | null, year: number | null) {
    const monthLabel = getStudentAttemptMonthLabel(month);
    if (!monthLabel || year === null) {
        return null;
    }

    return `${monthLabel} ${year}`;
}

function getStudentTargetDate(month: number | null, year: number | null) {
    if (month === null || year === null) {
        return null;
    }

    return new Date(year, month - 1, 1);
}

function getStudentDaysToExam(targetDate: Date | null) {
    if (!targetDate) {
        return 0;
    }

    const diffTime = targetDate.getTime() - Date.now();
    return Math.max(0, Math.ceil(diffTime / 86_400_000));
}

export function buildStudentExamTargetLabel(
    level: CaLevelKey,
    month?: number | null,
    year?: number | null,
) {
    const baseLabel = getStudentCACategory(level);
    const cycleLabel = getStudentAttemptCycleLabel(month ?? null, year ?? null);

    return cycleLabel ? `${baseLabel} ${cycleLabel}` : baseLabel;
}

export function resolveStudentExamTarget(source: StudentExamTargetSource): ResolvedStudentExamTarget {
    const explicitLevel = normalizeStudentCALevel(source.examTargetLevel);
    const parsedLegacyLevel = detectStudentCALevel(source.examTarget, source.department);
    const caLevelKey = explicitLevel ?? parsedLegacyLevel ?? "final";

    const legacyCycle = parseLegacyStudentAttemptCycle(source.examTarget);
    const attemptMonth = normalizeStudentAttemptMonth(source.examTargetMonth) ?? legacyCycle.month;
    const attemptYear = normalizeStudentAttemptYear(source.examTargetYear) ?? legacyCycle.year;
    const cycleLabel = getStudentAttemptCycleLabel(attemptMonth, attemptYear);
    const targetDate = getStudentTargetDate(attemptMonth, attemptYear);

    return {
        caLevelKey,
        caLevelLabel: getStudentCACategory(caLevelKey),
        attemptMonth,
        attemptMonthLabel: getStudentAttemptMonthLabel(attemptMonth),
        attemptYear,
        cycleLabel,
        label: buildStudentExamTargetLabel(caLevelKey, attemptMonth, attemptYear),
        daysToExam: getStudentDaysToExam(targetDate),
        targetDate,
    };
}

export function normalizeStudentExamTargetInput(
    source: StudentExamTargetSource & {
        caLevel?: string | null;
    },
) {
    const explicitLevel = normalizeStudentCALevel(source.caLevel) ?? normalizeStudentCALevel(source.examTargetLevel);
    const legacyLevel = detectStudentCALevel(source.examTarget, source.department);
    const resolvedTarget = resolveStudentExamTarget({
        examTarget: source.examTarget,
        examTargetLevel: explicitLevel ?? legacyLevel,
        examTargetMonth: source.examTargetMonth,
        examTargetYear: source.examTargetYear,
        department: source.department,
    });

    return {
        examTarget: resolvedTarget.label,
        examTargetLevel: explicitLevel ?? legacyLevel ?? resolvedTarget.caLevelKey,
        examTargetMonth: resolvedTarget.attemptMonth,
        examTargetYear: resolvedTarget.attemptYear,
        resolvedTarget,
    };
}

export function getStudentStatusLabel(source: StudentStatusSource) {
    if (source.finalCleared) {
        return "Qualified CA";
    }

    if (source.intermediateCleared) {
        return "CA Final Student";
    }

    if (source.foundationCleared) {
        return "CA Intermediate Student";
    }

    const hasAcademicContext = Boolean(
        normalizeLevelSource(source.examTarget) ||
        normalizeLevelSource(source.department) ||
        normalizeLevelSource(source.examTargetLevel) ||
        normalizeStudentAttemptMonth(source.examTargetMonth) ||
        normalizeStudentAttemptYear(source.examTargetYear),
    );

    if (!hasAcademicContext) {
        return "Student";
    }

    const level = resolveStudentExamTarget(source).caLevelKey;

    if (level === "foundation") {
        return "CA Foundation Student";
    }

    if (level === "ipc") {
        return "CA Intermediate Student";
    }

    return "CA Final Student";
}
