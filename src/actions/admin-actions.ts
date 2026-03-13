"use server";

import { FEATURE_DEFINITIONS, type FeatureKey } from "@/lib/auth/feature-access";
import { createPasswordHash, type AppRole } from "@/lib/auth/demo-accounts";
import { getCurrentUserOrDemoUser } from "@/lib/auth/session";
import prisma from "@/lib/prisma/client";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";

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

function generateJoinCode(name: string) {
  const slug = name.toUpperCase().replace(/\s+/g, "-").slice(0, 8);
  const rand = randomBytes(3).toString("hex").toUpperCase();
  return `${slug}-${rand}`;
}

async function requireAdmin() {
  return getCurrentUserOrDemoUser("ADMIN");
}

function refreshAdminSurfaces() {
  revalidatePath("/admin/dashboard");
  revalidatePath("/teacher/dashboard");
  revalidatePath("/teacher/profile");
  revalidatePath("/teacher/batches");
  revalidatePath("/teacher/materials");
  revalidatePath("/teacher/updates");
  revalidatePath("/teacher/students");
  revalidatePath("/teacher/questions");
  revalidatePath("/teacher/mcq-extract");
  revalidatePath("/teacher/analytics");
  revalidatePath("/student/dashboard");
  revalidatePath("/student/profile");
  revalidatePath("/student/exams");
  revalidatePath("/student/materials");
  revalidatePath("/student/updates");
  revalidatePath("/student/analytics");
  revalidatePath("/exam");
  revalidatePath("/exam/war-room");
}

export async function createAdminManagedUser(formData: FormData): Promise<void> {
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

    refreshAdminSurfaces();
  } catch (error) {
    console.error("createAdminManagedUser failed", error);
  }
}

export async function updateAdminManagedUser(formData: FormData): Promise<void> {
  try {
    await requireAdmin();

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

    const data: {
      fullName: string;
      role: AppRole;
      email: string | null;
      registrationNumber: string | null;
      department: string | null;
      plan: string;
      passwordHash?: string;
    } = {
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

    refreshAdminSurfaces();
  } catch (error) {
    console.error("updateAdminManagedUser failed", error);
  }
}

export async function setAdminManagedUserBlock(formData: FormData): Promise<void> {
  try {
    const admin = await requireAdmin();
    const userId = String(formData.get("userId") ?? "").trim();
    const isBlocked = readBooleanField(formData.get("isBlocked"));
    const blockedReason = String(formData.get("blockedReason") ?? "").trim() || null;

    if (!userId) throw new Error("User id is required.");
    if (userId === admin.id && isBlocked) {
      throw new Error("You cannot block the currently logged-in admin.");
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        isBlocked,
        blockedReason: isBlocked ? blockedReason : null,
      },
    });

    refreshAdminSurfaces();
  } catch (error) {
    console.error("setAdminManagedUserBlock failed", error);
  }
}

export async function saveAdminManagedFeatureAccess(formData: FormData): Promise<void> {
  try {
    await requireAdmin();

    const userId = String(formData.get("userId") ?? "").trim();
    const featureKey = normalizeFeatureKey(formData.get("featureKey"));

    if (!userId) throw new Error("User id is required.");

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

    refreshAdminSurfaces();
  } catch (error) {
    console.error("saveAdminManagedFeatureAccess failed", error);
  }
}

export async function resetAdminManagedFeatureAccess(formData: FormData): Promise<void> {
  try {
    await requireAdmin();

    const userId = String(formData.get("userId") ?? "").trim();
    const featureKey = normalizeFeatureKey(formData.get("featureKey"));

    if (!userId) throw new Error("User id is required.");

    await prisma.userFeatureAccess.deleteMany({
      where: { userId, featureKey },
    });

    refreshAdminSurfaces();
  } catch (error) {
    console.error("resetAdminManagedFeatureAccess failed", error);
  }
}

export async function deleteAdminManagedUser(formData: FormData): Promise<void> {
  try {
    const admin = await requireAdmin();
    const userId = String(formData.get("userId") ?? "").trim();
    if (!userId) throw new Error("User id is required.");
    if (userId === admin.id) throw new Error("You cannot delete the currently logged-in admin.");

    await prisma.$transaction(async (tx) => {
      await tx.materialAccess.deleteMany({
        where: {
          OR: [{ studentId: userId }, { material: { uploadedById: userId } }],
        },
      });

      await tx.studyMaterial.deleteMany({
        where: { uploadedById: userId },
      });

      await tx.enrollment.deleteMany({
        where: { studentId: userId },
      });

      await tx.announcement.deleteMany({
        where: { teacherId: userId },
      });

      await tx.batch.deleteMany({
        where: { teacherId: userId },
      });

      await tx.draftMCQ.deleteMany({
        where: { teacherId: userId },
      });

      while (true) {
        const deletedLeafFolders = await tx.folder.deleteMany({
          where: {
            ownerId: userId,
            subFolders: { none: {} },
          },
        });
        if (deletedLeafFolders.count === 0) break;
      }

      await tx.folder.deleteMany({
        where: { ownerId: userId },
      });

      await tx.user.delete({
        where: { id: userId },
      });
    });

    refreshAdminSurfaces();
  } catch (error) {
    console.error("deleteAdminManagedUser failed", error);
  }
}

export async function createAdminManagedBatch(formData: FormData): Promise<void> {
  try {
    await requireAdmin();

    const name = String(formData.get("name") ?? "").trim();
    const teacherId = String(formData.get("teacherId") ?? "").trim();
    const uniqueJoinCodeInput = String(formData.get("uniqueJoinCode") ?? "")
      .trim()
      .toUpperCase();

    if (!name) throw new Error("Batch name is required.");
    if (!teacherId) throw new Error("Teacher is required.");

    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      select: { id: true, role: true },
    });
    if (!teacher) throw new Error("Teacher not found.");
    if (!["TEACHER", "ADMIN"].includes(teacher.role)) {
      throw new Error("Selected owner must be a teacher or admin.");
    }

    await prisma.batch.create({
      data: {
        name,
        teacherId,
        uniqueJoinCode: uniqueJoinCodeInput || generateJoinCode(name),
      },
    });

    refreshAdminSurfaces();
  } catch (error) {
    console.error("createAdminManagedBatch failed", error);
  }
}

export async function updateAdminManagedBatch(formData: FormData): Promise<void> {
  try {
    await requireAdmin();

    const batchId = String(formData.get("batchId") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const teacherId = String(formData.get("teacherId") ?? "").trim();
    const uniqueJoinCode = String(formData.get("uniqueJoinCode") ?? "")
      .trim()
      .toUpperCase();

    if (!batchId) throw new Error("Batch id is required.");
    if (!name) throw new Error("Batch name is required.");
    if (!teacherId) throw new Error("Teacher is required.");
    if (!uniqueJoinCode) throw new Error("Join code is required.");

    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      select: { id: true, role: true },
    });
    if (!teacher) throw new Error("Teacher not found.");
    if (!["TEACHER", "ADMIN"].includes(teacher.role)) {
      throw new Error("Selected owner must be a teacher or admin.");
    }

    await prisma.batch.update({
      where: { id: batchId },
      data: {
        name,
        teacherId,
        uniqueJoinCode,
      },
    });

    refreshAdminSurfaces();
  } catch (error) {
    console.error("updateAdminManagedBatch failed", error);
  }
}

export async function deleteAdminManagedBatch(formData: FormData): Promise<void> {
  try {
    await requireAdmin();

    const batchId = String(formData.get("batchId") ?? "").trim();
    if (!batchId) throw new Error("Batch id is required.");

    await prisma.batch.delete({
      where: { id: batchId },
    });

    refreshAdminSurfaces();
  } catch (error) {
    console.error("deleteAdminManagedBatch failed", error);
  }
}

export async function assignAdminManagedEnrollment(formData: FormData): Promise<void> {
  try {
    await requireAdmin();

    const studentId = String(formData.get("studentId") ?? "").trim();
    const batchId = String(formData.get("batchId") ?? "").trim();

    if (!studentId || !batchId) throw new Error("Student and batch are required.");

    const student = await prisma.user.findUnique({ where: { id: studentId }, select: { role: true } });
    if (!student || student.role !== "STUDENT") throw new Error("Selected user is not a student.");

    await prisma.enrollment.upsert({
      where: { studentId_batchId: { studentId, batchId } },
      update: {},
      create: { studentId, batchId },
    });

    refreshAdminSurfaces();
  } catch (error) {
    console.error("assignAdminManagedEnrollment failed", error);
  }
}

export async function removeAdminManagedEnrollment(formData: FormData): Promise<void> {
  try {
    await requireAdmin();

    const enrollmentId = String(formData.get("enrollmentId") ?? "").trim();
    if (!enrollmentId) throw new Error("Enrollment id is required.");

    await prisma.enrollment.delete({ where: { id: enrollmentId } });
    refreshAdminSurfaces();
  } catch (error) {
    console.error("removeAdminManagedEnrollment failed", error);
  }
}

export async function createAdminAnnouncement(formData: FormData): Promise<void> {
  try {
    const admin = await requireAdmin();
    const batchId = String(formData.get("batchId") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();
    const teacherIdInput = String(formData.get("teacherId") ?? "").trim();

    if (!batchId) throw new Error("Batch is required.");
    if (!content) throw new Error("Announcement content is required.");

    const teacherId = teacherIdInput || admin.id;
    const author = await prisma.user.findUnique({
      where: { id: teacherId },
      select: { id: true, role: true },
    });
    if (!author) throw new Error("Announcement author not found.");
    if (!["TEACHER", "ADMIN"].includes(author.role)) {
      throw new Error("Author must be a teacher or admin.");
    }

    await prisma.announcement.create({
      data: {
        batchId,
        teacherId,
        content,
      },
    });

    refreshAdminSurfaces();
  } catch (error) {
    console.error("createAdminAnnouncement failed", error);
  }
}

export async function deleteAdminAnnouncement(formData: FormData): Promise<void> {
  try {
    await requireAdmin();
    const announcementId = String(formData.get("announcementId") ?? "").trim();
    if (!announcementId) throw new Error("Announcement id is required.");

    await prisma.announcement.delete({
      where: { id: announcementId },
    });

    refreshAdminSurfaces();
  } catch (error) {
    console.error("deleteAdminAnnouncement failed", error);
  }
}

export async function grantAdminManagedMaterialAccess(formData: FormData): Promise<void> {
  try {
    await requireAdmin();
    const studentId = String(formData.get("studentId") ?? "").trim();
    const materialId = String(formData.get("materialId") ?? "").trim();
    const accessType = String(formData.get("accessType") ?? "FREE_BATCH_MATERIAL").trim().toUpperCase();

    if (!studentId || !materialId) throw new Error("Student and material are required.");

    await prisma.materialAccess.upsert({
      where: { studentId_materialId: { studentId, materialId } },
      update: { accessType },
      create: { studentId, materialId, accessType },
    });

    refreshAdminSurfaces();
  } catch (error) {
    console.error("grantAdminManagedMaterialAccess failed", error);
  }
}

export async function revokeAdminManagedMaterialAccess(formData: FormData): Promise<void> {
  try {
    await requireAdmin();
    const studentId = String(formData.get("studentId") ?? "").trim();
    const materialId = String(formData.get("materialId") ?? "").trim();
    if (!studentId || !materialId) throw new Error("Student and material are required.");

    await prisma.materialAccess.deleteMany({
      where: { studentId, materialId },
    });

    refreshAdminSurfaces();
  } catch (error) {
    console.error("revokeAdminManagedMaterialAccess failed", error);
  }
}

export async function updateAdminManagedMaterial(formData: FormData): Promise<void> {
  try {
    await requireAdmin();

    const materialId = String(formData.get("materialId") ?? "").trim();
    const title = String(formData.get("title") ?? "").trim();
    const isPublic = readBooleanField(formData.get("isPublic"));
    const isProtected = readBooleanField(formData.get("isProtected"));

    if (!materialId) throw new Error("Material id is required.");
    if (!title) throw new Error("Material title is required.");

    await prisma.studyMaterial.update({
      where: { id: materialId },
      data: {
        title,
        isPublic,
        isProtected,
      },
    });

    refreshAdminSurfaces();
  } catch (error) {
    console.error("updateAdminManagedMaterial failed", error);
  }
}

export async function deleteAdminManagedMaterial(formData: FormData): Promise<void> {
  try {
    await requireAdmin();

    const materialId = String(formData.get("materialId") ?? "").trim();
    if (!materialId) throw new Error("Material id is required.");

    await prisma.$transaction(async (tx) => {
      const material = await tx.studyMaterial.findUnique({
        where: { id: materialId },
        select: {
          id: true,
          sizeInBytes: true,
          uploadedById: true,
        },
      });
      if (!material) throw new Error("Material not found.");

      await tx.materialAccess.deleteMany({
        where: { materialId },
      });

      await tx.studyMaterial.delete({
        where: { id: materialId },
      });

      const owner = await tx.user.findUnique({
        where: { id: material.uploadedById },
        select: { id: true, storageUsed: true },
      });

      if (owner) {
        await tx.user.update({
          where: { id: owner.id },
          data: {
            storageUsed: Math.max(0, owner.storageUsed - material.sizeInBytes),
          },
        });
      }
    });

    refreshAdminSurfaces();
  } catch (error) {
    console.error("deleteAdminManagedMaterial failed", error);
  }
}

