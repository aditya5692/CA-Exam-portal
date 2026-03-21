import "server-only";

import prisma from "@/lib/prisma/client";
import { randomBytes } from "crypto";

export function generateJoinCode(name: string): string {
    const slug = name.toUpperCase().replace(/\s+/g, "-").slice(0, 8) || "BATCH";
    const rand = randomBytes(3).toString("hex").toUpperCase();
    return `${slug}-${rand}`;
}

export function normalizeJoinCode(value: string) {
    return value.trim().toUpperCase();
}

export async function createAvailableBatchJoinCode(name: string, maxAttempts = 8) {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const code = generateJoinCode(name);
        const existing = await prisma.batch.findUnique({
            where: { uniqueJoinCode: code },
            select: { id: true },
        });

        if (!existing) {
            return code;
        }
    }

    throw new Error("Could not generate a unique join code. Please try again.");
}
