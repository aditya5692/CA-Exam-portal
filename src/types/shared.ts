import type { ProfileFieldErrors } from "@/lib/profile-validation";

export type ActionResponse<T = unknown> = 
    | { success: true; data: T; message?: string }
    | { success: false; message: string; data?: T; fieldErrors?: ProfileFieldErrors };

export type UserRole = "STUDENT" | "TEACHER" | "ADMIN";

export type UnifiedMaterial = {
    id: string;
    title: string;
    category: string;
    subType: string;
    fileUrl?: string;
    description?: string;
    isPublic: boolean;
    isProtected: boolean;
    uploadedAt: Date;
    sizeInBytes: number;
    downloads?: number;
    rating?: number;
    isTrending?: boolean;
    uploadedBy?: {
        id?: string;
        fullName: string | null;
        email: string | null;
    };
};

export type UnifiedExam = {
    id: string;
    title: string;
    category: string;
    totalQuestions: number;
    durationMinutes: number;
    difficulty: string;
};

export type SavedItemType = "MATERIAL" | "EXAM";

export type UnifiedSavedItem = {
    id: string;
    resourceId: string;
    type: SavedItemType;
    createdAt: Date;
};
