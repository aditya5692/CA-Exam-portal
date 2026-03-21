export type StudyPriorityBand = "HIGH" | "MEDIUM" | "LOW";

export type StudyRecommendationTopic = {
    subject: string;
    topic: string;
    accuracy: number;
    attempts: number;
    correct: number;
    dueForReview: boolean;
    nextReviewDate: string | null;
    priorityScore: number;
    priorityBand: StudyPriorityBand;
    difficulty: string;
    suggestedAction: string;
};

export type StudySubjectFocus = {
    subject: string;
    averageAccuracy: number;
    cohortAverageAccuracy: number | null;
    weakTopicCount: number;
    dueTopicCount: number;
    recommendedMinutes: number;
    trend: "IMPROVING" | "STEADY" | "NEEDS_ATTENTION";
};

export type StudentStudyRecommendations = {
    summary: {
        level: number;
        totalXP: number;
        streak: number;
        practiceGoal: number;
        completedThisWeek: number;
        remainingThisWeek: number;
        dueForReviewCount: number;
        weakTopicCount: number;
        masteredTopicCount: number;
        cohortAverageAccuracy: number | null;
        benchmarkAccuracy: number | null;
        topPrioritySubject: string | null;
    };
    priorityTopics: StudyRecommendationTopic[];
    subjectFocus: StudySubjectFocus[];
    nextActions: string[];
};
