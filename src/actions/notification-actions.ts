"use server";

import { getCurrentUser } from "@/lib/auth/session";
import prisma from "@/lib/prisma/client";
import { ActionResponse } from "@/types/shared";
import { revalidatePath } from "next/cache";

export type NotificationRecord = {
    id: string;
    title: string;
    message: string;
    type: string;
    link: string | null;
    isRead: boolean;
    createdAt: Date;
};

export async function getUserNotifications(): Promise<ActionResponse<NotificationRecord[]>> {
    try {
        const user = await getCurrentUser(["STUDENT", "TEACHER", "ADMIN"]);
        if (!user) throw new Error("Unauthorized");
        const notifications = await prisma.notification.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            take: 20,
        });
        return { success: true, data: notifications };
    } catch (error) {
        return { success: false, message: "Failed to fetch notifications" };
    }
}

export async function markNotificationAsRead(id: string): Promise<ActionResponse<void>> {
    try {
        const user = await getCurrentUser(["STUDENT", "TEACHER", "ADMIN"]);
        if (!user) throw new Error("Unauthorized");
        await prisma.notification.update({
            where: { id, userId: user.id },
            data: { isRead: true }
        });
        revalidatePath("/", "layout");
        return { success: true, data: undefined, message: "Marked as read" };
    } catch (error) {
        return { success: false, message: "Failed to mark as read" };
    }
}

export async function markAllNotificationsAsRead(): Promise<ActionResponse<void>> {
    try {
        const user = await getCurrentUser(["STUDENT", "TEACHER", "ADMIN"]);
        if (!user) throw new Error("Unauthorized");
        await prisma.notification.updateMany({
            where: { userId: user.id, isRead: false },
            data: { isRead: true }
        });
        revalidatePath("/", "layout");
        return { success: true, data: undefined, message: "All marked as read" };
    } catch (error) {
        return { success: false, message: "Failed to mark all as read" };
    }
}

export async function createNotification(userId: string, title: string, message: string, type: string = "SYSTEM", link: string | null = null) {
    try {
        await prisma.notification.create({
            data: { userId, title, message, type, link }
        });
    } catch (error) {
        console.error("Failed to create notification", error);
    }
}
