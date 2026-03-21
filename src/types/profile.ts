import type { Prisma } from "@prisma/client";

export type UserProfile = Prisma.UserGetPayload<Record<string, never>>;
