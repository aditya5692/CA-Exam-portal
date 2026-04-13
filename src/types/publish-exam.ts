export type PublishTarget =
    | { kind: "all" }
    | { kind: "batch"; batchId: string };

export type ParsedQuestion = {
    prompt: string;
    options: string[];
    correct: number[];
    subject?: string;
    topic?: string;
    difficulty?: string;
    explanation?: string;
};

export type PublishExamInput = {
    title: string;
    caLevel: "foundation" | "ipc" | "final";
    subject: string;
    chapter?: string;
    durationMinutes: number;
    examType?: string;
    target: PublishTarget;
    visibleToNonBatch?: boolean;
    visibleToOtherBatches?: boolean;
    questions: ParsedQuestion[];
    breakdown?: {
        enabled: boolean;
        mode: "RANDOM" | "FIFO";
        questionsPerTest: number;
    };
};

export type PublishExamResultData = {
    examIds: string[];
    examTitles: string[];
    targetLabel: string;
    questionCount: number;
};

export type BatchOption = {
    id: string;
    name: string;
    studentCount: number;
};

export type StudentVisibleExam = {
    id: string;
    title: string;
    duration: number;
    totalMarks: number;
    category: string;
    subject: string | null;
    chapter: string | null;
    batchName: string | null;
    teacherName: string;
    questionCount: number;
    attemptCount: number;
    examType: string;
    attempt: { id: string; examId: string; status: string; score: number } | null;
};
