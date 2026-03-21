import "server-only";

import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { mkdir,unlink,writeFile } from "fs/promises";
import { join } from "path";
import { clampNumber } from "./action-utils";

function getNormalizedUploadExtension(fileName: string, fallbackExtension: string) {
    const segments = fileName.trim().split(".");
    const rawExtension = segments.length > 1 ? segments.at(-1) ?? "" : "";
    const normalized = rawExtension.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

    return normalized || fallbackExtension;
}

export async function saveUploadedFile(
    file: File,
    subdirectories: string[],
    fallbackExtension: string,
) {
    const uploadDir = join(process.cwd(), "public", "uploads", ...subdirectories);
    await mkdir(uploadDir, { recursive: true });

    const fileExtension = getNormalizedUploadExtension(file.name, fallbackExtension);
    const fileName = `${randomUUID()}.${fileExtension}`;
    const filePath = join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();

    await writeFile(filePath, Buffer.from(bytes));

    return {
        fileName,
        filePath,
        fileUrl: `/${["uploads", ...subdirectories, fileName].join("/")}`,
    };
}

export async function removeSavedFileByUrl(fileUrl: string | null | undefined) {
    if (!fileUrl?.startsWith("/uploads/")) {
        return;
    }

    const filePath = join(process.cwd(), "public", ...fileUrl.split("/").filter(Boolean));

    try {
        await unlink(filePath);
    } catch (error) {
        const isMissingFileError =
            error instanceof Error &&
            "code" in error &&
            typeof error.code === "string" &&
            error.code === "ENOENT";

        if (!isMissingFileError) {
            console.error("Failed to remove uploaded file:", filePath, error);
        }
    }
}

export async function assertStorageCapacity(
    tx: Prisma.TransactionClient,
    userId: string,
    incomingSize: number,
) {
    const safeIncomingSize = clampNumber(
        Math.round(Number(incomingSize) || 0),
        0,
        Number.MAX_SAFE_INTEGER,
    );

    const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, storageUsed: true, storageLimit: true },
    });

    if (!user) {
        throw new Error("User not found.");
    }

    if (user.storageUsed + safeIncomingSize > user.storageLimit) {
        throw new Error("Storage limit exceeded.");
    }

    return { user, safeIncomingSize };
}

export async function incrementStorageUsed(
    tx: Prisma.TransactionClient,
    userId: string,
    size: number,
) {
    const safeSize = clampNumber(Math.round(Number(size) || 0), 0, Number.MAX_SAFE_INTEGER);
    if (safeSize === 0) {
        return;
    }

    await tx.user.update({
        where: { id: userId },
        data: {
            storageUsed: {
                increment: safeSize,
            },
        },
    });
}

export async function decrementStorageUsed(
    tx: Prisma.TransactionClient,
    userId: string,
    size: number,
) {
    const safeSize = clampNumber(Math.round(Number(size) || 0), 0, Number.MAX_SAFE_INTEGER);
    if (safeSize === 0) {
        return;
    }

    const owner = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, storageUsed: true },
    });

    if (!owner) {
        return;
    }

    await tx.user.update({
        where: { id: owner.id },
        data: {
            storageUsed: Math.max(0, owner.storageUsed - safeSize),
        },
    });
}
