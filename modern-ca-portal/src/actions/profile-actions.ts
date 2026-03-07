"use server";

import { getCurrentUserOrDemoUser } from "@/lib/auth/session";
import prisma from "@/lib/prisma/client";
import { revalidatePath } from "next/cache";

type ProfileRole = "TEACHER" | "STUDENT";

async function getOrCreateProfile(role: ProfileRole) {
    return getCurrentUserOrDemoUser(role);
}

async function getProfile(role: ProfileRole) {
    const user = await getOrCreateProfile(role);
    return {
        success: true,
        profile: user,
    };
}

async function updateProfile(role: ProfileRole, formData: FormData) {
    try {
        const user = await getOrCreateProfile(role);
        const fullName = String(formData.get("fullName") ?? "").trim();
        const email = String(formData.get("email") ?? "").trim();
        const registrationNumber = String(formData.get("registrationNumber") ?? "").trim();
        const department = String(formData.get("department") ?? "").trim();
        const phone = String(formData.get("phone") ?? "").trim();
        const preferredLanguage = String(formData.get("preferredLanguage") ?? "").trim();
        const timezone = String(formData.get("timezone") ?? "").trim();
        const bio = String(formData.get("bio") ?? "").trim();
        const designation = String(formData.get("designation") ?? "").trim();
        const expertise = String(formData.get("expertise") ?? "").trim();
        const examTarget = String(formData.get("examTarget") ?? "").trim();

        const updatedProfile = await prisma.user.update({
            where: { id: user.id },
            data: {
                fullName: fullName || null,
                email: email || null,
                registrationNumber: registrationNumber || null,
                department: department || null,
                phone: phone || null,
                preferredLanguage: preferredLanguage || null,
                timezone: timezone || null,
                bio: bio || null,
                designation: role === "TEACHER" ? (designation || null) : null,
                expertise: role === "TEACHER" ? (expertise || null) : null,
                examTarget: role === "STUDENT" ? (examTarget || null) : null,
            }
        });

        revalidatePath(role === "TEACHER" ? "/teacher/profile" : "/student/profile");
        return { success: true, profile: updatedProfile };
    } catch (error: unknown) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to update profile."
        };
    }
}

export async function getTeacherProfile() {
    return getProfile("TEACHER");
}

export async function updateTeacherProfile(formData: FormData) {
    return updateProfile("TEACHER", formData);
}

export async function getStudentProfile() {
    return getProfile("STUDENT");
}

export async function updateStudentProfile(formData: FormData) {
    return updateProfile("STUDENT", formData);
}
