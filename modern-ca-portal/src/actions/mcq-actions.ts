"use server";

import { getCurrentUserOrDemoUser } from "@/lib/auth/session";
import { assertUserCanAccessFeature } from "@/lib/auth/feature-access";
import prisma from "@/lib/prisma/client";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const MCQ_PRICE_PER_QUESTION = 5;

async function getMockTeacher() {
    return getCurrentUserOrDemoUser("TEACHER", ["TEACHER", "ADMIN"]);
}

function isAdminUser(user: { role: string }) {
    return user.role === "ADMIN";
}

async function getAvailableEducators() {
    return prisma.user.findMany({
        where: {
            role: {
                in: ["TEACHER", "ADMIN"],
            },
        },
        select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
        },
        orderBy: [
            { fullName: "asc" },
            { email: "asc" },
        ],
    });
}

async function resolveManagedTeacherId(actor: { id: string; role: string }, requestedTeacherId: string | null) {
    if (!isAdminUser(actor)) {
        return actor.id;
    }

    if (!requestedTeacherId) {
        throw new Error("Select the educator whose draft bank you want to manage.");
    }

    const educator = await prisma.user.findFirst({
        where: {
            id: requestedTeacherId,
            role: {
                in: ["TEACHER", "ADMIN"],
            },
        },
        select: { id: true },
    });

    if (!educator) {
        throw new Error("Selected educator was not found.");
    }

    return educator.id;
}

async function parseQuestionsFromFileAI(
    fileBuffer: Buffer,
    fileType: string,
): Promise<Array<{ question: string; options: string; answer: string }>> {
    console.log(`[Mock AI] Parsing file of type: ${fileType} (${fileBuffer.byteLength} bytes)`);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return [
        { question: "Which section deals with tax audit under Income Tax Act?", options: JSON.stringify(["Section 42", "Section 44AB", "Section 80C", "Section 10"]), answer: "Section 44AB" },
        { question: "What is the full form of ICAI?", options: JSON.stringify(["Indian Council of Accountants India", "Institute of Chartered Accountants of India", "Indian Chartered Audit Institution", "None of the above"]), answer: "Institute of Chartered Accountants of India" },
        { question: "Under GST, CGST is levied by:", options: JSON.stringify(["State Government", "Central Government", "Local Authority", "Both A and B"]), answer: "Central Government" },
        { question: "The concept of 'Matching Principle' belongs to:", options: JSON.stringify(["Accrual Basis", "Cash Basis", "Fund Flow", "None"]), answer: "Accrual Basis" },
        { question: "A Partnership firm can have a maximum of how many partners?", options: JSON.stringify(["20", "50", "100", "Unlimited"]), answer: "50" },
    ];
}

export async function analyzePdfForMCQs(formData: FormData) {
    try {
        const file = formData.get("file") as File | null;
        if (!file) throw new Error("No file provided.");

        const teacher = await getMockTeacher();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_QUESTION_BANK", "create");

        const targetTeacherId = isAdminUser(teacher)
            ? await resolveManagedTeacherId(teacher, String(formData.get("ownerId") ?? "").trim() || null)
            : teacher.id;

        const uploadDir = join(process.cwd(), "public", "uploads", "mcq_drafts");
        await mkdir(uploadDir, { recursive: true }).catch(() => { });
        const fileName = `${randomUUID()}.${file.name.split(".").pop()}`;
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(join(uploadDir, fileName), buffer);

        const extractedQuestions = await parseQuestionsFromFileAI(buffer, file.type);

        await prisma.draftMCQ.deleteMany({ where: { teacherId: targetTeacherId } });

        await prisma.draftMCQ.createMany({
            data: extractedQuestions.map((question) => ({
                question: question.question,
                options: question.options,
                answer: question.answer,
                teacherId: targetTeacherId,
            })),
        });

        const totalCost = extractedQuestions.length * MCQ_PRICE_PER_QUESTION;

        return {
            success: true,
            count: extractedQuestions.length,
            totalCost,
            pricePerMCQ: MCQ_PRICE_PER_QUESTION,
            questions: extractedQuestions,
        };
    } catch (error: unknown) {
        return { success: false, message: error instanceof Error ? error.message : "Analysis failed." };
    }
}

export async function getMyDraftMCQs(ownerId?: string) {
    try {
        const teacher = await getMockTeacher();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_QUESTION_BANK", "read");

        const isAdminView = isAdminUser(teacher);
        const scopedTeacherId = isAdminView
            ? (ownerId ? await resolveManagedTeacherId(teacher, ownerId) : null)
            : teacher.id;

        const drafts = await prisma.draftMCQ.findMany({
            where: scopedTeacherId ? { teacherId: scopedTeacherId } : undefined,
            include: {
                teacher: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        const totalCost = drafts.length * MCQ_PRICE_PER_QUESTION;
        return {
            success: true,
            drafts,
            totalCost,
            pricePerMCQ: MCQ_PRICE_PER_QUESTION,
            isAdminView,
            availableEducators: isAdminView ? await getAvailableEducators() : [],
        };
    } catch (error: unknown) {
        return { success: false, message: error instanceof Error ? error.message : "Failed to load drafts." };
    }
}

export async function confirmAndImportMCQs(ownerId?: string) {
    try {
        const teacher = await getMockTeacher();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_QUESTION_BANK", "share");

        const targetTeacherId = isAdminUser(teacher)
            ? await resolveManagedTeacherId(teacher, ownerId ?? null)
            : teacher.id;

        const drafts = await prisma.draftMCQ.findMany({ where: { teacherId: targetTeacherId } });
        if (drafts.length === 0) throw new Error("No draft MCQs to import.");

        await prisma.draftMCQ.deleteMany({ where: { teacherId: targetTeacherId } });

        return { success: true, imported: drafts.length };
    } catch (error: unknown) {
        return { success: false, message: error instanceof Error ? error.message : "Import failed." };
    }
}
