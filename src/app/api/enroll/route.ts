import { NextResponse } from "next/server";
import prisma from "@/lib/prisma/client";

export async function POST(req: Request) {
    try {
        const { studentId, codeString } = await req.json();

        // 1. Validate Access Code
        const accessCode = await prisma.accessCode.findUnique({
            where: { codeString }
        });

        if (!accessCode || (accessCode.expiresAt && new Date() > accessCode.expiresAt)) {
             return NextResponse.json({ success: false, error: "Invalid or expired access code" }, { status: 400 });
        }

        if (accessCode.usedCount >= accessCode.usageLimit) {
             return NextResponse.json({ success: false, error: "Access code usage limit reached" }, { status: 400 });
        }

        // 2. Parse payload array
        let batchIds: string[] = [];
        if (Array.isArray(accessCode.payload)) {
             batchIds = accessCode.payload as string[];
        } else {
             batchIds = JSON.parse(accessCode.payload as string);
        }

        // 3. Database Transaction: Enroll and Increment Usage
        await prisma.$transaction(async (tx) => {
            // Enroll in all children
            for (const bId of batchIds) {
                 await tx.enrollment.upsert({
                     where: {
                         studentId_batchId: { studentId, batchId: bId }
                     },
                     update: { status: "ACTIVE" },
                     create: { studentId, batchId: bId, status: "ACTIVE" }
                 });
            }

            // Mark access code usage
             await tx.accessCode.update({
                 where: { id: accessCode.id },
                 data: { usedCount: { increment: 1 } }
             });
        });

        return NextResponse.json({ success: true, message: "Enrolled in hierarchical batches successfully!" });

    } catch(err) {
        console.error(err);
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}
