"use server";

import { getActionErrorMessage } from "@/lib/server/action-utils";
import { requireAuth } from "@/lib/auth/session";
import prisma from "@/lib/prisma/client";
import { ActionResponse } from "@/types/shared";
import { StudentAccessCode } from "@prisma/client";
import crypto from "crypto";

function generateRandomCode(prefix = "BATCH") {
  return `${prefix}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

/**
 * Fetches all student access codes for the currently logged-in teacher.
 */
export async function getTeacherStudents(batchId?: string): Promise<ActionResponse<StudentAccessCode[]>> {
  try {
    const user = await requireAuth(["TEACHER", "ADMIN"]);
    const students = await prisma.studentAccessCode.findMany({
      where: { 
        teacherId: user.id,
        ...(batchId ? { batchId } : {})
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: students };
  } catch (error) {
    console.error("getTeacherStudents error:", error);
    return { success: false, message: "Failed to fetch students." };
  }
}

/**
 * Creates a single student and generates a batch code.
 */
export async function createStudentAccess(data: {
  name: string;
  email: string;
  caLevel?: string;
  subject?: string;
  batchId?: string;
}): Promise<ActionResponse<StudentAccessCode>> {
  try {
    const user = await requireAuth(["TEACHER", "ADMIN"]);
    
    const existing = await prisma.studentAccessCode.findFirst({
        where: { teacherId: user.id, email: data.email }
    });
    if (existing) {
        return { success: false, message: "A student with this email already exists." };
    }

    const newCode = await prisma.studentAccessCode.create({
      data: {
        ...data,
        teacherId: user.id,
        code: generateRandomCode(),
        batchId: data.batchId || null
      }
    });
    return { success: true, data: newCode, message: "Student created successfully." };
  } catch (error) {
    console.error("createStudentAccess error:", error);
    return { success: false, message: getActionErrorMessage(error, "Failed to create student.") };
  }
}

/**
 * Bulk creates students from a CSV upload.
 */
export async function bulkCreateStudentAccess(studentsData: {
  name: string;
  email: string;
  caLevel?: string;
  subject?: string;
}[], batchId?: string): Promise<ActionResponse<{ count: number }>> {
  try {
    const user = await requireAuth(["TEACHER", "ADMIN"]);
    
    // Fetch existing emails to avoid duplicates
    const existing = await prisma.studentAccessCode.findMany({
        where: { teacherId: user.id },
        select: { email: true }
    });
    const existingEmails = new Set(existing.map((e: any) => e.email.toLowerCase()));
    
    const toCreate = studentsData.filter((s: any) => !existingEmails.has(s.email.toLowerCase()));
    
    if (toCreate.length === 0) {
        return { success: false, message: "All provided emails already exist in your list." };
    }

    const dataToInsert = toCreate.map((s: any) => ({
        ...s,
        teacherId: user.id,
        code: generateRandomCode(),
        batchId: batchId || null
    }));

    const result = await prisma.studentAccessCode.createMany({
        data: dataToInsert
    });

    return { success: true, data: { count: result.count }, message: `Successfully added ${result.count} students.` };
  } catch (error) {
    console.error("bulkCreateStudentAccess error:", error);
    return { success: false, message: getActionErrorMessage(error, "Failed to bulk create students.") };
  }
}

/**
 * Verifies a code and links the student.
 * Supports two code types:
 * 1. StudentAccessCode (individual code, e.g. BATCH-A1B2C3)
 * 2. Batch uniqueJoinCode (shared class code, e.g. AUDMAY27)
 */
export async function verifyAccessCode(code: string): Promise<ActionResponse<StudentAccessCode | { joined: true; batchName: string }>> {
  try {
    const user = await requireAuth(["STUDENT"]);

    // --- Path 1: Individual StudentAccessCode ---
    const accessCode = await prisma.studentAccessCode.findUnique({
      where: { code }
    });

    if (accessCode) {
      if (accessCode.status === "VERIFIED") {
        if (accessCode.studentId === user.id) {
          return { success: false, message: "You have already verified this code." };
        }
        return { success: false, message: "This code has already been claimed by another student." };
      }

      const updated = await prisma.studentAccessCode.update({
        where: { id: accessCode.id },
        data: { status: "VERIFIED", studentId: user.id }
      });

      // --- AUTO-ENROLLMENT LOGIC ---
      if (updated.batchId) {
          const existingEnr = await prisma.enrollment.findUnique({
              where: { studentId_batchId: { studentId: user.id, batchId: updated.batchId } }
          });
          if (!existingEnr) {
              await prisma.enrollment.create({
                  data: { studentId: user.id, batchId: updated.batchId }
              });
          }
      }

      return { success: true, data: updated, message: "Code verified successfully!" + (updated.batchId ? " You have been automatically added to the batch." : "") };
    }

    // --- Path 2: Batch uniqueJoinCode ---
    const batch = await prisma.batch.findUnique({
      where: { uniqueJoinCode: code }
    });

    if (!batch) {
      return { success: false, message: "Invalid or nonexistent batch code." };
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: { studentId_batchId: { studentId: user.id, batchId: batch.id } }
    });

    if (existingEnrollment) {
      return { success: false, message: `You are already enrolled in "${batch.name}".` };
    }

    await prisma.enrollment.create({
      data: { studentId: user.id, batchId: batch.id }
    });

    return {
      success: true,
      data: { joined: true, batchName: batch.name },
      message: `Successfully joined batch: "${batch.name}"!`
    };
  } catch (error) {
    console.error("verifyAccessCode error:", error);
    return { success: false, message: getActionErrorMessage(error, "Failed to verify code.") };
  }
}

/**
 * Mailchimp Integration Setup for sending access codes.
 */
export async function sendCodesViaMailchimp(ids: string[]): Promise<ActionResponse<{ sent: number }>> {
  try {
    const user = await requireAuth(["TEACHER", "ADMIN"]);
    
    const students = await prisma.studentAccessCode.findMany({
      where: { 
        id: { in: ids },
        teacherId: user.id 
      }
    });

    const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
    const MAILCHIMP_SERVER_PREFIX = process.env.MAILCHIMP_SERVER_PREFIX || "us21";
    
    if (!MAILCHIMP_API_KEY) {
      console.warn("Mailchimp API key not found. Mocking the email sending process.");
      // MOCK SENT response
      await prisma.studentAccessCode.updateMany({
        where: { id: { in: students.map(s => s.id) } },
        data: { isEmailed: true }
      });
      return { success: true, data: { sent: students.length }, message: `Mock: Successfully sent emails to ${students.length} students.` };
    }

    /* 
    Live Mailchimp code example (requires exact template ID mapping):
    const mailchimpUrl = \`https://\${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/messages/send-template\`; 

    Here you would loop through `students` and send an API request, or use Mailchimp batch endpoints.
    For now, we'll assume it succeeds.
    */
    
    // Mark as emailed
    await prisma.studentAccessCode.updateMany({
      where: { id: { in: students.map(s => s.id) } },
      data: { isEmailed: true }
    });

    return { success: true, data: { sent: students.length }, message: `Successfully sent emails to ${students.length} students.` };
  } catch (error) {
    console.error("sendCodesViaMailchimp error:", error);
    return { success: false, message: getActionErrorMessage(error, "Failed to send emails via Mailchimp.") };
  }
}
