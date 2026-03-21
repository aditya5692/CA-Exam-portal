export type Question = {
    id: number;
    prompt: string;
    options: string[];
    correct: number[];
    subject?: string;
    topic?: string;
    difficulty?: string;
    type?: string;
    status?: string;
};

export type UploadReport = {
    fileName: string;
    importedCount: number;
    skippedCount: number;
    errors: string[];
    questions: Question[];
};

export const TEMPLATE_COLUMNS = ["prompt", "optionA", "optionB", "optionC", "optionD", "correctAnswers"];

export const QUESTION_BANK_STORAGE_KEY = "teacher-question-bank";
export const BULK_UPLOAD_SESSION_KEY = "teacher-question-bank-bulk-upload";

const normalizeHeader = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]/g, "");

const getCellValue = (row: Record<string, unknown>, aliases: string[]) => {
    const normalizedRow = new Map(
        Object.entries(row).map(([key, value]) => [normalizeHeader(key), String(value ?? "").trim()])
    );

    for (const alias of aliases) {
        const match = normalizedRow.get(alias);
        if (match) {
            return match;
        }
    }

    return "";
};

const parseCorrectAnswers = (value: string, optionCount: number) => {
    const tokens = value
        .split(/[,+;/|]/)
        .map((token) => token.trim().toUpperCase())
        .filter(Boolean);

    const resolved = tokens
        .map((token) => {
            if (/^[A-Z]$/.test(token)) {
                return token.charCodeAt(0) - 65;
            }

            const numeric = Number(token);
            if (Number.isInteger(numeric)) {
                return numeric - 1;
            }

            return Number.NaN;
        })
        .filter((index) => Number.isInteger(index) && index >= 0 && index < optionCount);

    return Array.from(new Set(resolved));
};

export const parseQuestionRows = (rows: Record<string, unknown>[], fileName: string): UploadReport => {
    if (rows.length === 0) {
        throw new Error("The uploaded sheet is empty.");
    }

    const questions: Question[] = [];
    const errors: string[] = [];

    rows.forEach((row, index) => {
        const prompt = getCellValue(row, ["prompt", "question"]);
        const options = [
            getCellValue(row, ["optiona", "option1", "a"]),
            getCellValue(row, ["optionb", "option2", "b"]),
            getCellValue(row, ["optionc", "option3", "c"]),
            getCellValue(row, ["optiond", "option4", "d"]),
        ];
        const correctAnswersRaw = getCellValue(row, ["correctanswers", "correctanswer", "answer", "answers", "correct"]);
        const rowNumber = index + 2;

        if (!prompt) {
            errors.push(`Row ${rowNumber}: prompt is missing.`);
            return;
        }

        if (options.some((option) => !option)) {
            errors.push(`Row ${rowNumber}: all four options are required.`);
            return;
        }

        const correct = parseCorrectAnswers(correctAnswersRaw, options.length);

        if (correct.length === 0) {
            errors.push(`Row ${rowNumber}: correctAnswers must contain A-D or 1-4.`);
            return;
        }

        questions.push({
            id: Date.now() + index,
            prompt,
            options,
            correct,
            subject: getCellValue(row, ["subject"]),
            topic: getCellValue(row, ["topic"]),
            difficulty: getCellValue(row, ["difficulty"]),
            type: getCellValue(row, ["examtype", "type"]) || "Practice",
            status: "Live",
        });
    });

    return {
        fileName,
        importedCount: questions.length,
        skippedCount: errors.length,
        errors,
        questions,
    };
};

export const readStoredQuestionBank = (): Question[] => {
    if (typeof window === "undefined") {
        return [];
    }

    const rawValue = window.localStorage.getItem(QUESTION_BANK_STORAGE_KEY);
    if (!rawValue) {
        return [];
    }

    try {
        const parsed = JSON.parse(rawValue) as Question[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

export const writeStoredQuestionBank = (questions: Question[]) => {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.setItem(QUESTION_BANK_STORAGE_KEY, JSON.stringify(questions));
};

export const writeBulkUploadSession = (report: UploadReport) => {
    if (typeof window === "undefined") {
        return;
    }

    window.sessionStorage.setItem(BULK_UPLOAD_SESSION_KEY, JSON.stringify(report));
};

export const readBulkUploadSession = (): UploadReport | null => {
    if (typeof window === "undefined") {
        return null;
    }

    const rawValue = window.sessionStorage.getItem(BULK_UPLOAD_SESSION_KEY);
    if (!rawValue) {
        return null;
    }

    try {
        return JSON.parse(rawValue) as UploadReport;
    } catch {
        return null;
    }
};

export const clearBulkUploadSession = () => {
    if (typeof window === "undefined") {
        return;
    }

    window.sessionStorage.removeItem(BULK_UPLOAD_SESSION_KEY);
};
