import { getPublicPlatformConfig } from "@/lib/server/platform-config";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    const config = await getPublicPlatformConfig();

    return NextResponse.json({
        msg91WidgetId: config.msg91WidgetId,
        msg91TokenAuth: config.msg91TokenAuth,
        razorpayKeyId: config.razorpayKeyId,
        razorpayPlanBasic: config.razorpayPlanBasic,
        razorpayPlanPro: config.razorpayPlanPro,
        sources: config.sources,
    });
}
