export type ActionResponse<T = unknown> = 
    | { success: true; data: T; message?: string }
    | { success: false; message: string; data?: T };

export type UserRole = "STUDENT" | "TEACHER" | "ADMIN";

export type UnifiedMaterial = {
    id: string;
    title: string;
    category: string;
    type: string;
    isPublic: boolean;
    isProtected: boolean;
    uploadedAt: Date;
    sizeInBytes?: number;
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
