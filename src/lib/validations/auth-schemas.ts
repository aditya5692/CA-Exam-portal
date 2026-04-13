import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
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
  phone: z.string().min(10, "Valid mobile number is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["STUDENT", "TEACHER"]),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  
  // Student Specific
  examTargetLevel: z.string().optional(),
  examTargetMonth: z.number().optional(),
  examTargetYear: z.number().optional(),
  articleshipFirmType: z.string().optional(),

  // Teacher Specific
  expertise: z.string().optional(),
  experienceYears: z.number().optional(),

  department: z.string().optional(),
  dob: z.string().min(1, "Date of birth is required"),
  location: z.string().optional(),
}).refine((data) => {
  if (data.role === "TEACHER") {
    return !!data.expertise && data.experienceYears !== undefined;
  }
  return true;
}, {
  message: "Expertise and experience are required for teachers",
  path: ["expertise"],
}).refine((data) => {
  if (data.role === "STUDENT" && data.examTargetLevel === "CA Final") {
    return !!data.articleshipFirmType;
  }
  return true;
}, {
  message: "Articleship details are required for CA Final students",
  path: ["articleshipFirmType"],
});
