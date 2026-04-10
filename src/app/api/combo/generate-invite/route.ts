import { NextResponse } from "next/server";
import prisma from "@/lib/prisma/client";
import { SignJWT } from "jose";

export async function POST(req: Request) {
    try {
        const { masterBatchId, teacherId } = await req.json();

        // Verify ownership
        const master = await prisma.masterBatch.findUnique({
            where: { id: masterBatchId }
        });

        if (!master || master.initiatorTeacherId !== teacherId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
        }

        // Generate invitation token
        // In securely isolated mode we just grant a JWT payload that Teacher B can present back
        const secret = process.env.JWT_SECRET || "default_local_secret";
        const secretKey = new TextEncoder().encode(secret);
        
        const inviteToken = await new SignJWT({ 
            masterBatchId: master.id, 
            type: "TEACHER_B_INVITE" 
        })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("7d")
            .sign(secretKey);

        return NextResponse.json({
            success: true,
            inviteToken,
            inviteLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/teacher/invite?token=${inviteToken}`
        });

    } catch(err) {
        console.error("Generate Invite Error:", err);
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}
