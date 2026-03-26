"use server";

import { assertUserCanAccessFeature } from "@/lib/auth/feature-access";
import { getCurrentUserOrDemoUser,syncCurrentAuthSession } from "@/lib/auth/session";
import {
    ProfileValidationError,
    type ProfileRole,
    validateProfileInput,
} from "@/lib/profile-validation";
import prisma from "@/lib/prisma/client";
import { normalizeStudentExamTargetInput } from "@/lib/student-level";
import { getActionErrorMessage } from "@/lib/server/action-utils";
import { joinStudentToBatchByCode } from "@/lib/server/batch-management";
import { revalidateProfileSurfaces } from "@/lib/server/revalidation";
import type { UserProfile } from "@/types/profile";
import { ActionResponse } from "@/types/shared";
import type { Prisma } from "@prisma/client";

async function getOrCreateProfile(role: ProfileRole) {
    return getCurrentUserOrDemoUser(role, [role, "ADMIN"]);
}

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

        const validatedInput = validateProfileInput(role, formData);
        const normalizedExamTarget = role === "STUDENT"
            ? normalizeStudentExamTargetInput({
                examTarget: validatedInput.examTarget,
                caLevel: validatedInput.caLevel,
                examTargetMonth: validatedInput.examTargetMonth,
                examTargetYear: validatedInput.examTargetYear,
                department: validatedInput.department,
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
                throw new ProfileValidationError({
                    email: "A profile with this email already exists.",
                });
            }
        }

        if (validatedInput.registrationNumber) {
            const duplicateRegistration = await prisma.user.findFirst({
                where: {
                    registrationNumber: validatedInput.registrationNumber,
                    id: { not: user.id },
                },
                select: { id: true },
            });

            if (duplicateRegistration) {
                throw new ProfileValidationError({
                    registrationNumber: "A profile with this registration number already exists.",
                });
            }
        }

        if (validatedInput.phone) {
            const duplicatePhone = await prisma.user.findFirst({
                where: {
                    phone: validatedInput.phone,
                    id: { not: user.id },
                },
                select: { id: true },
            });

            if (duplicatePhone) {
                throw new ProfileValidationError({
                    phone: "A profile with this phone number already exists.",
                });
            }
        }

        if (role === "STUDENT" && validatedInput.batch) {
            const batchExists = await prisma.batch.findUnique({
                where: { uniqueJoinCode: validatedInput.batch.trim().toUpperCase() },
                select: { id: true },
            });

            if (!batchExists) {
                throw new ProfileValidationError({
                    batch: "The provided batch code is invalid. Please verify and try again.",
                });
            }
        }

        const data: Prisma.UserUpdateInput = {
            fullName: validatedInput.fullName,
            email: validatedInput.email,
            registrationNumber: validatedInput.registrationNumber,
            department: validatedInput.department,
            phone: validatedInput.phone,
            preferredLanguage: validatedInput.preferredLanguage,
            timezone: validatedInput.timezone,
            bio: validatedInput.bio,
            designation: role === "TEACHER" ? validatedInput.designation : null,
            expertise: role === "TEACHER" ? validatedInput.expertise : null,
            examTarget: role === "STUDENT" ? normalizedExamTarget?.examTarget ?? null : null,
            examTargetLevel: role === "STUDENT" ? normalizedExamTarget?.examTargetLevel ?? null : null,
            examTargetMonth: role === "STUDENT" ? normalizedExamTarget?.examTargetMonth ?? null : null,
            examTargetYear: role === "STUDENT" ? normalizedExamTarget?.examTargetYear ?? null : null,
            isPublicProfile: role === "TEACHER" ? validatedInput.isPublicProfile : true,
            batch: validatedInput.batch,
            dob: validatedInput.dob,
            location: validatedInput.location,
            firm: validatedInput.firm,
            firmRole: validatedInput.firmRole,
            articleshipYear: validatedInput.articleshipYear,
            articleshipTotal: validatedInput.articleshipTotal,
            foundationCleared: validatedInput.foundationCleared,
            intermediateCleared: validatedInput.intermediateCleared,
            finalCleared: validatedInput.finalCleared,
            resumeUrl: validatedInput.resumeUrl,
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
    } catch (error: unknown) {
        console.error(`updateProfile (${role}) failed:`, error);
        if (error instanceof ProfileValidationError) {
            return {
                success: false,
                message: error.message,
                fieldErrors: error.fieldErrors,
            };
        }

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
