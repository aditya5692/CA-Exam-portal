"use server";

import { getCurrentUserOrDemoUser } from "@/lib/auth/session";
import { assertUserCanAccessFeature } from "@/lib/auth/feature-access";
import prisma from "@/lib/prisma/client";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { ActionResponse } from "@/types/shared";

type ProfileRole = "TEACHER" | "STUDENT";

async function getOrCreateProfile(role: ProfileRole) {
    return getCurrentUserOrDemoUser(role, [role, "ADMIN"]);
}

export type UserProfile = Prisma.UserGetPayload<{}>;

async function getProfile(role: ProfileRole): Promise<ActionResponse<UserProfile>> {
    try {
        const user = await getOrCreateProfile(role);
        await assertUserCanAccessFeature(user.id, role === "TEACHER" ? "TEACHER_PROFILE" : "STUDENT_PROFILE", "read");
        return {
            success: true,
            data: user,
        };
    } catch (error) {
        console.error(`getProfile (${role}) failed:`, error);
        return { success: false, message: "Failed to fetch profile." };
    }
}

async function updateProfile(role: ProfileRole, formData: FormData): Promise<ActionResponse<UserProfile>> {
    try {
        const user = await getOrCreateProfile(role);
        await assertUserCanAccessFeature(user.id, role === "TEACHER" ? "TEACHER_PROFILE" : "STUDENT_PROFILE", "update");

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
        const isPublicProfile = formData.get("isPublicProfile") === "true";

        // New fields
        const batch = String(formData.get("batch") ?? "").trim();
        const dob = String(formData.get("dob") ?? "").trim();
        const location = String(formData.get("location") ?? "").trim();
        const firm = String(formData.get("firm") ?? "").trim();
        const firmRole = String(formData.get("firmRole") ?? "").trim();
        const articleshipYearInput = String(formData.get("articleshipYear") ?? "0");
        const articleshipTotalInput = String(formData.get("articleshipTotal") ?? "0");
        
        const articleshipYear = parseInt(articleshipYearInput);
        const articleshipTotal = parseInt(articleshipTotalInput);
        
        const foundationCleared = formData.get("foundationCleared") === "true";
        const intermediateCleared = formData.get("intermediateCleared") === "true";
        const finalCleared = formData.get("finalCleared") === "true";
        const resumeUrl = String(formData.get("resumeUrl") ?? "").trim();

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
                isPublicProfile: role === "TEACHER" ? isPublicProfile : true,
                // New fields sync
                batch: batch || null,
                dob: dob || null,
                location: location || null,
                firm: firm || null,
                firmRole: firmRole || null,
                articleshipYear: isNaN(articleshipYear) ? null : articleshipYear,
                articleshipTotal: isNaN(articleshipTotal) ? null : articleshipTotal,
                foundationCleared,
                intermediateCleared,
                finalCleared,
                resumeUrl: resumeUrl || null,
            } as any
        });

        if (role === "STUDENT") {
            revalidatePath("/");
            revalidatePath("/student", "layout");
            revalidatePath("/student/dashboard");
            revalidatePath("/student/exams");
            revalidatePath("/student/profile");
            revalidatePath("/student/history");
            revalidatePath("/student/analytics");
        } else {
            revalidatePath("/teacher", "layout");
            revalidatePath("/teacher/profile");
        }
        return { success: true, data: updatedProfile };
    } catch (error: unknown) {
        console.error(`updateProfile (${role}) failed:`, error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to update profile."
        };
    }
}

export async function getTeacherProfile(): Promise<ActionResponse<UserProfile>> {
    return getProfile("TEACHER");
}

export async function updateTeacherProfile(formData: FormData): Promise<ActionResponse<UserProfile>> {
    return updateProfile("TEACHER", formData);
}

export async function getStudentProfile(): Promise<ActionResponse<UserProfile>> {
    return getProfile("STUDENT");
}

export async function updateStudentProfile(formData: FormData): Promise<ActionResponse<UserProfile>> {
    return updateProfile("STUDENT", formData);
}
