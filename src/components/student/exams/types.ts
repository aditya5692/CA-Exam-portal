
export type ExamShape = {
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
    examType?: string;
    attempt: { id: string; examId: string; status: string; score: number } | null;
};

export type TeacherShape = { 
    name: string; 
    subjects: string[]; 
    examCount: number 
};

export type Props = {
    caLevelKey: "foundation" | "ipc" | "final";
    caLevelLabel: string;
    exams: ExamShape[];
    teachers: TeacherShape[];
    studentName: string;
    daysToExam: number;
};
