import { NextResponse } from "next/server";

/**
 * Health check endpoint for Dokploy / Docker Swarm monitoring.
 * Returns 200 OK when the application is ready to receive traffic.
 */
export async function GET() {
    return NextResponse.json(
        { 
            status: "ok",
            timestamp: new Date().toISOString(),
            env: process.env.NODE_ENV
        },
        { status: 200 }
    );
}
