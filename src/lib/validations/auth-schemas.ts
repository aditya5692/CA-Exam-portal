import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  registrationNumber: z.string().min(1, "Registration number is required").optional().or(z.literal("")),
});

export const requestOtpSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(13, "Phone number is too long"),
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(10),
  otp: z.string().length(4, "OTP must be 4 digits").or(z.string().length(6, "OTP must be 6 digits")),
});

export const registrationSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().min(10),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: z.enum(["STUDENT", "TEACHER"]),
  department: z.string().optional(),
  dob: z.string().optional(),
  location: z.string().optional(),
  examTargetLevel: z.string().optional(),
  examTargetMonth: z.number().optional(),
  examTargetYear: z.number().optional(),
});
