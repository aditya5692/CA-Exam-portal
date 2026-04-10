"use client";

import { getExamDetails, submitExamAttempt, saveExamProgress, startMyExamAttempt } from "@/actions/exam-actions";
import { saveExamResultsAndUpdateLearning } from "@/actions/learning-actions";
import { buildNegativeMarkingSnapshot, getCaseStudyBundleMeta, ICAI_NEGATIVE_MARKING_PENALTY } from "@/lib/exam/insights";
import { cn } from "@/lib/utils";
import type { ExamWithQuestions } from "@/types/exam";
import { useRouter,useSearchParams } from "next/navigation";
import { useCallback,useEffect,useRef,useState, Suspense } from "react";
import { List, Gear, X, CaretLeft, CaretRight, Info, CheckCircle, Warning, Clock } from "@phosphor-icons/react";

// ── Types ────────────────────────────────────────────────────────────────────
type OptionShape = { id: string; text: string; isCorrect?: boolean };
type CaseStudyShape = { id: string; title: string; content: string };
type QuestionShape = { id: string; no: number; marks: number; difficulty: string; subject: string; topic?: string | null; text: string; options: OptionShape[]; explanation?: string | null; caseStudy?: CaseStudyShape | null };
type AnswerStatus = "answered" | "not-answered" | "marked" | "answered-marked" | "not-visited";
type Answer = { optionId: string | null; status: AnswerStatus; startedAt: number; confidence: "sure" | "unsure" | "guess" | null };
type PersistedAttemptAnswer = { questionId: string; selectedOptionId: string | null };


// ── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(s: number) { return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; }
function paletteColor(status: AnswerStatus) {
    if (status === "answered") return "border border-[var(--student-accent-strong)] bg-[var(--student-accent-strong)] text-white";
    if (status === "not-answered") return "border border-rose-500 bg-rose-500 text-white";
    if (status === "marked" || status === "answered-marked") return "border border-[var(--student-support)] bg-[var(--student-support)] text-white";
    return "border border-[var(--student-border)] bg-[var(--student-panel-solid)] text-[var(--student-muted)]";
}
function totalMarksForQuestions(questions: QuestionShape[]) {
    return questions.reduce((sum, question) => sum + question.marks, 0);
}

// ── Demo questions ───────────────────────────────────────────────────────────
const DEMO_QUESTIONS: QuestionShape[] = [
    { id: "dq1", no: 1, marks: 1, difficulty: "EASY", subject: "Financial Reporting", topic: "Ind AS 116", text: "As per Ind AS 116, a lessee shall recognise a right-of-use asset and a lease liability at the commencement date. Which of the following is NOT included in the initial measurement of the right-of-use asset?", options: [{ id: "A", text: "Initial direct costs" }, { id: "B", text: "Lease payments at commencement" }, { id: "C", text: "Estimated dismantling costs" }, { id: "D", text: "Unrelated lessor incentives received", isCorrect: true }], explanation: "Per Ind AS 116.24, the ROU asset includes initial direct costs, lease payments at/before commencement, and dismantling costs. Lessor incentives unrelated to termination are excluded from ROU measurement." },
    { id: "dq2", no: 2, marks: 1, difficulty: "MEDIUM", subject: "Direct Taxation", topic: "Capital Gains", text: "Under section 54 of the Income Tax Act, which of the following is the correct holding period for a residential property to qualify as a long-term capital asset?", options: [{ id: "A", text: "12 months" }, { id: "B", text: "24 months", isCorrect: true }, { id: "C", text: "36 months" }, { id: "D", text: "48 months" }], explanation: "Section 54 applies to long-term capital gains from residential property. A residential property is a long-term capital asset if held for more than 24 months (reduced from 36 months by Finance Act 2017)." },
    { id: "dq3", no: 3, marks: 1, difficulty: "HARD", subject: "GST", topic: "Place of Supply", text: "Under GST, where services are supplied by a supplier located in Maharashtra to a recipient whose address on record is in Karnataka, but the service is actually consumed in Goa, what is the place of supply?", options: [{ id: "A", text: "Maharashtra" }, { id: "B", text: "Karnataka", isCorrect: true }, { id: "C", text: "Goa" }, { id: "D", text: "Where the supplier's head office is located" }], explanation: "For B2B supplies, the place of supply under Section 12 IGST Act is the registered address of the recipient. Since the recipient's address on record is Karnataka, Karnataka is the place of supply." },
    { id: "dq4", no: 4, marks: 1, difficulty: "EASY", subject: "Auditing", topic: "SA 200", text: "Which of the following best describes 'reasonable assurance' as defined in SA 200?", options: [{ id: "A", text: "Absolute certainty that no material misstatement exists" }, { id: "B", text: "A high, but not absolute, level of assurance", isCorrect: true }, { id: "C", text: "Moderate assurance obtained from limited procedures" }, { id: "D", text: "Assurance that no fraud has occurred" }], explanation: "SA 200 defines reasonable assurance as a high but not absolute level of assurance. Absolute assurance is not achievable due to inherent limitations of an audit such as sampling and inherent limitations of internal control." },
];

// ── Loading screen ────────────────────────────────────────────────────────────
function LoadingScreen({ msg = "Loading exam…" }: { msg?: string }) {
    return (
        <div className="student-theme student-shell flex min-h-screen items-center justify-center">
            <div className="student-surface rounded-[28px] px-10 py-9 text-center space-y-4">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[var(--student-accent-soft)] border-t-[var(--student-accent-strong)]" />
                <p className="font-semibold text-[var(--student-muted-strong)]">{msg}</p>
            </div>
        </div>
    );
}



// ── Main component ────────────────────────────────────────────────────────────
function ExamWarRoomContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const examId = searchParams.get("examId");
    const modeParam = searchParams.get("mode");

    // Exam data
    const [questions, setQuestions] = useState<QuestionShape[]>([]);
    const [examTitle, setExamTitle] = useState("CA MCQ Series");
    const [examCategory, setExamCategory] = useState("");
    const [examTotalMarks, setExamTotalMarks] = useState(totalMarksForQuestions(DEMO_QUESTIONS));
    const [examPassingMarks, setExamPassingMarks] = useState(Math.ceil(totalMarksForQuestions(DEMO_QUESTIONS) * 0.4));
    const [attemptId, setAttemptId] = useState<string | null>(null);
    const [studentId, setStudentId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Flow state
    const [phase, setPhase] = useState<"exam" | "submitting" | "results">("exam");
    const mode = (modeParam as "mock" | "practice") || "mock";

    // Exam UI state
    const [current, setCurrent] = useState(0);
    const [answers, setAnswers] = useState<Record<string, Answer>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [fontSize, setFontSize] = useState<"sm" | "md" | "lg">("md");
    const [highContrast, setHighContrast] = useState(false);
    const [paused, setPaused] = useState(false);
    const [pauseUsed, setPauseUsed] = useState(false);
    const [solFilter, setSolFilter] = useState<"all" | "wrong" | "correct">("all");
    const [showPracticeAnswer, setShowPracticeAnswer] = useState(false);
    const [negativeMarkingEnabled, setNegativeMarkingEnabled] = useState(false);
    const [showPalette, setShowPalette] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Results state
    const [resultData, setResultData] = useState<{ correct: number; total: number; xpGained: number; timeUsed: number; actualScore: number; wrongAttemptedCount: number; guessedWrongCount: number; skippedCount: number; topicList: { topic: string; accuracy: number; correct: number; total: number }[] } | null>(null);

    const startedAtRef = useRef(Date.now());

    // ── Load exam details ───────────────────────────────────────────────────────
    useEffect(() => {
        async function load() {
            if (!examId) {
                setQuestions(DEMO_QUESTIONS);
                setExamTotalMarks(totalMarksForQuestions(DEMO_QUESTIONS));
                setExamPassingMarks(Math.ceil(totalMarksForQuestions(DEMO_QUESTIONS) * 0.4));
                setTimeLeft(20 * 60);
                setAnswers(Object.fromEntries(DEMO_QUESTIONS.map(q => [q.id, { optionId: null, status: "not-visited" as AnswerStatus, startedAt: Date.now(), confidence: null }])));
                startedAtRef.current = Date.now();
                setPhase("exam");
                setIsLoading(false);
                return;
            }
            const res = await getExamDetails(examId);
            if (!res.success || !res.data) { setQuestions(DEMO_QUESTIONS); setIsLoading(false); return; }

            const exam: ExamWithQuestions = res.data;
            const mapped: QuestionShape[] = exam.questions.map((eq, idx: number) => ({
                id: eq.question.id, 
                no: idx + 1, 
                marks: eq.marks,
                difficulty: eq.question.difficulty ?? "MEDIUM",
                subject: eq.question.subject ?? exam.category,
                topic: eq.question.topic,
                text: eq.question.text,
                explanation: eq.question.explanation,
                options: eq.question.options.map((o) => ({ 
                    id: o.id, 
                    text: o.text, 
                    isCorrect: o.isCorrect 
                })),
                caseStudy: eq.question.caseStudy,
            }));
            setQuestions(mapped);
            setExamTitle(exam.title);
            setExamCategory(exam.category);
            setExamTotalMarks(exam.totalMarks);
            setExamPassingMarks(exam.passingMarks);
            setTimeLeft(exam.duration * 60);

            // Auto start or resume the exam
            const isPractice = mode === "practice";
            const r = await startMyExamAttempt(examId, isPractice ? "PRACTICE" : "MOCK");
            if (r.success && r.data) { 
                setAttemptId(r.data.attemptId); 
                setStudentId(r.data.studentId); 

                // Handle accurate timing for resumption
                if (r.data.startTime) {
                    const start = new Date(r.data.startTime).getTime();
                    const now = Date.now();
                    const elapsed = Math.floor((now - start) / 1000);
                    const totalDuration = r.data.duration * 60;
                    const remaining = Math.max(0, totalDuration - elapsed);
                    setTimeLeft(remaining);
                    startedAtRef.current = start;
                } else {
                    startedAtRef.current = Date.now();
                }

                // Restore existing answers
                if (r.data.existingAnswers && r.data.existingAnswers.length > 0) {
                    const restored: Record<string, Answer> = {};
                    const existingAnswers = r.data.existingAnswers as PersistedAttemptAnswer[];
                    mapped.forEach(q => {
                        const ea = existingAnswers.find((answer) => answer.questionId === q.id);
                        if (ea) {
                            restored[q.id] = {
                                optionId: ea.selectedOptionId,
                                status: "answered",
                                startedAt: Date.now(),
                                confidence: null
                            };
                        } else {
                            restored[q.id] = { optionId: null, status: "not-visited", startedAt: Date.now(), confidence: null };
                        }
                    });
                    setAnswers(restored);
                } else {
                    setAnswers(Object.fromEntries(mapped.map(q => [q.id, { optionId: null, status: "not-visited" as AnswerStatus, startedAt: Date.now(), confidence: null }])));
                }
            } else {
                startedAtRef.current = Date.now();
                setAnswers(Object.fromEntries(mapped.map(q => [q.id, { optionId: null, status: "not-visited" as AnswerStatus, startedAt: Date.now(), confidence: null }])));
            }

            setPhase("exam");
            setIsLoading(false);
        }
        void load();
    }, [examId]);

    // ── Mark question visited when navigating ───────────────────────────────────
    useEffect(() => {
        if (questions.length === 0 || phase !== "exam") return;
        const q = questions[current];
        setAnswers(prev => {
            if (prev[q.id]?.status === "not-visited")
                return { ...prev, [q.id]: { ...prev[q.id], status: "not-answered", startedAt: Date.now() } };
            return prev;
        });
        setShowPracticeAnswer(false);
    }, [current, questions, phase]);

    // ── Timer ───────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (phase !== "exam" || mode === "practice" || paused || timeLeft <= 0) return;
        const t = setInterval(() => setTimeLeft(p => {
            if (p <= 1) { void handleFinalSubmit(); return 0; }
            return p - 1;
        }), 1000);
        return () => clearInterval(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, mode, paused, timeLeft]);


    // ── Submit ──────────────────────────────────────────────────────────────────
    const handleFinalSubmit = useCallback(async () => {
        if (phase === "submitting" || phase === "results") return;
        setPhase("submitting");
        const now = Date.now();
        const timeUsed = Math.round((now - startedAtRef.current) / 1000);

        // Compute results
        const topicMap = new Map<string, { correct: number; total: number }>();
        let correctCount = 0;
        let actualScore = 0;
        let wrongAttemptedCount = 0;
        let guessedWrongCount = 0;
        questions.forEach(q => {
            const a = answers[q.id];
            const isCorrect = a?.optionId ? (q.options.find(o => o.id === a.optionId)?.isCorrect ?? false) : false;
            if (isCorrect) {
                correctCount++;
                actualScore += q.marks;
            } else if (a?.optionId) {
                wrongAttemptedCount += 1;
                if (a.confidence === "guess") {
                    guessedWrongCount += 1;
                }
            }
            const key = q.topic ?? q.subject ?? "General";
            const e = topicMap.get(key) ?? { correct: 0, total: 0 };
            topicMap.set(key, { correct: e.correct + (isCorrect ? 1 : 0), total: e.total + 1 });
        });
        const skippedCount = questions.length - correctCount - wrongAttemptedCount;
        const xpGained = correctCount * 5 + (Math.round((correctCount / questions.length) * 100) >= 80 ? 20 : 0);
        const topicList = Array.from(topicMap.entries())
            .map(([topic, d]) => ({ topic, accuracy: Math.round((d.correct / d.total) * 100), correct: d.correct, total: d.total }))
            .sort((a, b) => a.accuracy - b.accuracy);

        // Persist real exam attempts for both mock and untimed practice sessions.
        if (attemptId && studentId && examId) {
            const payload = questions.filter(q => answers[q.id]?.optionId).map(q => ({
                questionId: q.id,
                selectedOptionId: answers[q.id].optionId!,
                timeSpent: Math.max(1, Math.round((now - (answers[q.id].startedAt ?? now)) / 1000)),
            }));
            await submitExamAttempt(attemptId, payload);
            await saveExamResultsAndUpdateLearning(studentId, examId, attemptId,
                questions.map(q => {
                    const a = answers[q.id];
                    return { 
                        questionId: q.id, 
                        subject: q.subject, 
                        topic: q.topic ?? "General", 
                        isCorrect: a?.optionId ? (q.options.find(o => o.id === a.optionId)?.isCorrect ?? false) : false, 
                        timeSpent: Math.max(1, Math.round((now - (a?.startedAt ?? now)) / 1000)), 
                        selectedOptionId: a?.optionId ?? null 
                    };
                })
            );
        }

        setSolFilter("all"); // reset filter for new results
        setResultData({ correct: correctCount, total: questions.length, xpGained, timeUsed, actualScore, wrongAttemptedCount, guessedWrongCount, skippedCount, topicList });
        setPhase("results");
    }, [phase, questions, answers, mode, attemptId, studentId, examId]);
    
    // ── Exam Integrity & Lockdown ─────────────────────────────────────────────
    useEffect(() => {
        if (phase !== "exam" || typeof window === "undefined") return;

        // 1. Block Context Menu & Clipboard
        const preventDefault = (e: Event) => e.preventDefault();
        window.addEventListener("contextmenu", preventDefault);
        window.addEventListener("copy", preventDefault);
        window.addEventListener("cut", preventDefault);
        window.addEventListener("paste", preventDefault);

        // 2. Before Unload (Refresh/Close)
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", handleBeforeUnload);

        // 3. Browser Back Button Lock
        // Push a state so that the back button "pops" this dummy state first
        window.history.pushState(null, "", window.location.href);
        const handlePopState = () => {
            // Re-push immediately
            window.history.pushState(null, "", window.location.href);
            // Alert user (Browser's confirm doesn't work well with popstate, but we can try)
            alert("Navigation is locked during exams. Please complete the exam or use the 'Exit Test' button.");
        };
        window.addEventListener("popstate", handlePopState);

        // 4. Multi-Window Detection (BroadcastChannel)
        const lockdownId = examId || "anonymous-exam";
        const channel = new BroadcastChannel(`exam-lock-${lockdownId}`);
        
        // Announce presence
        channel.postMessage({ type: 'PING', timestamp: Date.now() });

        channel.onmessage = (event) => {
            if (event.data.type === 'PING') {
                // Someone else just opened this exam
                channel.postMessage({ type: 'PONG' });
            } else if (event.data.type === 'PONG') {
                // I just joined and someone was already here
                alert("CRITICAL: This exam is already active in another window/tab. This session will be closed to maintain integrity.");
                window.location.href = "/student/exams";
            }
        };

        return () => {
            window.removeEventListener("contextmenu", preventDefault);
            window.removeEventListener("copy", preventDefault);
            window.removeEventListener("cut", preventDefault);
            window.removeEventListener("paste", preventDefault);
            window.removeEventListener("beforeunload", handleBeforeUnload);
            window.removeEventListener("popstate", handlePopState);
            channel.close();
        };
    }, [phase, examId]);

    // ── Answer interactions ────────────────────────────────────────────────────
    const selectOption = (optId: string) => {
        const qId = questions[current]?.id; if (!qId) return;
        setAnswers(prev => ({ ...prev, [qId]: { ...prev[qId], optionId: optId, status: prev[qId]?.status === "marked" ? "answered-marked" : "answered" } }));
        if (mode === "practice") setShowPracticeAnswer(true);

        // Incremental save
        if (attemptId) {
            const now = Date.now();
            const timeSpentValue = Math.max(1, Math.round((now - (answers[qId]?.startedAt ?? now)) / 1000));
            void saveExamProgress(attemptId, [{ questionId: qId, selectedOptionId: optId, timeSpent: timeSpentValue }]);
        }
    };
    const clearAnswer = () => {
        const qId = questions[current]?.id; if (!qId) return;
        setAnswers(prev => ({ ...prev, [qId]: { ...prev[qId], optionId: null, status: "not-answered" } }));
        setShowPracticeAnswer(false);

        // Incremental save
        if (attemptId) {
            void saveExamProgress(attemptId, [{ questionId: qId, selectedOptionId: null, timeSpent: 0 }]);
        }
    };
    const markForReview = () => {
        const qId = questions[current]?.id; if (!qId) return;
        setAnswers(prev => { const c = prev[qId] || {}; return { ...prev, [qId]: { ...c, status: c.optionId ? "answered-marked" : "marked" } }; });
        if (current < questions.length - 1) setCurrent(c => c + 1);
    };
    const setConfidence = (conf: "sure" | "unsure" | "guess") => {
        const qId = questions[current]?.id; if (!qId) return;
        setAnswers(prev => ({ ...prev, [qId]: { ...prev[qId], confidence: prev[qId].confidence === conf ? null : conf } }));
    };
    const togglePause = () => {
        if (!pauseUsed || paused) {
            if (!paused) setPauseUsed(true);
            setPaused(p => !p);
        }
    };
    const handleExitExam = useCallback(() => {
        if (phase === "exam") {
            const shouldExit = window.confirm(
                mode === "mock"
                    ? "Leave this mock test? Your current answers will not be submitted."
                    : "Leave practice mode? Your current progress will be lost."
            );
            if (!shouldExit) {
                return;
            }
        }

        router.push("/student/exams");
    }, [mode, phase, router]);

    // Counts
    const answered = Object.values(answers).filter(a => a?.status === "answered" || a?.status === "answered-marked").length;
    const notAnswered = Object.values(answers).filter(a => a?.status === "not-answered").length;
    const marked = Object.values(answers).filter(a => a?.status === "marked" || a?.status === "answered-marked").length;
    const notVisited = Object.values(answers).filter(a => a?.status === "not-visited").length;
    const fontClass = { sm: "text-sm", md: "text-base", lg: "text-lg" }[fontSize];

    // ── Render phases ──────────────────────────────────────────────────────────
    if (isLoading) return <LoadingScreen msg="Preparing your exam Environment…" />;
    if (questions.length === 0) return <LoadingScreen msg="Fetching questions…" />;

    if (phase === "submitting") return <LoadingScreen msg="Submitting your answers…" />;

    // ── Results screen ─────────────────────────────────────────────────────────
    if (phase === "results" && resultData) {
        const { correct, total, xpGained, timeUsed, actualScore, wrongAttemptedCount, guessedWrongCount, skippedCount, topicList } = resultData;
        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
        const scoreColor = accuracy >= 80 ? "#22c55e" : accuracy >= 55 ? "#f59e0b" : "#ef4444";
        const weakTopics = topicList.filter(t => t.accuracy < 60);
        const reviewItems = questions.map(q => ({ ...q, answer: answers[q.id] }));
        const negativeMarking = buildNegativeMarkingSnapshot({
            actualScore,
            wrongAttemptedCount,
            riskyWrongCount: guessedWrongCount,
            passingMarks: examPassingMarks,
        });
        const filtered = solFilter === "all" ? reviewItems : solFilter === "wrong"
            ? reviewItems.filter(item => item.answer?.optionId ? !(item.options.find(o => o.id === item.answer?.optionId)?.isCorrect) : false)
            : reviewItems.filter(item => item.answer?.optionId && item.options.find(o => o.id === item.answer?.optionId)?.isCorrect);

        return (
            <div className="student-theme student-shell min-h-screen pb-20 text-[var(--student-text)]">
                {/* Hero */}
                <div className="px-8 py-12">
                    <div className="student-surface-dark mx-auto grid max-w-5xl gap-10 rounded-[36px] px-8 py-10 text-white md:grid-cols-[auto_1fr] md:items-center">
                        <div className="relative w-28 h-28 sm:w-36 sm:h-36 shrink-0 mx-auto md:mx-0">
                            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                                <circle cx="50" cy="50" r="42" fill="none" stroke={scoreColor} strokeWidth="10" strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 42}`}
                                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - accuracy / 100)}`}
                                    style={{ transition: "stroke-dashoffset 1s ease" }} />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl sm:text-4xl font-black">{accuracy}%</span>
                                <span className="text-[10px] text-white/40 font-bold uppercase">Accuracy</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex gap-2 flex-wrap">
                                <span className="px-3 py-1 rounded-full bg-white/10 text-white/60 text-[10px] font-bold uppercase">{examTitle}</span>
                                {mode === "practice" && <span className="px-3 py-1 rounded-full bg-[#8dbdaf]/20 text-[#bfe1d6] text-[10px] font-bold uppercase tracking-widest">Practice Mode</span>}
                                {mode === "mock" && attemptId && <span className="px-3 py-1 rounded-full bg-[#f2d295]/16 text-[#f2d295] text-[10px] font-bold uppercase tracking-widest">Saved to profile</span>}
                            </div>
                            <h1 className="text-3xl font-black">{accuracy >= 80 ? "Excellent result" : accuracy >= 55 ? "Solid attempt" : "Keep practicing"}</h1>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { v: `${correct}/${total}`, l: "Correct" },
                                    { v: wrongAttemptedCount, l: "Wrong" },
                                    { v: skippedCount, l: "Skipped" },
                                    { v: `${Math.floor(timeUsed / 60)}m`, l: "Time" },
                                ].map(s => (
                                    <div key={s.l} className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center shadow-inner">
                                        <div className="text-lg sm:text-xl font-black">{s.v}</div>
                                        <div className="text-[9px] sm:text-[10px] text-white/40 uppercase tracking-[0.2em]">{s.l}</div>
                                    </div>
                                ))}
                            </div>
                            {mode === "mock" && (
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 w-fit mx-auto md:mx-0">
                                    <span className="text-[#f2d295] font-black">+{xpGained} XP</span>
                                    {accuracy >= 80 && <span className="px-2 py-1 rounded-full bg-[#8dbdaf]/16 text-[#bfe1d6] text-[10px] font-bold">Lvl Mastery</span>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mx-auto max-w-5xl px-4 sm:px-8">
                    <div className="student-surface rounded-[28px] p-6 md:p-8">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-2">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted)]">
                                    Negative Marking Simulator
                                </div>
                                <h2 className="  text-2xl font-bold tracking-tight text-[var(--student-text)]">
                                    Practice the art of skipping
                                </h2>
                                <p className="text-sm leading-7 text-[var(--student-muted-strong)]">
                                    Toggle the ICAI-style penalty to see how much low-conviction attempts cost. Guessed misses are called out separately so students can train when to hold back.
                                </p>
                            </div>
                            <button
                                onClick={() => setNegativeMarkingEnabled(value => !value)}
                                className={cn(
                                    "inline-flex items-center rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all",
                                    negativeMarkingEnabled
                                        ? "border-rose-200 bg-rose-50 text-rose-700"
                                        : "border-[var(--student-border)] bg-white text-[var(--student-muted-strong)]",
                                )}
                            >
                                {negativeMarkingEnabled ? "Penalty simulator on" : "Penalty simulator off"}
                            </button>
                        </div>

                        <div className="mt-6 grid gap-4 grid-cols-1 md:grid-cols-3">
                            {[
                                {
                                    label: "Raw Score",
                                    value: `${actualScore}/${examTotalMarks}`,
                                    helper: `${correct} correct · ${skippedCount} skipped`,
                                },
                                {
                                    label: "Penalty Score",
                                    value: `${negativeMarking.negativeMarkedScore}/${examTotalMarks}`,
                                    helper: `${wrongAttemptedCount} wrong attempts cost ${negativeMarking.penaltyLoss} marks`,
                                },
                                {
                                    label: guessedWrongCount > 0 ? "If You Skipped Guesses" : "If You Skipped Misses",
                                    value: `${negativeMarking.skipRecoveryScore}/${examTotalMarks}`,
                                    helper: guessedWrongCount > 0
                                        ? `Skipping ${guessedWrongCount} guessed misses saves ${negativeMarking.recoveredMarks} marks`
                                        : wrongAttemptedCount > 0
                                            ? `Skipping all ${wrongAttemptedCount} wrong attempts saves ${negativeMarking.recoveredMarks} marks`
                                            : "No risky attempts to recover",
                                },
                            ].map((item) => (
                                <div key={item.label} className="rounded-[24px] border border-[var(--student-border)] bg-[var(--student-panel-muted)] p-5">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted)]">
                                        {item.label}
                                    </div>
                                    <div className="mt-3 text-2xl font-bold text-[var(--student-text)]">
                                        {negativeMarkingEnabled || item.label === "Raw Score" ? item.value : `${actualScore}/${examTotalMarks}`}
                                    </div>
                                    <div className="mt-2 text-xs leading-6 text-[var(--student-muted-strong)]">
                                        {item.helper}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={cn(
                            "mt-6 rounded-[24px] border p-5 text-sm leading-7",
                            negativeMarkingEnabled
                                ? "border-rose-200 bg-rose-50 text-rose-900"
                                : "border-[var(--student-border)] bg-[var(--student-panel-muted)] text-[var(--student-text)]",
                        )}>
                            {wrongAttemptedCount > 0 ? (
                                <>
                                    {negativeMarkingEnabled
                                        ? <>With the ICAI penalty turned on, this paper drops to <span className="font-bold">{negativeMarking.negativeMarkedScore}</span>.</>
                                        : <>Turn on the penalty simulator to compare your raw score with the ICAI-adjusted score.</>}
                                    {" "}
                                    {guessedWrongCount > 0
                                        ? <>If you had skipped these {guessedWrongCount} guessed misses, the same attempt lands at <span className="font-bold">{negativeMarking.skipRecoveryScore}</span>.</>
                                        : <>If you had skipped the {wrongAttemptedCount} wrong attempts, you would have protected <span className="font-bold">{negativeMarking.recoveredMarks}</span> marks.</>}
                                </>
                            ) : (
                                <>No penalty traps here. Every attempted answer was either correct or wisely skipped.</>
                            )}
                            {examPassingMarks > 0 && (
                                <span className="block pt-3 text-[11px] font-bold uppercase tracking-widest">
                                    Pass line: {examPassingMarks}
                                    {negativeMarkingEnabled && (
                                        <> · {negativeMarking.wouldPassUnderPenalty ? "still above pass line" : "falls below pass line"}</>
                                    )}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-8 mt-10 space-y-8">
                    {/* Topic breakdown */}
                    {topicList.length > 0 && (
                        <div className="student-surface rounded-[24px] p-6">
                            <h2 className="font-bold   text-[var(--student-text)] mb-5">Topic-wise Performance</h2>
                            <div className="space-y-3">
                                {topicList.map(t => {
                                    const c = t.accuracy >= 80 ? "#2f7d55" : t.accuracy >= 55 ? "#b7791f" : "#ef4444";
                                    return (
                                        <div key={t.topic} className="flex items-center gap-4">
                                            <span className="w-40 text-xs font-bold text-[var(--student-text)] truncate shrink-0">{t.topic}</span>
                                            <div className="flex-1 h-2.5 bg-[var(--student-panel-muted)] rounded-full overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width: `${t.accuracy}%`, backgroundColor: c }} />
                                            </div>
                                            <span className="text-sm font-bold w-10 text-right" style={{ color: c }}>{t.accuracy}%</span>
                                            <span className="text-xs text-[var(--student-muted)] w-16 text-right">{t.correct}/{t.total}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Weak topic focus */}
                    {weakTopics.length > 0 && (
                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6">
                            <h2 className="font-black text-rose-700 mb-4">Focus Topics</h2>
                            <div className="grid sm:grid-cols-2 gap-3">
                                {weakTopics.map((t, i) => (
                                    <div key={t.topic} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-rose-200">
                                        <span className="w-6 h-6 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                                        <div><div className="text-sm font-bold text-gray-900">{t.topic}</div><div className="text-[10px] text-rose-500">{t.accuracy}% accuracy. Review in {t.accuracy < 40 ? "1 day" : "3 days"}.</div></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Solution Review */}
                    <div className="student-surface rounded-[24px] p-6">
                        <h2 className="font-bold   text-[var(--student-text)] mb-4">Solution Review</h2>
                        <div className="flex gap-2 mb-5 flex-wrap">
                            {([["all", `All (${questions.length})`], ["wrong", `Wrong (${wrongAttemptedCount})`], ["correct", `Correct (${correct})`]] as const).map(([key, label]) => (
                                <button key={key} onClick={() => setSolFilter(key as "all" | "wrong" | "correct")}
                                    className={cn("px-4 py-2 rounded-xl font-bold text-sm transition-all border",
                                        solFilter === key ? (key === "wrong" ? "border-rose-500 bg-rose-500 text-white" : key === "correct" ? "border-[var(--student-accent-strong)] bg-[var(--student-accent-strong)] text-white" : "student-tab-active") : "border-[var(--student-border)] bg-[var(--student-panel-muted)] text-[var(--student-muted)] hover:bg-[var(--student-panel-solid)]")}>
                                    {label}
                                </button>
                            ))}
                        </div>
                        <div className="space-y-4">
                            {filtered.map((item, idx) => {
                                const chosen = item.answer?.optionId;
                                const isCorrect = chosen ? (item.options.find(o => o.id === chosen)?.isCorrect ?? false) : false;
                                const conf = item.answer?.confidence;
                                return (
                                    <div key={item.id} className={cn("p-5 rounded-[24px] border shadow-[0_8px_30px_rgb(0,0,0,0.03)]", isCorrect ? "border-[#cfe0d5] bg-[#e5f0e9]/70" : "border-rose-100 bg-rose-50/50")}>
                                        <div className="flex items-start gap-3 mb-3">
                                            <span className={cn("w-8 h-8 rounded-[12px] flex items-center justify-center font-bold text-sm shrink-0 shadow-sm", isCorrect ? "bg-[#d8e8dd] text-[var(--student-success)]" : "bg-rose-100 text-rose-700 shadow-rose-500/10")}>{idx + 1}</span>
                                            <div className="flex-1">
                                                <div className="flex gap-2 flex-wrap mb-2">
                                                    {item.topic && <span className="px-2 py-0.5 rounded-full bg-[var(--student-accent-soft)] text-[var(--student-accent-strong)] text-[10px] font-bold border border-[var(--student-accent-soft-strong)]">{item.topic}</span>}
                                                    {conf && <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", conf === "sure" ? "bg-green-50 text-green-600" : conf === "unsure" ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600")}>You were {conf}</span>}
                                                    {!chosen && <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 text-[10px] font-bold">⏭ Skipped</span>}
                                                </div>
                                                <p className="font-semibold text-[var(--student-text)] text-sm leading-relaxed">{item.text}</p>
                                            </div>
                                        </div>
                                        <div className="grid sm:grid-cols-2 gap-2 ml-11">
                                            {item.options.map((opt, oi) => {
                                                const isChosen = opt.id === chosen;
                                                return (
                                                    <div key={opt.id} className={cn("p-3 rounded-[16px] border text-sm font-medium flex items-center justify-between gap-2 transition-all",
                                                        opt.isCorrect ? "bg-[#e5f0e9] border-[#cfe0d5] text-[var(--student-success)]" : isChosen ? "bg-rose-50 border-rose-200 text-rose-800" : "bg-[var(--student-panel-solid)] border-[var(--student-border)] text-[var(--student-muted-strong)]")}>
                                                        <span className="flex items-center gap-2">
                                                            <span className={cn("w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0",
                                                                opt.isCorrect ? "bg-[var(--student-success)] text-white shadow-md shadow-[rgba(47,125,85,0.2)]" : isChosen ? "bg-rose-500 text-white shadow-md shadow-rose-500/20" : "bg-slate-100 text-slate-500")}>
                                                                {["A", "B", "C", "D"][oi]}
                                                            </span>{opt.text}
                                                        </span>
                                                        {opt.isCorrect && <span className="text-[var(--student-success)] shrink-0">OK</span>}
                                                        {isChosen && !opt.isCorrect && <span className="text-rose-500 shrink-0">✗</span>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {item.explanation && (
                                            <div className="ml-11 mt-3 flex gap-2 p-3 rounded-xl bg-[var(--student-accent-soft)] border border-[var(--student-accent-soft-strong)]">
                                                <span className="text-[var(--student-accent-strong)] shrink-0">i</span>
                                                <p className="text-xs text-[var(--student-text)] leading-relaxed">{item.explanation}</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 flex-wrap">
                        <button onClick={handleExitExam} className="student-button-primary flex-1 py-4 rounded-2xl font-bold text-sm transition-all">Back to Exams</button>
                        <button onClick={() => { window.location.href = "/student/history"; }} className="student-button-secondary flex-1 py-4 rounded-2xl font-bold text-sm transition-all">History</button>
                        {attemptId && <button onClick={() => { window.location.href = `/student/results/${attemptId}`; }} className="student-button-secondary flex-1 py-4 rounded-2xl font-bold text-sm transition-all">Full Results Page</button>}
                    </div>
                </div>
            </div>
        );
    }

    // ── NTA Exam UI ───────────────────────────────────────────────────────────
    const q = questions[current];
    const ans = answers[q.id] ?? { optionId: null, status: "not-visited" as AnswerStatus, startedAt: Date.now(), confidence: null };
    const currentCaseBundle = getCaseStudyBundleMeta(questions, q.id);

    return (
        <div className={cn("student-theme min-h-screen flex flex-col", highContrast ? "bg-black text-white" : "student-shell text-[var(--student-text)]")}>
            {/* Pause overlay */}
            {paused && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                    <div className={cn("mx-4 max-w-sm rounded-3xl p-10 text-center shadow-2xl space-y-4", highContrast ? "bg-gray-900" : "student-surface-strong")}>
                        <div className="text-5xl">⏸</div>
                        <h2 className={cn("text-2xl font-black", highContrast ? "text-white" : "text-[var(--student-text)]")}>Exam Paused</h2>
                        <p className={cn("text-sm", highContrast ? "text-gray-400" : "text-[var(--student-muted)]")}>Timer is stopped. Resume when you are ready.</p>
                        <button onClick={togglePause} className={cn("w-full py-4 rounded-2xl font-black text-lg transition-all", highContrast ? "bg-white text-black hover:bg-gray-200" : "student-button-primary")}>Resume</button>
                    </div>
                </div>
            )}

            {/* Top Bar */}
            <header className={cn("sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 py-3 shadow-sm border-b", highContrast ? "bg-gray-900 border-gray-700" : "bg-[var(--student-panel-solid)] border-[var(--student-border)]")}>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <button 
                        onClick={() => setShowPalette(true)}
                        className="lg:hidden p-2 rounded-lg hover:bg-[var(--student-panel-muted)] transition-colors"
                    >
                        <List size={20} weight="bold" />
                    </button>
                    <div className={cn("w-7 h-7 sm:w-8 sm:h-8 rounded flex items-center justify-center font-black text-white text-[10px] sm:text-xs", highContrast ? "bg-white text-black" : "bg-[var(--student-accent-strong)]")}>CA</div>
                    <div className="hidden xs:block">
                        <div className={cn("font-bold text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none", highContrast ? "text-white" : "text-[var(--student-text)]")}>{examTitle}</div>
                        <div className={cn("text-[9px] sm:text-[10px]", highContrast ? "text-gray-400" : "text-[var(--student-muted)]")}>{questions.length} Questions</div>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    {mode === "mock" && (
                        <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-100 shadow-sm">
                            <Clock size={16} weight="bold" className={cn(timeLeft < 300 ? "text-rose-500 animate-pulse" : "text-rose-400")} />
                            <span className={cn("font-mono font-black text-sm sm:text-base", timeLeft < 300 ? "text-rose-600" : "text-slate-700")}>{formatTime(timeLeft)}</span>
                        </div>
                    )}

                    <div className="hidden lg:flex items-center gap-3">
                        <button
                            onClick={handleExitExam}
                            className={cn(
                                "rounded-lg border px-3 py-1.5 text-xs font-bold transition-all",
                                highContrast
                                    ? "border-gray-600 text-gray-200 hover:bg-gray-800"
                                    : "border-[var(--student-border)] text-[var(--student-muted-strong)] hover:bg-[var(--student-panel-muted)]"
                            )}
                        >
                            Exit Test
                        </button>
                        <div className="flex items-center gap-1">
                            {(["sm", "md", "lg"] as const).map(s => (
                                <button key={s} onClick={() => setFontSize(s)}
                                    className={cn("w-8 h-8 rounded font-bold text-xs", fontSize === s ? (highContrast ? "bg-white text-black" : "bg-[var(--student-accent-strong)] text-white") : (highContrast ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-[var(--student-panel-muted)] text-[var(--student-muted-strong)] hover:bg-[var(--student-panel-solid)]"))}>
                                    {s === "sm" ? "A-" : s === "md" ? "A" : "A+"}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setHighContrast(h => !h)}
                            className={cn("w-10 h-6 rounded-full transition-all relative", highContrast ? "bg-white" : "bg-[var(--student-accent-strong)]/30")}>
                            <span className={cn("absolute top-0.5 w-5 h-5 rounded-full transition-all bg-white shadow", highContrast ? "left-4 bg-black" : "left-0.5")} />
                        </button>
                    </div>

                    <button 
                        onClick={() => setShowSettings(!showSettings)}
                        className="lg:hidden p-2 rounded-lg hover:bg-[var(--student-panel-muted)] transition-colors"
                    >
                        <Gear size={20} weight="bold" />
                    </button>

                    {mode === "mock" && (
                        <button onClick={togglePause} disabled={pauseUsed && !paused}
                            className={cn("hidden xs:flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all",
                                pauseUsed && !paused ? "bg-gray-100 text-gray-300 cursor-not-allowed" : highContrast ? "border border-gray-600 text-gray-200 hover:bg-gray-800" : "bg-[var(--student-support-soft)] text-[var(--student-support)] border border-[var(--student-support-soft-strong)] hover:bg-[#ecd9b5]")}>
                            {paused ? "Resume" : "Pause"}
                        </button>
                    )}
                </div>

                {/* Mobile Settings Popover */}
                {showSettings && (
                    <div className="absolute top-16 right-4 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-slate-400">Appearance</span>
                                <button onClick={() => setShowSettings(false)}><X size={16} /></button>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold">Contrast</span>
                                <button onClick={() => setHighContrast(!highContrast)}
                                    className={cn("w-10 h-6 rounded-full relative transition-all", highContrast ? "bg-black" : "bg-slate-200")}>
                                    <span className={cn("absolute top-0.5 w-5 h-5 rounded-full transition-all bg-white", highContrast ? "right-0.5" : "left-0.5")} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold">Text Size</span>
                                <div className="flex gap-1">
                                    {(["sm", "md", "lg"] as const).map(s => (
                                        <button key={s} onClick={() => setFontSize(s)}
                                            className={cn("w-8 h-8 rounded font-bold text-xs", fontSize === s ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500")}>
                                            {s === "sm" ? "A-" : s === "md" ? "A" : "A+"}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="pt-2 border-t">
                                <button onClick={handleExitExam} className="w-full py-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold uppercase tracking-widest text-center">Exit Test</button>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Progress + status bar */}
            <div className={cn("border-b", highContrast ? "bg-gray-800 border-gray-700" : "bg-[var(--student-panel-solid)] border-[var(--student-border)]")}>
                {/* Progress bar */}
                <div className={cn("h-1", highContrast ? "bg-gray-700" : "bg-[var(--student-panel-muted)]")}>
                    <div className={cn("h-full transition-all", highContrast ? "bg-white" : "bg-[var(--student-accent-strong)]")} style={{ width: `${(answered / questions.length) * 100}%` }} />
                </div>
                <div className={cn("flex items-center gap-4 sm:gap-6 px-4 sm:px-6 py-2 text-[10px] sm:text-xs font-bold overflow-x-auto whitespace-nowrap scrollbar-hide", highContrast ? "text-white" : "text-[var(--student-muted-strong)]")}>
                    <span>✅ <span className="text-[#00cc00]">{answered}</span> <span className="hidden sm:inline">answered</span></span>
                    <span>🟣 <span className="text-[#9b59b6]">{marked}</span> <span className="hidden sm:inline">marked</span></span>
                    <span>⬜ {notVisited} <span className="hidden sm:inline">unvisited</span></span>
                    {mode === "mock" && (
                        <div className="ml-auto flex items-center gap-2">
                            <span className={cn("text-[9px] sm:text-[10px] uppercase tracking-widest", highContrast ? "text-gray-400" : "text-[var(--student-muted)]")}>Time</span>
                            <span className={cn("font-mono font-black text-sm sm:text-base", timeLeft < 300 ? "text-red-500" : highContrast ? "text-white" : "text-[var(--student-text)]")}>{formatTime(timeLeft)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Main layout */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Palette Drawer Overlay */}
                {showPalette && (
                    <div className="fixed inset-0 z-[60] lg:hidden bg-black/50 backdrop-blur-sm" onClick={() => setShowPalette(false)} />
                )}

                {/* Question Palette (Drawer on mobile, Sidebar on desktop) */}
                <aside className={cn(
                    "fixed inset-y-0 left-0 z-[70] w-72 lg:relative lg:inset-auto lg:z-auto lg:w-52 shrink-0 flex flex-col border-r transition-transform duration-300 ease-in-out",
                    highContrast ? "bg-gray-950 border-gray-700" : "bg-[var(--student-panel-solid)] border-[var(--student-border)]",
                    showPalette ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}>
                    <div className={cn("px-4 py-4 lg:py-3 font-bold text-sm border-b flex items-center justify-between", highContrast ? "border-gray-700 text-white" : "border-[var(--student-border)] text-[var(--student-text)]")}>
                        <span>Question Palette</span>
                        <button onClick={() => setShowPalette(false)} className="lg:hidden p-1 rounded-lg hover:bg-slate-100 transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 lg:p-3">
                        <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
                            {questions.map((qItem, i) => (
                                <button key={qItem.id} onClick={() => { setCurrent(i); setShowPalette(false); }}
                                    className={cn("aspect-square rounded-xl font-bold text-xs transition-all hover:opacity-90 active:scale-95 flex items-center justify-center",
                                        highContrast ? "border border-gray-700 bg-gray-800 text-gray-200" : paletteColor(answers[qItem.id]?.status ?? "not-visited"),
                                        current === i && (highContrast ? "ring-2 ring-white ring-offset-1 ring-offset-black scale-110" : "ring-2 ring-[var(--student-accent)] ring-offset-2 scale-110"))}>
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="p-4 border-t space-y-2 text-[10px]">
                        {[["bg-[var(--student-accent-strong)]", `Answered: ${answered}`], ["bg-rose-500", `Not Answered: ${notAnswered}`], ["bg-[var(--student-support)]", `Marked: ${marked}`], ["bg-[var(--student-panel-solid)] border border-[var(--student-border)]", `Not Visited: ${notVisited}`]].map(([cls, lbl]) => (
                            <div key={lbl} className="flex items-center gap-2"><span className={cn("w-3.5 h-3.5 rounded-full shrink-0", highContrast ? "border border-gray-600 bg-gray-800" : cls)} /><span className={highContrast ? "text-gray-300" : "text-[var(--student-muted)]"}>{lbl}</span></div>
                        ))}
                    </div>
                </aside>

                {/* Question area */}
                <main className="flex-1 flex flex-col overflow-y-auto">
                    {/* Question header */}
                    <div className={cn("flex items-center gap-3 px-8 py-4 border-b flex-wrap", highContrast ? "bg-gray-800 border-gray-700" : "bg-[var(--student-panel-solid)] border-[var(--student-border)]")}>
                        <span className={cn("px-3 py-1 rounded-full font-bold text-[11px]", highContrast ? "bg-gray-700 text-white" : "bg-[var(--student-accent-soft)] text-[var(--student-accent-strong)]")}>Q {q.no}/{questions.length}</span>
                        <span className={cn("px-3 py-1 rounded-full font-bold text-[11px]", highContrast ? "bg-gray-700 text-white" : "bg-[var(--student-support-soft)] text-[var(--student-support)]")}>{q.marks} Mark</span>
                        <span className={cn("px-3 py-1 rounded-full font-bold text-[11px]",
                            q.difficulty === "EASY" ? "bg-[#e5f0e9] text-[var(--student-success)]" : q.difficulty === "HARD" ? "bg-rose-50 text-rose-500" : "bg-[var(--student-support-soft)] text-[var(--student-support)]")}>
                            {q.difficulty}
                        </span>
                        {q.topic && <span className={cn("px-3 py-1 rounded-full font-bold text-[11px]", highContrast ? "bg-gray-700 text-gray-200" : "bg-[var(--student-panel-muted)] text-[var(--student-muted-strong)]")}>{q.topic}</span>}
                        {currentCaseBundle && (
                            <span className={cn("px-3 py-1 rounded-full font-bold text-[11px]", highContrast ? "bg-gray-700 text-amber-200" : "bg-amber-50 text-amber-700 border border-amber-200")}>
                                Case {currentCaseBundle.position} of {currentCaseBundle.totalQuestions}
                            </span>
                        )}
                    </div>

                    {/* Question text + options */}
                    <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                        {q.caseStudy && (
                            <div className={cn("h-1/2 lg:h-auto lg:flex-1 p-6 sm:p-8 overflow-y-auto border-b lg:border-b-0 lg:border-r", highContrast ? "bg-gray-950 border-gray-700" : "bg-slate-50/30 border-[var(--student-border)]")}>
                                <div className="mb-4 flex flex-wrap items-center gap-2">
                                    <div className={cn("inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", highContrast ? "bg-gray-800 text-gray-400" : "bg-slate-200 text-slate-500")}>Case Scenario</div>
                                    {currentCaseBundle && (
                                        <span className={cn("rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest", highContrast ? "bg-gray-800 text-amber-200" : "bg-amber-50 text-amber-700 border border-amber-200")}>
                                            {currentCaseBundle.totalQuestions} linked MCQs
                                        </span>
                                    )}
                                </div>
                                <h3 className={cn("text-xl font-black mb-4", highContrast ? "text-white" : "text-[var(--student-text)]")}>{q.caseStudy.title}</h3>
                                <div className={cn("prose prose-sm max-w-none leading-relaxed select-none", fontClass, highContrast ? "text-gray-300" : "text-[var(--student-text)]")}>
                                    {q.caseStudy.content.split('\n').map((para, pi) => para.trim() ? <p key={pi} className="mb-4">{para}</p> : null)}
                                </div>
                            </div>
                        )}
                        
                        <div className={cn("flex-1 p-6 sm:p-8 overflow-y-auto", q.caseStudy ? "w-full lg:w-1/2" : "w-full")}>
                            {currentCaseBundle && (
                                <div className={cn("mb-6 rounded-[24px] border p-5", highContrast ? "border-gray-700 bg-gray-900" : "border-amber-200 bg-amber-50/70")}>
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                        <div className="space-y-1">
                                            <div className={cn("text-[10px] font-black uppercase tracking-widest", highContrast ? "text-amber-200" : "text-amber-700")}>
                                                Integrated case bundle
                                            </div>
                                            <div className={cn("text-sm font-bold", highContrast ? "text-white" : "text-[var(--student-text)]")}>
                                                Question {currentCaseBundle.position} of {currentCaseBundle.totalQuestions} tied to this scenario
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {currentCaseBundle.questionIds.map((questionId, index) => (
                                                <button
                                                    key={questionId}
                                                    onClick={() => {
                                                        const bundleIndex = questions.findIndex((question) => question.id === questionId);
                                                        if (bundleIndex >= 0) {
                                                            setCurrent(bundleIndex);
                                                        }
                                                    }}
                                                    className={cn(
                                                        "min-w-10 rounded-xl border px-3 py-2 text-[11px] font-black transition-all",
                                                        questionId === q.id
                                                            ? highContrast
                                                                ? "border-white bg-white text-black"
                                                                : "border-amber-500 bg-amber-500 text-white"
                                                            : highContrast
                                                                ? "border-gray-700 bg-gray-800 text-gray-200 hover:border-gray-500"
                                                                : "border-amber-200 bg-white text-amber-700 hover:border-amber-400",
                                                    )}
                                                >
                                                    Q{currentCaseBundle.questionNumbers[index]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className={cn("mb-2 text-[10px] font-black uppercase tracking-widest", highContrast ? "text-gray-500" : "text-[var(--student-muted)]")}>QUESTION {q.no}</div>
                            <p className={cn("font-semibold leading-relaxed mb-8 select-none", fontClass, highContrast ? "text-white" : "text-[var(--student-text)]")}>{q.text}</p>
    
                            <div className="space-y-3 mb-8">
                                {q.options.map((opt, oi) => {
                                    const selected = ans.optionId === opt.id;
                                    const showCorrect = (mode === "practice" && showPracticeAnswer) || false;
                                    const isCorrectOpt = opt.isCorrect;
                                    return (
                                        <button key={opt.id} onClick={() => !showPracticeAnswer && selectOption(opt.id)}
                                            className={cn("w-full flex items-center gap-4 p-4 rounded-[20px] border text-left transition-all duration-300", fontClass,
                                                showCorrect && isCorrectOpt ? "border-[#2f7d55] bg-[#e5f0e9] hover:shadow-md hover:-translate-y-0.5" :
                                                    showCorrect && selected && !isCorrectOpt ? "border-rose-400 bg-rose-50 hover:shadow-md hover:-translate-y-0.5" :
                                                        selected ? highContrast ? "border-white bg-slate-800 text-white" : "border-[var(--student-accent-strong)] bg-[var(--student-accent-soft)] text-[var(--student-text)] shadow-md shadow-[rgba(31,92,80,0.10)] hover:-translate-y-0.5" :
                                                            highContrast ? "border-slate-700 bg-slate-800 hover:border-slate-500 hover:-translate-y-0.5" :
                                                                "border-[var(--student-border)] bg-[var(--student-panel-solid)] hover:border-[var(--student-accent-soft-strong)] hover:bg-[var(--student-panel-muted)] hover:-translate-y-0.5")}>
                                            <span className={cn("flex items-center gap-4 select-none")}>
                                                <span className={cn("w-8 h-8 rounded-[10px] flex items-center justify-center font-bold text-sm shrink-0 shadow-sm transition-colors",
                                                    showCorrect && isCorrectOpt ? "bg-[#2f7d55] text-white shadow-[rgba(47,125,85,0.2)]" :
                                                        showCorrect && selected && !isCorrectOpt ? "bg-rose-500 text-white shadow-rose-500/20" :
                                                            selected ? highContrast ? "bg-white text-black" : "bg-[var(--student-accent-strong)] text-white shadow-[rgba(31,92,80,0.2)]" : highContrast ? "bg-slate-700 text-slate-300" : "bg-[var(--student-panel-muted)] text-[var(--student-muted)]")}>
                                                    {["A", "B", "C", "D", "E"][oi]}
                                                </span>
                                                <span className={highContrast ? "text-gray-200" : "text-[var(--student-text)]"}>{opt.text}</span>
                                            </span>
                                            {showCorrect && isCorrectOpt && <span className="ml-auto text-[#2f7d55] font-black shrink-0">Correct</span>}
                                            {showCorrect && selected && !isCorrectOpt && <span className="ml-auto text-rose-500 font-black shrink-0">Wrong</span>}
                                        </button>
                                    );
                                })}
                            </div>
    
                            {/* Practice mode explanation */}
                            {mode === "practice" && showPracticeAnswer && q.explanation && (
                                <div className={cn("flex gap-3 p-4 rounded-2xl border mb-6", highContrast ? "bg-gray-900 border-gray-700" : "bg-[var(--student-accent-soft)] border-[var(--student-accent-soft-strong)]")}>
                                    <span className={cn("shrink-0", highContrast ? "text-gray-300" : "text-[var(--student-accent-strong)]")}>i</span>
                                    <div>
                                        <div className={cn("text-[10px] font-black uppercase tracking-widest mb-1", highContrast ? "text-gray-400" : "text-[var(--student-accent-strong)]")}>Explanation</div>
                                        <p className={cn("text-sm leading-relaxed select-none", highContrast ? "text-gray-200" : "text-[var(--student-text)]")}>{q.explanation}</p>
                                    </div>
                                </div>
                            )}
    
                            {/* Confidence tagging */}
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-1">Confidence:</span>
                                {(["sure", "unsure", "guess"] as const).map(c => {
                                    const styles = { sure: "bg-green-50 text-green-600 border-green-200", unsure: "bg-amber-50 text-amber-600 border-amber-200", guess: "bg-rose-50 text-rose-600 border-rose-200" };
                                    const active = { sure: "bg-green-500 text-white border-green-500", unsure: "bg-amber-500 text-white border-amber-500", guess: "bg-rose-500 text-white border-rose-500" };
                                    return (
                                        <button key={c} onClick={() => setConfidence(c)}
                                            className={cn("px-3 py-1 rounded-full border font-bold text-[11px] transition-all capitalize", ans.confidence === c ? active[c] : styles[c])}>
                                            {c === "sure" ? "🟢 Sure" : c === "unsure" ? "🟡 Unsure" : "🔴 Guess"}
                                        </button>
                                    );
                                })}
                            </div>
                            {negativeMarkingEnabled && (
                                <p className={cn("mt-3 text-[11px] font-bold uppercase tracking-widest", highContrast ? "text-rose-200" : "text-rose-600")}>
                                    Guesses that miss will cost {ICAI_NEGATIVE_MARKING_PENALTY} marks in simulator mode.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Bottom action bar */}
                    <div className={cn("sticky bottom-0 z-30 flex items-center justify-between px-4 sm:px-8 py-4 border-t gap-2 sm:gap-4 flex-wrap sm:flex-nowrap", highContrast ? "bg-gray-900 border-gray-700" : "bg-[var(--student-panel-solid)] border-[var(--student-border)]")}>
                        <div className="flex items-center gap-2 flex-1 sm:flex-none justify-between sm:justify-start">
                            <div className="flex items-center gap-2">
                                <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
                                    className={cn("h-11 px-4 sm:px-5 flex items-center justify-center rounded-xl border font-black text-xs sm:text-sm disabled:opacity-30", highContrast ? "border-gray-600 text-gray-300 hover:bg-gray-800" : "border-[var(--student-border)] text-[var(--student-muted-strong)] hover:bg-[var(--student-panel-muted)]")}>
                                    <CaretLeft size={16} weight="bold" />
                                </button>
                                <button onClick={() => { if (current < questions.length - 1) setCurrent(c => c + 1); }} disabled={current === questions.length - 1}
                                    className={cn("h-11 px-4 sm:px-6 flex items-center justify-center rounded-xl font-black text-xs sm:text-sm disabled:opacity-30 transition-all", highContrast ? "bg-white text-black hover:bg-gray-200" : "bg-[var(--student-accent-strong)] text-white hover:bg-[#18493f] shadow-lg shadow-[rgba(31,92,80,0.18)]")}>
                                    Next <CaretRight size={16} weight="bold" className="ml-1" />
                                </button>
                            </div>
                            
                            <button onClick={markForReview} className={cn("flex-1 sm:flex-none h-11 flex items-center justify-center gap-2 px-4 sm:px-6 rounded-xl border-2 font-black text-[10px] sm:text-xs uppercase tracking-widest", highContrast ? "border-gray-500 text-gray-100 hover:bg-gray-800" : "border-[var(--student-support)] text-[var(--student-support)] hover:bg-[var(--student-support-soft)]")}>
                                <Info size={16} weight="fill" className="hidden xs:block" /> Mark
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-1 sm:flex-none w-full sm:w-auto">
                            <button onClick={clearAnswer} className={cn("flex-1 sm:flex-none h-11 px-6 rounded-xl border font-black text-[10px] sm:text-xs uppercase tracking-widest", highContrast ? "border-gray-600 text-gray-300 hover:bg-gray-800" : "border-[var(--student-border)] text-[var(--student-muted-strong)] hover:bg-[var(--student-panel-muted)]")}>
                                Clear
                            </button>
                            <button onClick={() => void handleFinalSubmit()}
                                className={cn("flex-1 sm:flex-none h-11 flex items-center justify-center gap-2 px-8 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-wider transition-all", highContrast ? "bg-rose-500 text-white hover:bg-rose-600" : "bg-slate-900 text-white hover:bg-black shadow-lg shadow-black/10")}>
                                <CheckCircle size={18} weight="fill" /> Final Submit
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default function MCQExamPage() {
    return (
        <Suspense fallback={<LoadingScreen msg="Initializing exam environment..." />}>
            <ExamWarRoomContent />
        </Suspense>
    );
}
