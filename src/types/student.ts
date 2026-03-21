export type StudentAttempt = {
    id: string;
    examId: string;
    seriesTitle: string;
    subject: string;
    category: string;
    attemptedAt: string;
    durationUsedMinutes: number;
    totalDurationMinutes: number;
    correct: number;
    total: number;
    accuracy: number;
    xpEarned: number;
    status: "completed" | "in-progress" | "abandoned";
    topicBreakdown: { topic: string; accuracy: number; correct: number; total: number }[];
    weakTopics: string[];
};

export type StudentHistoryData = {
    profile: {
        name: string;
        caLevel: string;
        level: number;
        totalXP: number;
        xpToNextLevel: number;
        streak: number;
        longestStreak: number;
        totalAttempts: number;
        totalCorrect: number;
        totalQuestions: number;
        avgAccuracy: number;
        joinedDaysAgo: number;
        badges: string[];
    };
    subjectAccuracy: { subject: string; accuracy: number; attempts: number }[];
    attempts: StudentAttempt[];
    performanceTrend: { date: string; score: number }[];
    comparativeAnalysis: { name: string; value: number; color: string }[];
    weakTopics: string[];
    examTargetDays: number;
    examTargetLabel: string;
};

export type ExamHubData = {
    stats: {
        totalStudyTimeHours: number;
        avgProficiency: number;
        examsMastered: number;
    };
    practiceGoal: {
        current: number;
        target: number;
    };
    chapterWiseMCQs: {
        id: string;
        title: string;
        chapters: number;
        questions: number;
        progress: number;
        color: "emerald" | "amber" | "rose" | "indigo";
        chapterDetails?: {
            name: string;
            progress: number;
            questions: number;
            examId?: string;
        }[];
    }[];
    mockTests: {
        id: string;
        title: string;
        isNew: boolean;
        isCompleted: boolean;
        score?: number;
        totalMarks: number;
        attemptedDate?: string;
        questions: number;
        duration: number;
        isLocked?: boolean;
        lockedReason?: string;
        lastAttemptId?: string;
    }[];
};
