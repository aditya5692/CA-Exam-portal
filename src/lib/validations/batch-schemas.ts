import { z } from "zod";

export const createBatchSchema = z.object({
  name: z.string().min(1, "Batch name is required").max(100),
  teacherId: z.string().optional(),
});

export const updateBatchSchema = z.object({
  batchId: z.string().min(1, "Batch ID is required"),
  name: z.string().min(1, "Batch name is required").max(100),
  teacherId: z.string().optional(),
});

export const announcementSchema = z.object({
  content: z.string().min(1, "Announcement content is required").max(5000),
  batchIds: z.array(z.string()).min(1, "Select at least one batch"),
  sendToAll: z.coerce.boolean().default(false),
});

export const joinBatchSchema = z.object({
  code: z.string().min(1, "Join code is required").toUpperCase(),
});
