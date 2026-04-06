import { z } from "zod";

// --- Educator Schemas ---
export const educatorExamSchema = z.object({
  title: z.string().min(1, "Title is required"),
  batchId: z.string().min(1, "Batch is required"),
  scheduledDate: z.string().optional(),
  durationMinutes: z.coerce.number().min(1, "Duration must be at least 1 minute"),
  totalMarks: z.coerce.number().min(0),
  isDraft: z.coerce.boolean().default(true),
});

export const educatorBatchUpdateSchema = z.object({
  name: z.string().min(1, "Batch name is required"),
  uniqueJoinCode: z.string().min(1, "Join code is required"),
});

export const educatorMaterialSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.string().min(1, "Category is required"),
  subType: z.string().min(1, "Sub-type is required"),
  isProtected: z.coerce.boolean().default(false),
  isPublic: z.coerce.boolean().default(false),
});

export const educatorPyqSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
});

// --- Student Schemas ---
export const studentEnrollmentSchema = z.object({
  joinCode: z.string().min(1, "Join code is required"),
});

export const studentProfileUpdateSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  department: z.string().optional(),
  dob: z.string().optional(),
  location: z.string().optional(),
});
