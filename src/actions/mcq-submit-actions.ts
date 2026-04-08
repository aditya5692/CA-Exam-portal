"use server";

import prisma from "@/lib/prisma/client";

export async function submitMcqAttempt(data: {
    studentId: string;
    mcqId: string;
    isCorrect: boolean;
    renderTimeMs: number;
    submitTimeMs: number;
    gapTag?: string;
}) {
    // 1. Calculate time taken
    const timeTakenSeconds = Math.max(1, Math.round((data.submitTimeMs - data.renderTimeMs) / 1000));

    // 2. Log Activity
    await prisma.studentActivityLog.create({
        data: {
            studentId: data.studentId,
            mcqId: data.mcqId,
            isCorrect: data.isCorrect,
            timeTakenSeconds: timeTakenSeconds,
            gapTag: data.gapTag || null,
        }
    });

    // 3. Re-calculate platform average time for this MCQ
    const mcq = await prisma.globalMCQBank.findUnique({ where: { id: data.mcqId }});
    if (mcq) {
        const newTotalAttempts = mcq.totalAttempts + 1;
        // Running average formula: (oldAvg * oldTotal + newValue) / newTotal
        const newPlatformAvg = ((mcq.platformAvgTime * mcq.totalAttempts) + timeTakenSeconds) / newTotalAttempts;

        await prisma.globalMCQBank.update({
            where: { id: data.mcqId },
            data: {
                totalAttempts: newTotalAttempts,
                platformAvgTime: newPlatformAvg,
            }
        });

        // 4. Calculate Percentile bracket or result 
        const difference = newPlatformAvg - timeTakenSeconds;
        let speedString = "You are right on track!";
        if (difference >= 5) {
             speedString = `You are in the top 20% speed bracket!`;
        } else if (difference <= -5) {
             speedString = `You were slower than average, keep practicing!`;
        }
        
        return {
            success: true,
            isCorrect: data.isCorrect,
            timeTakenSeconds,
            platformAvgTime: Math.round(newPlatformAvg),
            message: data.isCorrect 
                ? `Correct! You took ${timeTakenSeconds}s. The passing average is ${Math.round(newPlatformAvg)}s. ${speedString}`
                : `Incorrect. You took ${timeTakenSeconds}s. The average is ${Math.round(newPlatformAvg)}s.`
        };
    }
    
    return { success: false, error: "MCQ not found" };
}
