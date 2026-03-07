import { create } from "zustand";

interface Question {
    id: string;
    prompt: string;
    options: { id: string; label: string }[];
}

interface ExamState {
    questions: Question[];
    currentQuestionIndex: number;
    answers: Record<string, string>;
    timeRemaining: number;
    status: "idle" | "loading" | "running" | "submitting" | "finished";

    // Actions
    initializeExam: (questions: Question[], durationMinutes: number) => void;
    setCurrentQuestion: (index: number) => void;
    setAnswer: (questionId: string, answerId: string) => void;
    tick: () => void;
    finishExam: () => void;
}

export const useExamStore = create<ExamState>((set, get) => ({
    questions: [],
    currentQuestionIndex: 0,
    answers: {},
    timeRemaining: 0,
    status: "idle",

    initializeExam: (questions, durationMinutes) => {
        set({
            questions,
            currentQuestionIndex: 0,
            answers: {},
            timeRemaining: durationMinutes * 60,
            status: "running",
        });
    },

    setCurrentQuestion: (index) => {
        if (index >= 0 && index < get().questions.length) {
            set({ currentQuestionIndex: index });
        }
    },

    setAnswer: (questionId, answerId) => {
        set((state) => ({
            answers: { ...state.answers, [questionId]: answerId },
        }));
    },

    tick: () => {
        set((state) => {
            const nextTime = state.timeRemaining - 1;
            if (nextTime <= 0) {
                return { timeRemaining: 0, status: "finished" };
            }
            return { timeRemaining: nextTime };
        });
    },

    finishExam: () => set({ status: "finished" }),
}));
