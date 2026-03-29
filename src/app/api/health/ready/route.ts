import prisma from "@/lib/prisma/client";
import { getResolvedPlatformConfig } from "@/lib/server/platform-config";
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
    const resolvedPlatformConfig = await getResolvedPlatformConfig();

    const requiredConfig = {
        jwt: Boolean(process.env.JWT_SECRET),
        msg91AuthKey: Boolean(resolvedPlatformConfig.values.msg91AuthKey),
        msg91OtpTemplateId: Boolean(resolvedPlatformConfig.values.msg91OtpTemplateId),
        msg91WidgetId: Boolean(resolvedPlatformConfig.values.msg91WidgetId),
        msg91TokenAuth: Boolean(resolvedPlatformConfig.values.msg91TokenAuth),
        razorpayKeyId: Boolean(resolvedPlatformConfig.values.razorpayKeyId),
        razorpayKeySecret: Boolean(resolvedPlatformConfig.values.razorpayKeySecret),
        razorpayWebhookSecret: Boolean(resolvedPlatformConfig.values.razorpayWebhookSecret),
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

    const missingConfig = Object.entries(requiredConfig)
        .filter(([, present]) => !present)
        .map(([name]) => name);

    const ok =
        missingConfig.length === 0 &&
        databaseProbe.ok &&
        externalProbes.every((probe) => probe.ok);

    return NextResponse.json(
        {
            status: ok ? "ready" : "degraded",
            checks: {
                config: requiredConfig,
                configSources: resolvedPlatformConfig.sources,
                database: databaseProbe,
                external: externalProbes,
            },
            missingConfig,
            timestamp: new Date().toISOString(),
        },
        { status: ok ? 200 : 503 },
    );
}
