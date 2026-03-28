import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        status: "ok",
        service: "ca-exam-portal",
        timestamp: new Date().toISOString(),
    });
}
