"use server";

import { createPasswordHash,type AppRole } from "@/lib/auth/demo-accounts";
import { FEATURE_DEFINITIONS,type FeatureKey } from "@/lib/auth/feature-access";
import { getCurrentUserOrDemoUser } from "@/lib/auth/session";
import prisma from "@/lib/prisma/client";
import { getActionErrorMessage } from "@/lib/server/action-utils";
import {
  assertManagedUserIdentityAvailability,
  deleteManagedUserAndCollectFiles,
  ensureManagedUserRecord,
} from "@/lib/server/admin-user-management";
import {
  createBatchAnnouncements,
  createManagedBatch,
  deleteEnrollmentById,
  ensureAnnouncementAuthorRecord,
  ensureBatchRecord,
  updateManagedBatchById,
  upsertBatchEnrollment,
} from "@/lib/server/batch-management";
import { ensureManagedEducatorRecord } from "@/lib/server/educator-management";
import { revalidateAdminSurfaces } from "@/lib/server/revalidation";
import { removeSavedFileByUrl } from "@/lib/server/storage-utils";
import { deleteStudyMaterialWithAccessCleanup } from "@/lib/server/study-material-service";
import { ActionResponse } from "@/types/shared";
import { Prisma } from "@prisma/client";

const ALLOWED_ROLES: AppRole[] = ["ADMIN", "TEACHER", "STUDENT"];
const ALLOWED_FEATURE_KEYS = new Set(FEATURE_DEFINITIONS.map((feature) => feature.key));

function normalizeRole(input: string): AppRole {
  const normalized = input.trim().toUpperCase();
  if (ALLOWED_ROLES.includes(normalized as AppRole)) {
    return normalized as AppRole;
  }
  throw new Error("Invalid role selected.");
}

function normalizeEmail(input: FormDataEntryValue | null) {
  const value = String(input ?? "").trim().toLowerCase();
  return value || null;
}

function normalizeRegistration(input: FormDataEntryValue | null) {
  const value = String(input ?? "").trim().toUpperCase();
  return value || null;
}

function normalizeFeatureKey(input: FormDataEntryValue | null) {
  const value = String(input ?? "").trim().toUpperCase() as FeatureKey;
  if (!ALLOWED_FEATURE_KEYS.has(value)) {
    throw new Error("Invalid feature key.");
  }
  return value;
}

function readBooleanField(input: FormDataEntryValue | null) {
  return String(input ?? "false").toLowerCase() === "true";
}

async function requireAdmin() {
  return getCurrentUserOrDemoUser("ADMIN");
}

async function ensureTeacherOrAdminUser(teacherId: string) {
  return ensureManagedEducatorRecord(teacherId, "Teacher not found.");
}

/**
 * Creates a new user managed by an admin.
 */
export async function createAdminManagedUser(formData: FormData): Promise<ActionResponse<void>> {
  try {
    await requireAdmin();

    const fullName = String(formData.get("fullName") ?? "").trim();
    const role = normalizeRole(String(formData.get("role") ?? ""));
    const email = normalizeEmail(formData.get("email"));
    const registrationNumber = normalizeRegistration(formData.get("registrationNumber"));
    const department = String(formData.get("department") ?? "").trim() || null;
    const password = String(formData.get("password") ?? "").trim();

    if (!fullName) throw new Error("Full name is required.");
    if (!registrationNumber) throw new Error("Registration number is required.");
    if (!password) throw new Error("Password is required.");

    await assertManagedUserIdentityAvailability(email, registrationNumber);

    await prisma.user.create({
      data: {
        fullName,
        role,
        email,
        registrationNumber,
        department,
        passwordHash: createPasswordHash(password, registrationNumber),
      },
    });

    revalidateAdminSurfaces();
    return { success: true, message: "User created successfully.", data: undefined };
  } catch (error) {
    console.error("createAdminManagedUser failed", error);
    return { success: false, message: getActionErrorMessage(error, "Failed to create user.") };
  }
}

/**
 * Updates an existing user's details.
 */
export async function updateAdminManagedUser(formData: FormData): Promise<ActionResponse<void>> {
  try {
    const admin = await requireAdmin();

    const userId = String(formData.get("userId") ?? "").trim();
    if (!userId) throw new Error("User id is required.");

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        registrationNumber: true,
        email: true,
      },
    });
    if (!existingUser) throw new Error("User not found.");

    const fullName = String(formData.get("fullName") ?? "").trim();
    const role = normalizeRole(String(formData.get("role") ?? ""));
    const email = normalizeEmail(formData.get("email"));
    const registrationNumber = normalizeRegistration(formData.get("registrationNumber"));
    const department = String(formData.get("department") ?? "").trim() || null;
    const plan = String(formData.get("plan") ?? "").trim().toUpperCase() || "FREE";
    const password = String(formData.get("password") ?? "").trim();

    if (userId === admin.id && role !== "ADMIN") {
      throw new Error("You cannot remove admin access from the currently logged-in admin.");
    }

    await assertManagedUserIdentityAvailability(email, registrationNumber, userId);

    const data: Prisma.UserUpdateInput = {
      fullName,
      role,
      email,
      registrationNumber,
      department,
      plan,
    };

    if (password) {
      const seed =
        registrationNumber ??
        existingUser.registrationNumber ??
        email ??
        existingUser.email ??
        existingUser.id;
      data.passwordHash = createPasswordHash(password, seed);
    }

    await prisma.user.update({
      where: { id: userId },
      data,
    });

    revalidateAdminSurfaces();
    return { success: true, message: "User updated successfully.", data: undefined };
  } catch (error) {
    console.error("updateAdminManagedUser failed", error);
    return { success: false, message: getActionErrorMessage(error, "Failed to update user.") };
  }
}

/**
 * Commands the blocking or unblocking of a user.
 */
export async function setAdminManagedUserBlock(formData: FormData): Promise<ActionResponse<void>> {
  try {
    const admin = await requireAdmin();
    const userId = String(formData.get("userId") ?? "").trim();
    const isBlocked = readBooleanField(formData.get("isBlocked"));
    const blockedReason = String(formData.get("blockedReason") ?? "").trim() || null;

    if (!userId) throw new Error("User id is required.");
    if (userId === admin.id && isBlocked) {
      throw new Error("You cannot block the currently logged-in admin.");
    }

    await ensureManagedUserRecord(userId);

    await prisma.user.update({
      where: { id: userId },
      data: {
        isBlocked,
        blockedReason: isBlocked ? blockedReason : null,
      },
    });

    revalidateAdminSurfaces();
    return { success: true, message: isBlocked ? "User blocked." : "User unblocked.", data: undefined };
  } catch (error) {
    console.error("setAdminManagedUserBlock failed", error);
    return { success: false, message: getActionErrorMessage(error, "Failed to toggle block status.") };
  }
}

/**
 * Saves specific feature access rules for a user.
 */
export async function saveAdminManagedFeatureAccess(formData: FormData): Promise<ActionResponse<void>> {
  try {
    await requireAdmin();

    const userId = String(formData.get("userId") ?? "").trim();
    const featureKey = normalizeFeatureKey(formData.get("featureKey"));

    if (!userId) throw new Error("User id is required.");

    await ensureManagedUserRecord(userId);

    await prisma.userFeatureAccess.upsert({
      where: {
        userId_featureKey: {
          userId,
          featureKey,
        },
      },
      update: {
        isEnabled: readBooleanField(formData.get("isEnabled")),
        isRestricted: readBooleanField(formData.get("isRestricted")),
        canRead: readBooleanField(formData.get("canRead")),
        canCreate: readBooleanField(formData.get("canCreate")),
        canUpdate: readBooleanField(formData.get("canUpdate")),
        canDelete: readBooleanField(formData.get("canDelete")),
        canShare: readBooleanField(formData.get("canShare")),
        note: String(formData.get("note") ?? "").trim() || null,
      },
      create: {
        userId,
        featureKey,
        isEnabled: readBooleanField(formData.get("isEnabled")),
        isRestricted: readBooleanField(formData.get("isRestricted")),
        canRead: readBooleanField(formData.get("canRead")),
        canCreate: readBooleanField(formData.get("canCreate")),
        canUpdate: readBooleanField(formData.get("canUpdate")),
        canDelete: readBooleanField(formData.get("canDelete")),
        canShare: readBooleanField(formData.get("canShare")),
        note: String(formData.get("note") ?? "").trim() || null,
      },
    });

    revalidateAdminSurfaces();
    return { success: true, message: "Feature access updated.", data: undefined };
  } catch (error) {
    console.error("saveAdminManagedFeatureAccess failed", error);
    return { success: false, message: getActionErrorMessage(error, "Failed to update feature access.") };
  }
}

/**
 * Resets a user's feature access to defaults by deleting specific overrides.
 */
export async function resetAdminManagedFeatureAccess(formData: FormData): Promise<ActionResponse<void>> {
  try {
    await requireAdmin();

    const userId = String(formData.get("userId") ?? "").trim();
    const featureKey = normalizeFeatureKey(formData.get("featureKey"));

    if (!userId) throw new Error("User id is required.");

    await ensureManagedUserRecord(userId);

    await prisma.userFeatureAccess.deleteMany({
      where: { userId, featureKey },
    });

    revalidateAdminSurfaces();
    return { success: true, message: "Feature access reset.", data: undefined };
  } catch (error) {
    console.error("resetAdminManagedFeatureAccess failed", error);
    return { success: false, message: getActionErrorMessage(error, "Failed to reset access.") };
  }
}

/**
 * Permanently deletes a user and all their associated data across the platform.
 */
export async function deleteAdminManagedUser(formData: FormData): Promise<ActionResponse<void>> {
  try {
    const admin = await requireAdmin();
    const userId = String(formData.get("userId") ?? "").trim();
    if (!userId) throw new Error("User id is required.");
    if (userId === admin.id) throw new Error("You cannot delete the currently logged-in admin.");

    const uploadedMaterialFiles = await deleteManagedUserAndCollectFiles(userId);

    await Promise.all(uploadedMaterialFiles.map((fileUrl) => removeSavedFileByUrl(fileUrl)));

    revalidateAdminSurfaces();
    return { success: true, message: "User and associated data deleted.", data: undefined };
  } catch (error) {
    console.error("deleteAdminManagedUser failed", error);
    return { success: false, message: getActionErrorMessage(error, "Failed to delete user.") };
  }
}

/**
 * Creates a new training batch.
 */
export async function createAdminManagedBatch(formData: FormData): Promise<ActionResponse<void>> {
  try {
    await requireAdmin();

    const name = String(formData.get("name") ?? "").trim();
    const teacherId = String(formData.get("teacherId") ?? "").trim();
    const uniqueJoinCodeInput = String(formData.get("uniqueJoinCode") ?? "").trim();

    if (!name) throw new Error("Batch name is required.");
    if (!teacherId) throw new Error("Teacher is required.");

    await ensureTeacherOrAdminUser(teacherId);

    await createManagedBatch({
      name,
      teacherId,
      uniqueJoinCodeInput,
    });

    revalidateAdminSurfaces();
    return { success: true, message: "Batch created successfully.", data: undefined };
  } catch (error) {
    console.error("createAdminManagedBatch failed", error);
    return { success: false, message: getActionErrorMessage(error, "Failed to create batch.") };
  }
}

/**
 * Updates an existing batch's details.
 */
export async function updateAdminManagedBatch(formData: FormData): Promise<ActionResponse<void>> {
  try {
    await requireAdmin();

    const batchId = String(formData.get("batchId") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const teacherId = String(formData.get("teacherId") ?? "").trim();
    const uniqueJoinCode = String(formData.get("uniqueJoinCode") ?? "").trim();

    if (!batchId) throw new Error("Batch id is required.");
    if (!name) throw new Error("Batch name is required.");
    if (!teacherId) throw new Error("Teacher is required.");
    if (!uniqueJoinCode) throw new Error("Join code is required.");

    await ensureBatchRecord(batchId);
    await ensureTeacherOrAdminUser(teacherId);

    await updateManagedBatchById({
      batchId,
      name,
      teacherId,
      uniqueJoinCode,
    });

    revalidateAdminSurfaces();
    return { success: true, message: "Batch updated.", data: undefined };
  } catch (error) {
    console.error("updateAdminManagedBatch failed", error);
    return { success: false, message: getActionErrorMessage(error, "Failed to update batch.") };
  }
}

/**
 * Deletes a batch.
 */
export async function deleteAdminManagedBatch(formData: FormData): Promise<ActionResponse<void>> {
  try {
    await requireAdmin();

    const batchId = String(formData.get("batchId") ?? "").trim();
    if (!batchId) throw new Error("Batch id is required.");

    const batch = await ensureBatchRecord(batchId);
    if (batch._count.exams > 0) {
      throw new Error("Remove or reassign linked exams before deleting this batch.");
    }

    await prisma.batch.delete({
      where: { id: batchId },
    });

    revalidateAdminSurfaces();
    return { success: true, message: "Batch deleted.", data: undefined };
  } catch (error) {
    console.error("deleteAdminManagedBatch failed", error);
    return { success: false, message: getActionErrorMessage(error, "Failed to delete batch.") };
  }
}

/**
 * Assigns a student to a batch (Enrollment).
 */
export async function assignAdminManagedEnrollment(formData: FormData): Promise<ActionResponse<void>> {
  try {
    await requireAdmin();

    const studentId = String(formData.get("studentId") ?? "").trim();
    const batchId = String(formData.get("batchId") ?? "").trim();

    if (!studentId || !batchId) throw new Error("Student and batch are required.");

    await upsertBatchEnrollment(studentId, batchId);

    revalidateAdminSurfaces();
    return { success: true, message: "Student enrolled in batch.", data: undefined };
  } catch (error) {
    console.error("assignAdminManagedEnrollment failed", error);
    return { success: false, message: getActionErrorMessage(error, "Enrollment failed.") };
  }
}

/**
 * Removes a student's enrollment from a batch.
 */
export async function removeAdminManagedEnrollment(formData: FormData): Promise<ActionResponse<void>> {
  try {
    await requireAdmin();

    const enrollmentId = String(formData.get("enrollmentId") ?? "").trim();
    if (!enrollmentId) throw new Error("Enrollment id is required.");

    await deleteEnrollmentById(enrollmentId);

    revalidateAdminSurfaces();
    return { success: true, message: "Enrollment removed.", data: undefined };
  } catch (error) {
    console.error("removeAdminManagedEnrollment failed", error);
    return { success: false, message: getActionErrorMessage(error, "Removal failed.") };
  }
}

/**
 * Creates a platform-wide or batch-specific announcement.
 */
export async function createAdminAnnouncement(formData: FormData): Promise<ActionResponse<void>> {
  try {
    const admin = await requireAdmin();
    const batchId = String(formData.get("batchId") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();
    const teacherIdInput = String(formData.get("teacherId") ?? "").trim();

    if (!batchId) throw new Error("Batch is required.");
    if (!content) throw new Error("Announcement content is required.");

    const teacherId = teacherIdInput || admin.id;
    await ensureAnnouncementAuthorRecord(teacherId);
    await ensureBatchRecord(batchId);

    await createBatchAnnouncements({
      authorId: teacherId,
      content,
      batchIds: [batchId],
    });

    revalidateAdminSurfaces();
    return { success: true, message: "Announcement published.", data: undefined };
  } catch (error) {
    console.error("createAdminAnnouncement failed", error);
    return { success: false, message: getActionErrorMessage(error, "Publication failed.") };
  }
}

/**
 * Deletes an announcement.
 */
export async function deleteAdminAnnouncement(formData: FormData): Promise<ActionResponse<void>> {
  try {
    await requireAdmin();
    const announcementId = String(formData.get("announcementId") ?? "").trim();
    if (!announcementId) throw new Error("Announcement id is required.");

    await prisma.announcement.delete({
      where: { id: announcementId },
    });

    revalidateAdminSurfaces();
    return { success: true, message: "Announcement deleted.", data: undefined };
  } catch (error) {
    console.error("deleteAdminAnnouncement failed", error);
    return { success: false, message: getActionErrorMessage(error, "Deletion failed.") };
  }
}

/**
 * Manually grants material access to a student.
 */
export async function grantAdminManagedMaterialAccess(formData: FormData): Promise<ActionResponse<void>> {
  try {
    await requireAdmin();
    const studentId = String(formData.get("studentId") ?? "").trim();
    const materialId = String(formData.get("materialId") ?? "").trim();
    const accessType = String(formData.get("accessType") ?? "FREE_BATCH_MATERIAL").trim().toUpperCase();

    if (!studentId || !materialId) throw new Error("Student and material are required.");

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { role: true },
    });
    if (!student || student.role !== "STUDENT") {
      throw new Error("Selected user is not a student.");
    }

    const material = await prisma.studyMaterial.findUnique({
      where: { id: materialId },
      select: { id: true },
    });
    if (!material) {
      throw new Error("Material not found.");
    }

    await prisma.materialAccess.upsert({
      where: { studentId_materialId: { studentId, materialId } },
      update: { accessType },
      create: { studentId, materialId, accessType },
    });

    revalidateAdminSurfaces();
    return { success: true, message: "Access granted.", data: undefined };
  } catch (error) {
    console.error("grantAdminManagedMaterialAccess failed", error);
    return { success: false, message: getActionErrorMessage(error, "Access grant failed.") };
  }
}

/**
 * Revokes material access.
 */
export async function revokeAdminManagedMaterialAccess(formData: FormData): Promise<ActionResponse<void>> {
  try {
    await requireAdmin();
    const studentId = String(formData.get("studentId") ?? "").trim();
    const materialId = String(formData.get("materialId") ?? "").trim();
    if (!studentId || !materialId) throw new Error("Student and material are required.");

    await prisma.materialAccess.deleteMany({
      where: { studentId, materialId },
    });

    revalidateAdminSurfaces();
    return { success: true, message: "Access revoked.", data: undefined };
  } catch (error) {
    console.error("revokeAdminManagedMaterialAccess failed", error);
    return { success: false, message: getActionErrorMessage(error, "Revocation failed.") };
  }
}

/**
 * Updates metadata for a study material.
 */
export async function updateAdminManagedMaterial(formData: FormData): Promise<ActionResponse<void>> {
  try {
    await requireAdmin();

    const materialId = String(formData.get("materialId") ?? "").trim();
    const title = String(formData.get("title") ?? "").trim();
    const isPublic = readBooleanField(formData.get("isPublic"));
    const isProtected = readBooleanField(formData.get("isProtected"));

    if (!materialId) throw new Error("Material id is required.");
    if (!title) throw new Error("Material title is required.");

    const material = await prisma.studyMaterial.findUnique({
      where: { id: materialId },
      select: { id: true },
    });
    if (!material) {
      throw new Error("Material not found.");
    }

    await prisma.studyMaterial.update({
      where: { id: materialId },
      data: {
        title,
        isPublic,
        isProtected,
      },
    });

    revalidateAdminSurfaces();
    return { success: true, message: "Material updated.", data: undefined };
  } catch (error) {
    console.error("updateAdminManagedMaterial failed", error);
    return { success: false, message: getActionErrorMessage(error, "Update failed.") };
  }
}

/**
 * Deletes a material and cleans up associated storage metrics.
 */
export async function deleteAdminManagedMaterial(formData: FormData): Promise<ActionResponse<void>> {
  try {
    await requireAdmin();

    const materialId = String(formData.get("materialId") ?? "").trim();
    if (!materialId) throw new Error("Material id is required.");

    const deletedMaterial = await deleteStudyMaterialWithAccessCleanup(materialId);

    await removeSavedFileByUrl(deletedMaterial.fileUrl);

    revalidateAdminSurfaces();
    return { success: true, message: "Material deleted.", data: undefined };
  } catch (error) {
    console.error("deleteAdminManagedMaterial failed", error);
    return { success: false, message: getActionErrorMessage(error, "Deletion failed.") };
  }
}


