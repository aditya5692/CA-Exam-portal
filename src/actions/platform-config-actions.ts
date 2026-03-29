"use server";

import { getCurrentUserOrDemoUser } from "@/lib/auth/session";
import prisma from "@/lib/prisma/client";
import { getActionErrorMessage } from "@/lib/server/action-utils";
import {
    getResolvedPlatformConfigFields,
    sanitizePlatformConfigInput,
} from "@/lib/server/platform-config";
import { revalidatePlatformConfigSurfaces } from "@/lib/server/revalidation";
import type { ActionResponse } from "@/types/shared";

async function requireAdmin() {
    return getCurrentUserOrDemoUser("ADMIN");
}

export async function savePlatformConfig(formData: FormData): Promise<ActionResponse<void>> {
    try {
        await requireAdmin();

        const values = sanitizePlatformConfigInput({
            msg91AuthKey: formData.get("msg91AuthKey"),
            msg91WidgetId: formData.get("msg91WidgetId"),
            msg91OtpTemplateId: formData.get("msg91OtpTemplateId"),
            msg91TokenAuth: formData.get("msg91TokenAuth"),
            razorpayKeyId: formData.get("razorpayKeyId"),
            razorpayKeySecret: formData.get("razorpayKeySecret"),
            razorpayWebhookSecret: formData.get("razorpayWebhookSecret"),
            razorpayPlanBasic: formData.get("razorpayPlanBasic"),
            razorpayPlanPro: formData.get("razorpayPlanPro"),
        });

        await prisma.platformConfig.upsert({
            where: { singletonKey: "default" },
            update: values,
            create: {
                singletonKey: "default",
                ...values,
            },
        });

        revalidatePlatformConfigSurfaces();
        return { success: true, data: undefined, message: "Platform integrations saved." };
    } catch (error) {
        return {
            success: false,
            message: getActionErrorMessage(error, "Failed to save platform integrations."),
        };
    }
}

export async function getPlatformConfigSnapshot() {
    try {
        await requireAdmin();

        return {
            success: true,
            data: await getResolvedPlatformConfigFields(),
        } as const;
    } catch (error) {
        return {
            success: false,
            message: getActionErrorMessage(error, "Failed to load platform integrations."),
            data: [],
        } as const;
    }
}
