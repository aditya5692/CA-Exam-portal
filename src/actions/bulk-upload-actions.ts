"use server";

import prisma from "@/lib/prisma/client";
import { requireAuth } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import { ActionResponse } from "@/types/shared";

interface BulkUploadResult {
    total: number;
    success: number;
    failed: number;
}

/**
 * Parses an Excel/CSV file and saves MCQs to the teacher's vault.
 * Template format: Question, Option A, Option B, Option C, Option D, Correct Option (A/B/C/D), Explanation, Subject, Topic
 */
export async function bulkUploadMCQs(formData: FormData): Promise<ActionResponse<BulkUploadResult>> {
    try {
        const user = await requireAuth(["TEACHER", "ADMIN"]);
        const file = formData.get("file") as File;
        
        // Retrieval of Sync/Link Context
        const globalSubject = formData.get("subject")?.toString().trim();
        const globalTopic = formData.get("topic")?.toString().trim();
        
        if (!file) {
            return { success: false, message: "No file uploaded." };
        }

        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const data = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (data.length === 0) {
            return { success: false, message: "The uploaded file is empty." };
        }

        let successCount = 0;
        let failedCount = 0;

        for (const row of data) {
            try {
                // Professional Header Normalization (Case-insensitive + Trimmed)
                const findValue = (aliases: string[]) => {
                    const key = Object.keys(row).find(k => 
                        aliases.some(a => k.toLowerCase().trim() === a.toLowerCase())
                    );
                    return key ? row[key]?.toString().trim() : null;
                };

                const chapterNum = findValue(["Chapter Number", "chapter_number", "Chapter", "Ch", "Ch No"]);
                const questionText = findValue(["Question", "question", "Text", "Ques"]);
                const optA = findValue(["Option A", "A"]);
                const optB = findValue(["Option B", "B"]);
                const optC = findValue(["Option C", "C"]);
                const optD = findValue(["Option D", "D"]);
                const correctAnswer = (findValue(["Correct Answer", "Correct Option", "Answer", "Ans"]) || "").toUpperCase();
                const explanation = findValue(["Explanation", "Exp"]);
                
                // Categorization Linkage: UI Global > Excel Row > Default
                const subject = globalSubject || findValue(["Subject", "Sub"]) || "Uncategorized";
                const topic = globalTopic || (chapterNum ? `Chapter ${chapterNum}` : findValue(["Topic", "Topic Name"])) || "General";
                
                const difficulty = (findValue(["Difficulty", "Diff"]) || "MEDIUM").toUpperCase();

                if (!questionText || !optA || !optB || !correctAnswer) {
                    failedCount++;
                    continue;
                }

                const options = [
                    { text: optA, isCorrect: correctAnswer === "A" },
                    { text: optB, isCorrect: correctAnswer === "B" },
                    { text: optC || "", isCorrect: correctAnswer === "C" },
                    { text: optD || "", isCorrect: correctAnswer === "D" },
                ].filter(o => o.text !== "");

                await prisma.question.create({
                    data: {
                        text: questionText,
                        explanation: explanation,
                        subject: subject,
                        topic: topic,
                        difficulty: ["EASY", "MEDIUM", "HARD"].includes(difficulty) ? difficulty : "MEDIUM",
                        teacherId: user.id,
                        options: {
                            create: options
                        }
                    }
                });

                successCount++;
            } catch (err) {
                console.error("Row processing error:", err);
                failedCount++;
            }
        }

        revalidatePath("/teacher/question-bank");
        revalidatePath("/teacher/questions");

        return { 
            success: true, 
            message: `Processed ${data.length} items. Success: ${successCount}, Failed: ${failedCount}`,
            data: {
                total: data.length,
                success: successCount,
                failed: failedCount
            }
        };

    } catch (error) {
        console.error("bulkUploadMCQs error:", error);
        return { success: false, message: "Internal Protocol Failure during upload processing." };
    }
}
