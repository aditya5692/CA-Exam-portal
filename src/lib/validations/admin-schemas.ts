import { z } from "zod";

export const adminUserSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  role: z.enum(["STUDENT", "TEACHER", "ADMIN"]),
  email: z.string().email("Invalid email address").nullable().optional().or(z.literal("")),
  registrationNumber: z.string().min(1, "Registration number is required"),
  department: z.string().nullable().optional().or(z.literal("")),
  phone: z.string().nullable().optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  plan: z.string().optional().default("FREE"),
});

export const adminBatchSchema = z.object({
  name: z.string().min(1, "Batch name is required"),
  teacherId: z.string().min(1, "Teacher is required"),
  uniqueJoinCode: z.string().min(1, "Join code is required").optional(),
});
