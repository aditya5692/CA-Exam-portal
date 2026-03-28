export const ICAI_NEGATIVE_MARKING_PENALTY = 0.25;

export type NegativeMarkingSnapshot = {
    penaltyPerWrong: number;
    wrongAttemptedCount: number;
    riskyWrongCount: number;
    negativeMarkedScore: number;
    skipRecoveryScore: number;
    penaltyLoss: number;
    recoveredMarks: number;
    wouldPassUnderPenalty: boolean | null;
    wouldPassAfterRecovery: boolean | null;
};

type NegativeMarkingInput = {
    actualScore: number;
    wrongAttemptedCount: number;
    riskyWrongCount?: number;
    passingMarks?: number | null;
    penaltyPerWrong?: number;
};

function roundScore(value: number) {
    return Math.round(value * 100) / 100;
}

export function buildNegativeMarkingSnapshot({
    actualScore,
    wrongAttemptedCount,
    riskyWrongCount = 0,
    passingMarks,
    penaltyPerWrong = ICAI_NEGATIVE_MARKING_PENALTY,
}: NegativeMarkingInput): NegativeMarkingSnapshot {
    const safeRiskyWrongCount = Math.min(riskyWrongCount, wrongAttemptedCount);
    const penaltyLoss = roundScore(wrongAttemptedCount * penaltyPerWrong);
    const recoveredMarks = roundScore(safeRiskyWrongCount * penaltyPerWrong);
    const negativeMarkedScore = roundScore(actualScore - penaltyLoss);
    const skipRecoveryScore = roundScore(negativeMarkedScore + recoveredMarks);
    const hasPassingMarks = typeof passingMarks === "number" && passingMarks > 0;

    return {
        penaltyPerWrong,
        wrongAttemptedCount,
        riskyWrongCount: safeRiskyWrongCount,
        negativeMarkedScore,
        skipRecoveryScore,
        penaltyLoss,
        recoveredMarks,
        wouldPassUnderPenalty: hasPassingMarks ? negativeMarkedScore >= passingMarks! : null,
        wouldPassAfterRecovery: hasPassingMarks ? skipRecoveryScore >= passingMarks! : null,
    };
}

type QuestionWithCaseStudy = {
    id: string;
    no: number;
    caseStudy?: {
        id: string;
        title?: string | null;
    } | null;
};

export type CaseStudyBundleMeta = {
    bundleId: string;
    bundleTitle: string;
    questionIds: string[];
    questionNumbers: number[];
    position: number;
    totalQuestions: number;
};

export function getCaseStudyBundleMeta<T extends QuestionWithCaseStudy>(
    questions: T[],
    questionId: string,
): CaseStudyBundleMeta | null {
    const activeQuestion = questions.find((question) => question.id === questionId);
    const activeCaseStudyId = activeQuestion?.caseStudy?.id;

    if (!activeQuestion || !activeCaseStudyId) {
        return null;
    }

    const bundleQuestions = questions.filter(
        (question) => question.caseStudy?.id === activeCaseStudyId,
    );

    if (bundleQuestions.length <= 1) {
        return null;
    }

    return {
        bundleId: activeCaseStudyId,
        bundleTitle: activeQuestion.caseStudy?.title?.trim() || "Integrated case bundle",
        questionIds: bundleQuestions.map((question) => question.id),
        questionNumbers: bundleQuestions.map((question) => question.no),
        position: bundleQuestions.findIndex((question) => question.id === questionId) + 1,
        totalQuestions: bundleQuestions.length,
    };
}
