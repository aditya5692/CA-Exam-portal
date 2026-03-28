import prisma from "@/lib/prisma/client";
import { NextResponse } from "next/server";

type ProbeResult = {
    name: string;
    ok: boolean;
    status?: number;
    message?: string;
};

async function probeUrl(name: string, url: string): Promise<ProbeResult> {
    try {
        const response = await fetch(url, {
            method: "HEAD",
            cache: "no-store",
            signal: AbortSignal.timeout(4000),
        });

        return {
            name,
            ok: true,
            status: response.status,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
            name,
            ok: false,
            message,
        };
    }
}

export async function GET() {
    const requiredEnv = {
        jwt: Boolean(process.env.JWT_SECRET),
        msg91AuthKey: Boolean(process.env.MSG91_AUTH_KEY),
        msg91WidgetId: Boolean(process.env.NEXT_PUBLIC_MSG91_WIDGET_ID),
        razorpayKeyId: Boolean(process.env.RAZORPAY_KEY_ID),
        razorpayKeySecret: Boolean(process.env.RAZORPAY_KEY_SECRET),
        razorpayWebhookSecret: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET),
    };

    const databaseProbe: ProbeResult = {
        name: "database",
        ok: false,
    };

    try {
        await prisma.$queryRawUnsafe("SELECT 1");
        databaseProbe.ok = true;
    } catch (error) {
        databaseProbe.message = error instanceof Error ? error.message : String(error);
    }

    const externalProbes = await Promise.all([
        probeUrl("msg91", "https://api.msg91.com"),
        probeUrl("razorpay", "https://api.razorpay.com"),
    ]);

    const missingEnv = Object.entries(requiredEnv)
        .filter(([, present]) => !present)
        .map(([name]) => name);

    const ok =
        missingEnv.length === 0 &&
        databaseProbe.ok &&
        externalProbes.every((probe) => probe.ok);

    return NextResponse.json(
        {
            status: ok ? "ready" : "degraded",
            checks: {
                env: requiredEnv,
                database: databaseProbe,
                external: externalProbes,
            },
            missingEnv,
            timestamp: new Date().toISOString(),
        },
        { status: ok ? 200 : 503 },
    );
}
