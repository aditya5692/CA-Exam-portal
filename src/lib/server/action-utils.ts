import "server-only";

import prisma from "@/lib/prisma/client";
import { Prisma } from "@prisma/client";
import { ActionResponse } from "@/types/shared";

const SERIALIZABLE_RETRY_CODE = "P2034";
const UNIQUE_CONSTRAINT_CODE = "P2002";
const RECORD_NOT_FOUND_CODE = "P2025";
const TRANSIENT_DATABASE_ERROR_CODES = new Set([
    "ECONNREFUSED",
    "ECONNRESET",
    "ENOTFOUND",
    "ETIMEDOUT",
    "EPIPE",
]);

function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isPrismaKnownError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
    return error instanceof Prisma.PrismaClientKnownRequestError;
}

export function isPrismaCode(error: unknown, code: string): error is Prisma.PrismaClientKnownRequestError {
    return isPrismaKnownError(error) && error.code === code;
}

export function isUniqueConstraintError(error: unknown, target?: string[]) {
    if (!isPrismaCode(error, UNIQUE_CONSTRAINT_CODE)) {
        return false;
    }

    if (!target || target.length === 0) {
        return true;
    }

    const rawTarget = error.meta?.target;
    const normalizedTarget = Array.isArray(rawTarget)
        ? rawTarget.map((value) => String(value))
        : rawTarget
            ? [String(rawTarget)]
            : [];

    return target.every((field) => normalizedTarget.includes(field));
}

export function isRecordNotFoundError(error: unknown) {
    return isPrismaCode(error, RECORD_NOT_FOUND_CODE);
}

function isRetryableTransactionError(error: unknown) {
    return isPrismaCode(error, SERIALIZABLE_RETRY_CODE);
}

function getNodeStyleErrorCode(error: unknown) {
    if (!(error instanceof Error) || !("code" in error)) {
        return null;
    }

    const rawCode = error.code;
    return typeof rawCode === "string" ? rawCode : null;
}

function isTransientDatabaseError(error: unknown) {
    const code = getNodeStyleErrorCode(error);
    return Boolean(code && TRANSIENT_DATABASE_ERROR_CODES.has(code));
}

function isDatabaseConfigurationError(error: unknown) {
    return (
        error instanceof Error &&
        (
            error.message.includes("DATABASE_URL is not configured") ||
            error.message.includes("DATABASE_URL is invalid") ||
            error.message.includes("Unsupported DATABASE_URL protocol") ||
            error.message.includes("PostgreSQL-only")
        )
    );
}

export async function withSerializableTransaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
    maxAttempts = 3,
) {
    let attempt = 0;

    while (true) {
        try {
            return await prisma.$transaction(callback, {
                isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            });
        } catch (error) {
            attempt += 1;

            if (attempt >= maxAttempts || !isRetryableTransactionError(error)) {
                throw error;
            }

            await wait(25 * attempt);
        }
    }
}

export function clampNumber(value: number, min: number, max: number) {
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, value));
}

export function readJsonStringArray(value: Prisma.JsonValue | null | undefined): string[] {
    if (Array.isArray(value)) {
        return value
            .map((item) => (typeof item === "string" ? item.trim() : ""))
            .filter(Boolean);
    }

    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return [];

        try {
            return readJsonStringArray(JSON.parse(trimmed) as Prisma.JsonValue);
        } catch {
            return [trimmed];
        }
    }

    return [];
}

export function getActionErrorMessage(error: unknown, fallbackMessage: string) {
    if (isPrismaCode(error, UNIQUE_CONSTRAINT_CODE)) {
        return "A record with those details already exists.";
    }

    if (isPrismaCode(error, RECORD_NOT_FOUND_CODE)) {
        return "The requested record could not be found.";
    }

    if (
        error instanceof Prisma.PrismaClientInitializationError ||
        error instanceof Prisma.PrismaClientRustPanicError ||
        isPrismaCode(error, "P1001")
    ) {
        return "The database is temporarily unavailable. Please try again.";
    }

    if (isTransientDatabaseError(error)) {
        return "The database connection is temporarily unavailable. Please try again.";
    }

    if (isDatabaseConfigurationError(error)) {
        return "The database configuration is invalid. Please check the server environment.";
    }

    if (error instanceof Error && error.message.trim()) {
        return error.message;
    }

    return fallbackMessage;
}

export async function withErrorHandler<T>(
    action: () => Promise<T>,
    fallbackMessage: string = "An unexpected error occurred."
): Promise<ActionResponse<T>> {
    try {
        const data = await action();
        return { success: true, data };
    } catch (error) {
        console.error("Action Error:", error);
        return { 
            success: false, 
            message: getActionErrorMessage(error, fallbackMessage) 
        };
    }
}
