import "server-only";

import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { mkdir,unlink,writeFile } from "fs/promises";
import { join } from "path";
import { clampNumber } from "./action-utils";

const ALLOWED_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png", "csv", "docx", "pptx", "txt"]);
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB default limit

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
    if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new Error(`File size exceeds the maximum limit of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`);
    }

    const fileExtension = getNormalizedUploadExtension(file.name, fallbackExtension);
    if (!ALLOWED_EXTENSIONS.has(fileExtension)) {
        throw new Error(`File extension .${fileExtension} is not allowed.`);
    }

    // Basic MIME type validation
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    const isCsv = file.type === "text/csv" || file.name.endsWith(".csv");
    const isDoc = file.type.includes("word") || file.type.includes("officedocument");
    
    if (!isImage && !isPdf && !isCsv && !isDoc && file.type !== "text/plain") {
         // If it's none of the above, we should be cautious
         // But we'll allow it if the extension is in our allowlist and not obviously scripty
         if (["html", "js", "sh", "exe", "php"].includes(fileExtension)) {
             throw new Error("Malicious file type detected.");
         }
    }

    // Define base upload path relative to project root
    const projectRoot = process.cwd();
    const uploadBase = join(projectRoot, "public", "uploads");
    
    // Construct the specific target directory
    const uploadDir = subdirectories.length > 0 
        ? join(uploadBase, ...subdirectories) 
        : uploadBase;

    await mkdir(uploadDir, { recursive: true });

    const fileName = `${randomUUID()}.${fileExtension}`;
    const filePath = `${uploadDir}/${fileName}`;
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

    const projectRoot = process.cwd();
    const publicDir = join(projectRoot, "public");
    const filePath = join(publicDir, ...fileUrl.split("/").filter(Boolean));

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
