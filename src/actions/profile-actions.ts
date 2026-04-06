"use server";

import { assertUserCanAccessFeature } from "@/lib/auth/feature-access";
import { requireAuth, syncCurrentAuthSession } from "@/lib/auth/session";
import prisma from "@/lib/prisma/client";
import { normalizeStudentExamTargetInput } from "@/lib/student-level";
import { getActionErrorMessage } from "@/lib/server/action-utils";
import { joinStudentToBatchByCode } from "@/lib/server/batch-management";
import { revalidateProfileSurfaces } from "@/lib/server/revalidation";
import type { UserProfile } from "@/types/profile";
import { ActionResponse } from "@/types/shared";
import type { Prisma } from "@prisma/client";
import { profileSchema } from "@/lib/validations/profile-schemas";

export type ProfileRole = "TEACHER" | "STUDENT";


async function getProfile(role: ProfileRole): Promise<ActionResponse<UserProfile>> {
    try {
        const user = await requireAuth([role, "ADMIN"]);
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
        const user = await requireAuth([role, "ADMIN"]);
        await assertUserCanAccessFeature(user.id, role === "TEACHER" ? "TEACHER_PROFILE" : "STUDENT_PROFILE", "update");

        const rawData = Object.fromEntries(formData.entries());
        const validated = profileSchema.safeParse(rawData);
        
        if (!validated.success) {
            return { success: false, message: validated.error.issues[0].message };
        }

        const validatedInput = validated.data;

        const normalizedExamTarget = role === "STUDENT"
            ? normalizeStudentExamTargetInput({
                examTarget: validatedInput.examTarget ?? null,
                caLevel: validatedInput.caLevel ?? null,
                examTargetMonth: validatedInput.examTargetMonth ?? null,
                examTargetYear: validatedInput.examTargetYear ?? null,
                department: validatedInput.department ?? null,
            })
            : null;

        if (validatedInput.email) {
            const duplicateEmail = await prisma.user.findFirst({
                where: {
                    email: validatedInput.email,
                    id: { not: user.id },
                },
                select: { id: true },
            });

            if (duplicateEmail) {
                return { success: false, message: "A profile with this email already exists." };
            }
        }

        const data: Prisma.UserUpdateInput = {
            fullName: validatedInput.fullName,
            email: validatedInput.email || null,
            registrationNumber: validatedInput.registrationNumber || null,
            department: validatedInput.department || null,
            phone: validatedInput.phone || null,
            preferredLanguage: validatedInput.preferredLanguage || null,
            timezone: validatedInput.timezone || null,
            bio: validatedInput.bio || null,
            designation: role === "TEACHER" ? (validatedInput.designation || null) : null,
            expertise: role === "TEACHER" ? (validatedInput.expertise || null) : null,
            examTarget: role === "STUDENT" ? (normalizedExamTarget?.examTarget ?? null) : null,
            examTargetLevel: role === "STUDENT" ? (normalizedExamTarget?.examTargetLevel ?? null) : null,
            examTargetMonth: role === "STUDENT" ? (normalizedExamTarget?.examTargetMonth ?? null) : null,
            examTargetYear: role === "STUDENT" ? (normalizedExamTarget?.examTargetYear ?? null) : null,
            isPublicProfile: role === "TEACHER" ? validatedInput.isPublicProfile : true,
            batch: validatedInput.batch || null,
            dob: validatedInput.dob || null,
            location: validatedInput.location || null,
            firm: validatedInput.firm || null,
            firmRole: validatedInput.firmRole || null,
            articleshipYear: validatedInput.articleshipYear ?? null,
            articleshipTotal: validatedInput.articleshipTotal ?? null,
            foundationCleared: validatedInput.foundationCleared,
            intermediateCleared: validatedInput.intermediateCleared,
            finalCleared: validatedInput.finalCleared,
            resumeUrl: validatedInput.resumeUrl || null,
        };

        const updatedProfile = await prisma.user.update({
            where: { id: user.id },
            data,
        });

        // Sync Batch Enrollment: If a student updates their batch, ensure they are enrolled to see content
        if (role === "STUDENT" && validatedInput.batch) {
            try {
                // Ensure the student is enrolled in the batch to see updates and materials
                await joinStudentToBatchByCode(updatedProfile.id, validatedInput.batch.trim().toUpperCase());
            } catch (enrollmentError) {
                // Ignore "Already enrolled" errors during profile sync to prevent save failure
                const errorMessage = enrollmentError instanceof Error ? enrollmentError.message : "";
                if (!errorMessage.toLowerCase().includes("already enrolled")) {
                   console.error("Selective enrollment failure during profile update:", enrollmentError);
                }
            }
        }

        await syncCurrentAuthSession(updatedProfile);
        revalidateProfileSurfaces(role);
        return { success: true, data: updatedProfile };
    } catch (error: any) {
        console.error(`updateProfile (${role}) failed:`, error);
        return {
            success: false,
            message: getActionErrorMessage(error, "Failed to update profile.")
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
