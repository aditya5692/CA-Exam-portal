"use server";

import { createPasswordHash,type AppRole } from "@/lib/auth/demo-accounts";
import { FEATURE_DEFINITIONS,type FeatureKey } from "@/lib/auth/feature-access";
import { requireAuth } from "@/lib/auth/session";
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
import { adminUserSchema, adminBatchSchema } from "@/lib/validations/admin-schemas";

const ALLOWED_ROLES: AppRole[] = ["ADMIN", "TEACHER", "STUDENT"];
const ALLOWED_FEATURE_KEYS = new Set(FEATURE_DEFINITIONS.map((feature) => feature.key));

/**
 * Fetches full user details for administration oversight.
 */
export async function getAdminUserDetail(userId: string): Promise<ActionResponse<{
  user: any;
  featureOverrides: any[];
  materialAccess: any[];
  availableMaterials: any[];
}>> {
  try {
    await requireAdmin();

    const [user, materialAccess, allMaterials] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          registrationNumber: true,
          department: true,
          plan: true,
          isBlocked: true,
          blockedReason: true,
          createdAt: true,
          storageUsed: true,
          storageLimit: true,
          featureOverrides: true,
        }
      }),
      prisma.materialAccess.findMany({
        where: { studentId: userId },
        include: { material: true }
      }),
      prisma.studyMaterial.findMany({
        where: { isPublic: true },
        orderBy: { createdAt: "desc" }
      })
    ]);

    if (!user) throw new Error("User not found.");

    return {
      success: true,
      data: {
        user,
        featureOverrides: user.featureOverrides,
        materialAccess,
        availableMaterials: allMaterials
      }
    };
  } catch (error) {
    return { success: false, message: getActionErrorMessage(error, "Failed to load user details.") };
  }
}

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
  return requireAuth("ADMIN");
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

    const rawData = {
      fullName: formData.get("fullName"),
      role: formData.get("role"),
      email: formData.get("email") || null,
      registrationNumber: formData.get("registrationNumber"),
      department: formData.get("department") || null,
      password: formData.get("password"),
      phone: formData.get("phone"),
    };

    const validated = adminUserSchema.safeParse(rawData);
    if (!validated.success) {
        return { success: false, message: validated.error.issues[0].message };
    }

    const { fullName, role, email, registrationNumber, department, phone, password } = validated.data;
    if (!password) throw new Error("Password is required.");

    await assertManagedUserIdentityAvailability(email || null, registrationNumber);

    await prisma.user.create({
      data: {
        fullName: fullName,
        registrationNumber: registrationNumber,
        email: email || null,
        role: role,
        department: department || null,
        phone: phone || null,
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

    const rawData = {
      fullName: formData.get("fullName"),
      role: formData.get("role"),
      email: formData.get("email") || null,
      registrationNumber: formData.get("registrationNumber"),
      department: formData.get("department") || null,
      plan: formData.get("plan") || "FREE",
      password: formData.get("password") || undefined,
      phone: formData.get("phone"),
    };

    const validated = adminUserSchema.safeParse(rawData);
    if (!validated.success) {
        return { success: false, message: validated.error.issues[0].message };
    }

    const { fullName, role, email, registrationNumber, department, phone, plan, password } = validated.data;

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        registrationNumber: true,
        email: true,
      },
    });
    if (!existingUser) throw new Error("User not found.");

    if (userId === admin.id && role !== "ADMIN") {
      throw new Error("You cannot remove admin access from the currently logged-in admin.");
    }

    await assertManagedUserIdentityAvailability(email || null, registrationNumber, userId);

    await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: fullName,
        email: email || null,
        role: role,
        registrationNumber,
        department: department || null,
        phone: phone || null,
        plan: plan,
      },
    });

    if (password) {
      const seed =
        registrationNumber ||
        existingUser.registrationNumber ||
        email ||
        existingUser.email ||
        existingUser.id;

      await prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: createPasswordHash(password, seed),
        },
      });
    }

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

    const rawData = {
      name: formData.get("name"),
      teacherId: formData.get("teacherId"),
      uniqueJoinCode: formData.get("uniqueJoinCode") || undefined,
    };

    const validated = adminBatchSchema.safeParse(rawData);
    if (!validated.success) {
        return { success: false, message: validated.error.issues[0].message };
    }

    const { name, teacherId, uniqueJoinCode } = validated.data;
    await ensureTeacherOrAdminUser(teacherId);

    await createManagedBatch({
      name,
      teacherId,
      uniqueJoinCodeInput: uniqueJoinCode,
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
    if (!batchId) throw new Error("Batch id is required.");

    const rawData = {
      name: formData.get("name"),
      teacherId: formData.get("teacherId"),
      uniqueJoinCode: formData.get("uniqueJoinCode"),
    };

    const validated = adminBatchSchema.safeParse(rawData);
    if (!validated.success) {
        return { success: false, message: validated.error.issues[0].message };
    }

    const { name, teacherId, uniqueJoinCode } = validated.data;

    await ensureBatchRecord(batchId);
    await ensureTeacherOrAdminUser(teacherId);

    await updateManagedBatchById({
      batchId,
      name,
      teacherId,
      uniqueJoinCode: uniqueJoinCode ?? "",
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

/**
 * Toggles the featured status of an exam.
 */
export async function toggleAdminExamFeatured(formData: FormData): Promise<ActionResponse<void>> {
  try {
    await requireAdmin();
    const examId = String(formData.get("examId") ?? "").trim();
    const isFeatured = readBooleanField(formData.get("isFeatured"));

    if (!examId) throw new Error("Exam id is required.");

    await prisma.exam.update({
      where: { id: examId },
      data: { isFeatured } as any,
    });

    revalidateAdminSurfaces();
    return { success: true, message: isFeatured ? "Exam featured." : "Exam unfeatured.", data: undefined };
  } catch (error) {
    console.error("toggleAdminExamFeatured failed", error);
    return { success: false, message: getActionErrorMessage(error, "Failed to toggle featured status.") };
  }
}

/**
 * Toggles the trending status of a study material.
 */
export async function toggleAdminMaterialTrending(formData: FormData): Promise<ActionResponse<void>> {
  try {
    await requireAdmin();
    const materialId = String(formData.get("materialId") ?? "").trim();
    const isTrending = readBooleanField(formData.get("isTrending"));

    if (!materialId) throw new Error("Material id is required.");

    await prisma.studyMaterial.update({
      where: { id: materialId },
      data: { isTrending } as any,
    });

    revalidateAdminSurfaces();
    return { success: true, message: isTrending ? "Material marked as trending." : "Material unmarked.", data: undefined };
  } catch (error) {
    console.error("toggleAdminMaterialTrending failed", error);
    return { success: false, message: getActionErrorMessage(error, "Failed to toggle trending status.") };
  }
}

/**
 * Force-deletes an exam record and all its question mappings.
 */
export async function deleteAdminManagedExam(formData: FormData): Promise<ActionResponse<void>> {
  try {
    await requireAdmin();
    const examId = String(formData.get("examId") ?? "").trim();
    if (!examId) throw new Error("Exam ID is required.");

    // Delete attempts and questions links (cascaded by DB)
    await prisma.exam.delete({ where: { id: examId } });

    revalidateAdminSurfaces();
    return { success: true, message: "Exam and all related records deleted.", data: undefined };
  } catch (error) {
    console.error("deleteAdminManagedExam failed", error);
    return { success: false, message: getActionErrorMessage(error, "Failed to delete exam.") };
  }
}

/**
 * Fetches full exam details including linked questions for administrative review.
 */
export async function getAdminExamDetails(examId: string): Promise<ActionResponse<any>> {
  try {
    await requireAdmin();
    if (!examId) throw new Error("Exam ID is required.");

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          orderBy: { order: "asc" },
          include: {
            question: {
              include: { options: true }
            }
          }
        }
      }
    });

    if (!exam) throw new Error("Exam not found.");

    return { success: true, data: exam };
  } catch (error) {
    console.error("getAdminExamDetails failed", error);
    return { success: false, message: getActionErrorMessage(error, "Failed to load exam details.") };
  }
}

/**
 * Updates high-level exam metadata.
 */
export async function updateAdminManagedExam(formData: FormData): Promise<ActionResponse<void>> {
  try {
    await requireAdmin();
    const examId = String(formData.get("examId") ?? "").trim();
    const title = String(formData.get("title") ?? "").trim();
    const category = String(formData.get("category") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();
    const duration = parseInt(String(formData.get("duration") ?? "60"));

    if (!examId || !title) throw new Error("Exam ID and Title are required.");

    await prisma.exam.update({
      where: { id: examId },
      data: {
        title,
        category,
        status,
        duration,
      },
    });

    revalidateAdminSurfaces();
    return { success: true, message: "Exam metadata updated.", data: undefined };
  } catch (error) {
    console.error("updateAdminManagedExam failed", error);
    return { success: false, message: getActionErrorMessage(error, "Failed to update exam.") };
  }
}

/**
 * Global override to update any MCQ in the platform, regardless of owner.
 */
export async function adminUpdateVaultQuestion(formData: FormData): Promise<ActionResponse<void>> {
  try {
    await requireAdmin();
    const id = String(formData.get("questionId") ?? "").trim();
    const text = String(formData.get("text") ?? "").trim();
    const subject = String(formData.get("subject") ?? "").trim();
    const optionsJson = String(formData.get("options") ?? "[]");
    const correctIdxs = String(formData.get("correct") ?? "[]");

    if (!id || !text) throw new Error("Question ID and Text are required.");

    const options = JSON.parse(optionsJson) as string[];
    const correct = JSON.parse(correctIdxs) as number[];

    await prisma.$transaction(async (tx) => {
      // Sync options
      await tx.option.deleteMany({ where: { questionId: id } });
      await tx.option.createMany({
        data: options.map((opt, idx) => ({
          text: opt,
          isCorrect: correct.includes(idx),
          questionId: id,
        }))
      });

      await tx.question.update({
        where: { id },
        data: {
          text,
          subject,
        },
      });
    });

    revalidateAdminSurfaces();
    return { success: true, message: "Global question updated successfully.", data: undefined };
  } catch (error) {
    console.error("adminUpdateVaultQuestion failed", error);
    return { success: false, message: getActionErrorMessage(error, "Failed to update question.") };
  }
}

/**
 * Global override to delete any MCQ from the bank.
 */
export async function adminDeleteVaultQuestion(formData: FormData): Promise<ActionResponse<void>> {
  try {
    await requireAdmin();
    const id = String(formData.get("questionId") ?? "").trim();
    if (!id) throw new Error("Question ID is required.");

    await prisma.question.delete({ where: { id } });

    revalidateAdminSurfaces();
    return { success: true, message: "Question removed from platform.", data: undefined };
  } catch (error) {
    console.error("adminDeleteVaultQuestion failed", error);
    return { success: false, message: getActionErrorMessage(error, "Failed to delete question.") };
  }
}

/**
 * Searches for users by name, email, or phone to facilitate manual plan grants.
 */
export async function adminSearchUsers(query: string): Promise<ActionResponse<any[]>> {
  try {
    await requireAdmin();
    if (!query || query.length < 2) return { success: true, data: [] };

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { fullName: { contains: query } },
          { email: { contains: query } },
          { phone: { contains: query } },
        ],
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        plan: true,
      },
      take: 10,
    });

    return { success: true, data: users };
  } catch (error) {
    console.error("adminSearchUsers failed", error);
    return { success: false, message: getActionErrorMessage(error, "Failed to search users.") };
  }
}


