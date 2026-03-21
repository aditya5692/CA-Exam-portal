import type { Prisma } from "@prisma/client";

export type ExamWithQuestions = Prisma.ExamGetPayload<{
    include: {
        questions: {
            include: {
                question: {
                    include: {
                        options: true;
                    };
                };
            };
        };
    };
}>;

export type AttemptWithResults = Prisma.ExamAttemptGetPayload<{
    include: {
        exam: {
            include: {
                _count: {
                    select: { questions: true };
                };
            };
        };
        answers: {
            include: {
                question: {
                    include: {
                        options: true;
                    };
                };
                selectedOption: true;
            };
        };
    };
}>;
