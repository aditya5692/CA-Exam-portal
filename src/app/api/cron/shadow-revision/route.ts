import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const today = new Date();
    
    // Calculate dates exactly
    const t3Date = new Date(today);
    t3Date.setDate(t3Date.getDate() - 3);

    const t10Date = new Date(today);
    t10Date.setDate(t10Date.getDate() - 10);

    const t30Date = new Date(today);
    t30Date.setDate(t30Date.getDate() - 30);

    // Helper function to process queues for a specific shadow day span
    const processShadowRevision = async (targetDate: Date, shadowType: 'T+3' | 'T+10' | 'T+30', count: number) => {
        // Find markers exactly matching the days diff
        // In a real prod environment we'd use DB triggers or exact range bounds
        const markers = await prisma.chapterCompletionMarker.findMany({
            where: {
                markedCompleteAt: {
                    gte: new Date(targetDate.setHours(0, 0, 0, 0)),
                    lt: new Date(targetDate.setHours(23, 59, 59, 999))
                }
            }
        });

        for (const marker of markers) {
            // Find batch to get subject
            const batch = await prisma.batch.findUnique({ where: { id: marker.batchId }});
            if (!batch?.subjectId) continue;

            // Fetch specific MCQs from GlobalMCQBank
            // Strategy heavily prefers ICAI category A
            let questions = await prisma.globalMCQBank.findMany({
                where: {
                    subjectId: batch.subjectId,
                    icaiCategory: "A"
                },
                take: count,
            });

            // If we lack "A" category, pad with others
            if (questions.length < count) {
                 const remaining = count - questions.length;
                 const extra = await prisma.globalMCQBank.findMany({
                    where: {
                        subjectId: batch.subjectId,
                        icaiCategory: { not: "A" }
                    },
                    take: remaining,
                 });
                 questions = [...questions, ...extra];
            }

            // Create target queues
            for (const q of questions) {
                await prisma.dailyTargetQueue.create({
                    data: {
                        studentId: marker.studentId,
                        mcqId: q.id,
                        targetedForDate: new Date(),
                        priority: shadowType === 'T+30' ? "HIGH" : "NORMAL",
                        reason: `Shadow Revision ${shadowType}`
                    }
                });
            }
        }
    };

    // T+3 -> 5 random
    await processShadowRevision(t3Date, 'T+3', 5);
    
    // T+10 -> 3 Hard (Assuming we had difficulty, but lacking difficulty let's just pick 3)
    await processShadowRevision(t10Date, 'T+10', 3);
    
    // T+30 -> 1 Case study
    await processShadowRevision(t30Date, 'T+30', 1);

    return NextResponse.json({ success: true, message: "Shadow Revision Engine Processed successfully" });

  } catch (error) {
    console.error("Shadow Engine Error:", error);
    return NextResponse.json({ success: false, error: "Internal Error" }, { status: 500 });
  }
}
