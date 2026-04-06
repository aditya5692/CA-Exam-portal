"use server";

import { assertUserCanAccessFeature } from "@/lib/auth/feature-access";
import { requireAuth } from "@/lib/auth/session";
import prisma from "@/lib/prisma/client";
import { getActionErrorMessage,withSerializableTransaction } from "@/lib/server/action-utils";
import {
  isAdminUser,
  listManagedEducatorOptions,
  resolveManagedEducatorId,
  type ManagedEducatorOption,
} from "@/lib/server/educator-management";
import { ActionResponse } from "@/types/shared";
import { Prisma } from "@prisma/client";

const MCQ_PRICE_PER_QUESTION = 5;

export async function requireMCQTeacher() {
    return requireAuth(["TEACHER", "ADMIN"]);
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

type MCQExtractionResult = {
    count: number;
    totalCost: number;
    pricePerMCQ: number;
    questions: Array<{ question: string; options: string; answer: string }>;
};

/**
 * Uploads a PDF/file and analyzes it to extract MCQs into a draft state.
 */
export async function analyzePdfForMCQs(formData: FormData): Promise<ActionResponse<MCQExtractionResult>> {
    try {
        const file = formData.get("file") as File | null;
        if (!file || !(file instanceof File)) throw new Error("No file provided.");
        if (file.size <= 0) throw new Error("Uploaded file is empty.");

        const teacher = await requireMCQTeacher();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_QUESTION_BANK", "create");

        const targetTeacherId = isAdminUser(teacher)
            ? await resolveManagedEducatorId(teacher, String(formData.get("ownerId") ?? "").trim() || null, {
                allowAdminFallbackToActor: false,
                missingSelectionMessage: "Select the educator whose draft bank you want to manage.",
            })
            : teacher.id;

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const extractedQuestions = await parseQuestionsFromFileAI(buffer, file.type);
        if (extractedQuestions.length === 0) {
            throw new Error("No draft MCQs could be extracted from the uploaded file.");
        }

        await withSerializableTransaction(async (tx) => {
            await tx.draftMCQ.deleteMany({ where: { teacherId: targetTeacherId } });

            await tx.draftMCQ.createMany({
                data: extractedQuestions.map((question) => ({
                    question: question.question,
                    options: question.options,
                    answer: question.answer,
                    teacherId: targetTeacherId,
                })),
            });
        });

        const totalCost = extractedQuestions.length * MCQ_PRICE_PER_QUESTION;

        return {
            success: true,
            data: {
                count: extractedQuestions.length,
                totalCost,
                pricePerMCQ: MCQ_PRICE_PER_QUESTION,
                questions: extractedQuestions,
            },
            message: `Extracted ${extractedQuestions.length} draft questions.`
        };
    } catch (error: unknown) {
        console.error("analyzePdfForMCQs error:", error);
        return { success: false, message: getActionErrorMessage(error, "Analysis failed.") };
    }
}

type DraftMCQWithTeacher = Prisma.DraftMCQGetPayload<{
    include: { teacher: { select: { id: true, fullName: true, email: true } } }
}>;

type DraftMCQsData = {
    drafts: DraftMCQWithTeacher[];
    totalCost: number;
    pricePerMCQ: number;
    isAdminView: boolean;
    availableEducators: ManagedEducatorOption[];
};

/**
 * Fetches the current teacher's draft MCQs.
 */
export async function getMyDraftMCQs(ownerId?: string): Promise<ActionResponse<DraftMCQsData>> {
    try {
        const teacher = await requireMCQTeacher();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_QUESTION_BANK", "read");

        const isAdminView = isAdminUser(teacher);
        const scopedTeacherId = isAdminView
            ? (ownerId
                ? await resolveManagedEducatorId(teacher, ownerId, {
                    allowAdminFallbackToActor: false,
                    missingSelectionMessage: "Select the educator whose draft bank you want to manage.",
                })
                : null)
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
        }) as DraftMCQWithTeacher[];

        const totalCost = drafts.length * MCQ_PRICE_PER_QUESTION;
        return {
            success: true,
            data: {
                drafts,
                totalCost,
                pricePerMCQ: MCQ_PRICE_PER_QUESTION,
                isAdminView,
                availableEducators: isAdminView ? await listManagedEducatorOptions() : [],
            }
        };
    } catch (error: unknown) {
        console.error("getMyDraftMCQs error:", error);
        return { success: false, message: getActionErrorMessage(error, "Failed to load drafts.") };
    }
}

/**
 * Confirms the draft MCQs and "imports" them (currently just clears them as a final step).
 */
export async function confirmAndImportMCQs(ownerId?: string): Promise<ActionResponse<{ imported: number }>> {
    try {
        const teacher = await getMockTeacher();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_QUESTION_BANK", "share");

        const targetTeacherId = isAdminUser(teacher)
            ? await resolveManagedEducatorId(teacher, ownerId ?? null, {
                allowAdminFallbackToActor: false,
                missingSelectionMessage: "Select the educator whose draft bank you want to manage.",
            })
            : teacher.id;

        const deletedDrafts = await withSerializableTransaction(async (tx) => {
            const drafts = await tx.draftMCQ.findMany({ where: { teacherId: targetTeacherId } });
            if (drafts.length === 0) throw new Error("No draft MCQs to import.");

            await tx.draftMCQ.deleteMany({ where: { teacherId: targetTeacherId } });
            return drafts.length;
        });

        return { success: true, data: { imported: deletedDrafts }, message: "MCQs imported successfully." };
    } catch (error: unknown) {
        console.error("confirmAndImportMCQs error:", error);
        return { success: false, message: getActionErrorMessage(error, "Import failed.") };
    }
}
