"use server";

import { assertUserCanAccessFeature } from "@/lib/auth/feature-access";
import { getCurrentUserOrDemoUser } from "@/lib/auth/session";
import prisma from "@/lib/prisma/client";
import { clampNumber,getActionErrorMessage } from "@/lib/server/action-utils";
import { revalidateProfileSurfaces } from "@/lib/server/revalidation";
import type { UserProfile } from "@/types/profile";
import { ActionResponse } from "@/types/shared";
import type { Prisma } from "@prisma/client";

type ProfileRole = "TEACHER" | "STUDENT";

async function getOrCreateProfile(role: ProfileRole) {
    return getCurrentUserOrDemoUser(role, [role, "ADMIN"]);
}

function normalizeOptionalString(input: FormDataEntryValue | null) {
    const value = String(input ?? "").trim();
    return value || null;
}

function normalizeOptionalEmail(input: FormDataEntryValue | null) {
    const value = String(input ?? "").trim().toLowerCase();
    return value || null;
}

function normalizeOptionalRegistration(input: FormDataEntryValue | null) {
    const value = String(input ?? "").trim().toUpperCase();
    return value || null;
}

function parseOptionalBoundedInt(input: FormDataEntryValue | null, min: number, max: number) {
    const rawValue = String(input ?? "").trim();
    if (!rawValue) {
        return null;
    }

    const parsedValue = Number.parseInt(rawValue, 10);
    if (!Number.isFinite(parsedValue)) {
        throw new Error("One or more numeric profile fields are invalid.");
    }

    return clampNumber(parsedValue, min, max);
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

        const fullName = normalizeOptionalString(formData.get("fullName"));
        const email = normalizeOptionalEmail(formData.get("email"));
        const registrationNumber = normalizeOptionalRegistration(formData.get("registrationNumber"));
        const department = normalizeOptionalString(formData.get("department"));
        const phone = normalizeOptionalString(formData.get("phone"));
        const preferredLanguage = normalizeOptionalString(formData.get("preferredLanguage"));
        const timezone = normalizeOptionalString(formData.get("timezone"));
        const bio = normalizeOptionalString(formData.get("bio"));
        const designation = normalizeOptionalString(formData.get("designation"));
        const expertise = normalizeOptionalString(formData.get("expertise"));
        const examTarget = normalizeOptionalString(formData.get("examTarget"));
        const isPublicProfile = formData.get("isPublicProfile") === "true";

        const batch = normalizeOptionalString(formData.get("batch"));
        const dob = normalizeOptionalString(formData.get("dob"));
        const location = normalizeOptionalString(formData.get("location"));
        const firm = normalizeOptionalString(formData.get("firm"));
        const firmRole = normalizeOptionalString(formData.get("firmRole"));
        const articleshipYear = parseOptionalBoundedInt(formData.get("articleshipYear"), 0, 10);
        const articleshipTotal = parseOptionalBoundedInt(formData.get("articleshipTotal"), 0, 10);
        const foundationCleared = formData.get("foundationCleared") === "true";
        const intermediateCleared = formData.get("intermediateCleared") === "true";
        const finalCleared = formData.get("finalCleared") === "true";
        const resumeUrl = normalizeOptionalString(formData.get("resumeUrl"));

        if (articleshipYear !== null && articleshipTotal !== null && articleshipYear > articleshipTotal) {
            throw new Error("Articleship year cannot exceed total articleship years.");
        }

        if (email) {
            const duplicateEmail = await prisma.user.findFirst({
                where: {
                    email,
                    id: { not: user.id },
                },
                select: { id: true },
            });

            if (duplicateEmail) {
                throw new Error("A profile with this email already exists.");
            }
        }

        if (registrationNumber) {
            const duplicateRegistration = await prisma.user.findFirst({
                where: {
                    registrationNumber,
                    id: { not: user.id },
                },
                select: { id: true },
            });

            if (duplicateRegistration) {
                throw new Error("A profile with this registration number already exists.");
            }
        }

        const data: Prisma.UserUpdateInput = {
            fullName,
            email,
            registrationNumber,
            department,
            phone,
            preferredLanguage,
            timezone,
            bio,
            designation: role === "TEACHER" ? designation : null,
            expertise: role === "TEACHER" ? expertise : null,
            examTarget: role === "STUDENT" ? examTarget : null,
            isPublicProfile: role === "TEACHER" ? isPublicProfile : true,
            batch,
            dob,
            location,
            firm,
            firmRole,
            articleshipYear,
            articleshipTotal,
            foundationCleared,
            intermediateCleared,
            finalCleared,
            resumeUrl,
        };

        const updatedProfile = await prisma.user.update({
            where: { id: user.id },
            data,
        });

        revalidateProfileSurfaces(role);
        return { success: true, data: updatedProfile };
    } catch (error: unknown) {
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
