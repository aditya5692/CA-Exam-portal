"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { getExamDetails, submitExamAttempt, type ExamWithQuestions } from "@/actions/exam-actions";
import { startMyExamAttempt } from "@/actions/student-actions";
import { saveExamResultsAndUpdateLearning } from "@/actions/learning-actions";
import { 
    Users, 
    ChartBar, 
    DownloadSimple, 
    FileText,
    ArrowRight,
    CaretRight,
    Spinner,
    Check
} from "@phosphor-icons/react";

// ── Types ────────────────────────────────────────────────────────────────────
type OptionShape = { id: string; text: string; isCorrect?: boolean };
type QuestionShape = { id: string; no: number; marks: number; difficulty: string; subject: string; topic?: string | null; text: string; options: OptionShape[]; explanation?: string | null };
type AnswerStatus = "answered" | "not-answered" | "marked" | "answered-marked" | "not-visited";
type Answer = { optionId: string | null; status: AnswerStatus; startedAt: number; confidence: "sure" | "unsure" | "guess" | null };


// ── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(s: number) { return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; }
function paletteColor(status: AnswerStatus) {
    if (status === "answered") return "bg-[#00cc00] text-white";
    if (status === "not-answered") return "bg-[#e05050] text-white";
    if (status === "marked" || status === "answered-marked") return "bg-[#9b59b6] text-white";
    return "bg-white border border-gray-300 text-gray-600";
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
        <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center">
            <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin mx-auto" />
                <p className="text-gray-600 font-semibold">{msg}</p>
            </div>
        </div>
    );
}



// ── Main component ────────────────────────────────────────────────────────────
export default function MCQExamPage() {
    const searchParams = useSearchParams();
    const examId = searchParams.get("examId");
    const modeParam = searchParams.get("mode");

    // Exam data
    const [questions, setQuestions] = useState<QuestionShape[]>([]);
    const [examTitle, setExamTitle] = useState("CA MCQ Series");
    const [examDuration, setExamDuration] = useState(40 * 60);
    const [examCategory, setExamCategory] = useState("");
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

    // Results state
    const [resultData, setResultData] = useState<{ correct: number; total: number; xpGained: number; timeUsed: number; topicList: { topic: string; accuracy: number; correct: number; total: number }[] } | null>(null);

    const startedAtRef = useRef(Date.now());

    // ── Load exam details ───────────────────────────────────────────────────────
    useEffect(() => {
        async function load() {
            if (!examId) {
                setQuestions(DEMO_QUESTIONS);
                setExamDuration(20 * 60);
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
            }));
            setQuestions(mapped);
            setExamTitle(exam.title);
            setExamCategory(exam.category);
            const dur = exam.duration * 60;
            setExamDuration(dur);
            setTimeLeft(dur);
            setAnswers(Object.fromEntries(mapped.map(q => [q.id, { optionId: null, status: "not-visited" as AnswerStatus, startedAt: Date.now(), confidence: null }])));

            // Auto start the exam
            startedAtRef.current = Date.now();
            const r = await startMyExamAttempt(examId);
            if (r.success && r.data) { 
                setAttemptId(r.data.attemptId); 
                setStudentId(r.data.studentId); 
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
        questions.forEach(q => {
            const a = answers[q.id];
            const isCorrect = a?.optionId ? (q.options.find(o => o.id === a.optionId)?.isCorrect ?? false) : false;
            if (isCorrect) correctCount++;
            const key = q.topic ?? q.subject ?? "General";
            const e = topicMap.get(key) ?? { correct: 0, total: 0 };
            topicMap.set(key, { correct: e.correct + (isCorrect ? 1 : 0), total: e.total + 1 });
        });
        const xpGained = correctCount * 5 + (Math.round((correctCount / questions.length) * 100) >= 80 ? 20 : 0);
        const topicList = Array.from(topicMap.entries())
            .map(([topic, d]) => ({ topic, accuracy: Math.round((d.correct / d.total) * 100), correct: d.correct, total: d.total }))
            .sort((a, b) => a.accuracy - b.accuracy);

        // Save to DB only in mock mode
        if (mode === "mock" && attemptId && studentId) {
            const payload = questions.filter(q => answers[q.id]?.optionId).map(q => ({
                questionId: q.id,
                selectedOptionId: answers[q.id].optionId!,
                timeSpent: Math.max(1, Math.round((now - (answers[q.id].startedAt ?? now)) / 1000)),
            }));
            await submitExamAttempt(attemptId, payload);
            await saveExamResultsAndUpdateLearning(studentId, examId ?? "", attemptId,
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
        setResultData({ correct: correctCount, total: questions.length, xpGained, timeUsed, topicList });
        setPhase("results");
    }, [phase, questions, answers, mode, attemptId, studentId, examId, examDuration]);

    // ── Answer interactions ────────────────────────────────────────────────────
    const selectOption = (optId: string) => {
        const qId = questions[current]?.id; if (!qId) return;
        setAnswers(prev => ({ ...prev, [qId]: { ...prev[qId], optionId: optId, status: prev[qId].status === "marked" ? "answered-marked" : "answered" } }));
        if (mode === "practice") setShowPracticeAnswer(true);
    };
    const clearAnswer = () => {
        const qId = questions[current]?.id; if (!qId) return;
        setAnswers(prev => ({ ...prev, [qId]: { ...prev[qId], optionId: null, status: "not-answered" } }));
        setShowPracticeAnswer(false);
    };
    const markForReview = () => {
        const qId = questions[current]?.id; if (!qId) return;
        setAnswers(prev => { const c = prev[qId]; return { ...prev, [qId]: { ...c, status: c.optionId ? "answered-marked" : "marked" } }; });
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

    // Counts
    const answered = Object.values(answers).filter(a => a.status === "answered" || a.status === "answered-marked").length;
    const notAnswered = Object.values(answers).filter(a => a.status === "not-answered").length;
    const marked = Object.values(answers).filter(a => a.status === "marked" || a.status === "answered-marked").length;
    const notVisited = Object.values(answers).filter(a => a.status === "not-visited").length;
    const fontClass = { sm: "text-sm", md: "text-base", lg: "text-lg" }[fontSize];

    // ── Render phases ──────────────────────────────────────────────────────────
    if (isLoading) return <LoadingScreen msg="Preparing your exam Environment…" />;
    if (questions.length === 0) return <LoadingScreen msg="Fetching questions…" />;

    if (phase === "submitting") return <LoadingScreen msg="Submitting your answers…" />;

    // ── Results screen ─────────────────────────────────────────────────────────
    if (phase === "results" && resultData) {
        const { correct, total, xpGained, timeUsed, topicList } = resultData;
        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
        const scoreColor = accuracy >= 80 ? "#22c55e" : accuracy >= 55 ? "#f59e0b" : "#ef4444";
        const weakTopics = topicList.filter(t => t.accuracy < 60);
        const reviewItems = questions.map(q => ({ ...q, answer: answers[q.id] }));
        const filtered = solFilter === "all" ? reviewItems : solFilter === "wrong"
            ? reviewItems.filter(item => !(item.answer?.optionId && (item.options.find(o => o.id === item.answer?.optionId)?.isCorrect)))
            : reviewItems.filter(item => item.answer?.optionId && item.options.find(o => o.id === item.answer?.optionId)?.isCorrect);

        return (
            <div className="min-h-screen bg-[#f5f7fa] pb-20">
                {/* Hero */}
                <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white px-8 py-12 shadow-[0_4px_24px_rgba(0,0,0,0.1)]">
                    <div className="max-w-5xl mx-auto grid md:grid-cols-[auto_1fr] gap-10 items-center">
                        <div className="relative w-36 h-36 shrink-0">
                            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                                <circle cx="50" cy="50" r="42" fill="none" stroke={scoreColor} strokeWidth="10" strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 42}`}
                                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - accuracy / 100)}`}
                                    style={{ transition: "stroke-dashoffset 1s ease" }} />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-black">{accuracy}%</span>
                                <span className="text-[10px] text-white/40 font-bold uppercase">Accuracy</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex gap-2 flex-wrap">
                                <span className="px-3 py-1 rounded-full bg-white/10 text-white/60 text-[10px] font-bold uppercase">{examTitle}</span>
                                {mode === "practice" && <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold">📖 Practice Mode</span>}
                                {mode === "mock" && attemptId && <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold">✅ Saved to profile</span>}
                            </div>
                            <h1 className="text-3xl font-black">{accuracy >= 80 ? "Excellent! 🎉" : accuracy >= 55 ? "Good Work 👍" : "Keep Practising 📚"}</h1>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { v: `${correct}/${total}`, l: "Correct" },
                                    { v: total - correct, l: "Wrong" },
                                    { v: notVisited, l: "Skipped" },
                                    { v: `${Math.floor(timeUsed / 60)}m ${timeUsed % 60}s`, l: "Time" },
                                ].map(s => (
                                    <div key={s.l} className="p-3 rounded-[16px] bg-white/5 border border-white/10 text-center shadow-inner">
                                        <div className="text-xl font-black">{s.v}</div>
                                        <div className="text-[10px] text-white/40 uppercase tracking-[0.2em]">{s.l}</div>
                                    </div>
                                ))}
                            </div>
                            {mode === "mock" && (
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                                    <span className="text-amber-400 font-black">⚡ +{xpGained} XP</span>
                                    {correct === total && <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">🏆 Perfect Score</span>}
                                    {accuracy >= 80 && correct < total && <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-bold">🎯 High Accuracy</span>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-8 mt-10 space-y-8">
                    {/* Topic breakdown */}
                    {topicList.length > 0 && (
                        <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
                            <h2 className="font-bold font-outfit text-slate-900 mb-5">📊 Topic-wise Performance</h2>
                            <div className="space-y-3">
                                {topicList.map(t => {
                                    const c = t.accuracy >= 80 ? "#22c55e" : t.accuracy >= 55 ? "#f59e0b" : "#ef4444";
                                    return (
                                        <div key={t.topic} className="flex items-center gap-4">
                                            <span className="w-40 text-xs font-bold text-slate-700 truncate shrink-0">{t.topic}</span>
                                            <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width: `${t.accuracy}%`, backgroundColor: c }} />
                                            </div>
                                            <span className="text-sm font-bold w-10 text-right" style={{ color: c }}>{t.accuracy}%</span>
                                            <span className="text-xs text-slate-400 w-16 text-right">{t.correct}/{t.total}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Weak topic focus */}
                    {weakTopics.length > 0 && (
                        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6">
                            <h2 className="font-black text-rose-700 mb-4">🎯 Focus On These Topics</h2>
                            <div className="grid sm:grid-cols-2 gap-3">
                                {weakTopics.map((t, i) => (
                                    <div key={t.topic} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-rose-100">
                                        <span className="w-6 h-6 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                                        <div><div className="text-sm font-bold text-gray-900">{t.topic}</div><div className="text-[10px] text-rose-500">{t.accuracy}% · review in {t.accuracy < 40 ? "1 day" : "3 days"}</div></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Solution Review */}
                    <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
                        <h2 className="font-bold font-outfit text-slate-900 mb-4">📋 Solution Review</h2>
                        <div className="flex gap-2 mb-5 flex-wrap">
                            {([["all", `All (${questions.length})`], ["wrong", `❌ Wrong (${questions.length - correct})`], ["correct", `✅ Correct (${correct})`]] as const).map(([key, label]) => (
                                <button key={key} onClick={() => setSolFilter(key as "all" | "wrong" | "correct")}
                                    className={cn("px-4 py-2 rounded-xl font-bold text-sm transition-all",
                                        solFilter === key ? (key === "wrong" ? "bg-rose-500 text-white" : key === "correct" ? "bg-emerald-500 text-white" : "bg-indigo-600 text-white") : "bg-gray-100 text-gray-500 hover:bg-gray-200")}>
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
                                    <div key={item.id} className={cn("p-5 rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)]", isCorrect ? "border-emerald-100 bg-emerald-50/50" : "border-rose-100 bg-rose-50/50")}>
                                        <div className="flex items-start gap-3 mb-3">
                                            <span className={cn("w-8 h-8 rounded-[12px] flex items-center justify-center font-bold text-sm shrink-0 shadow-sm", isCorrect ? "bg-emerald-100 text-emerald-700 shadow-emerald-500/10" : "bg-rose-100 text-rose-700 shadow-rose-500/10")}>{idx + 1}</span>
                                            <div className="flex-1">
                                                <div className="flex gap-2 flex-wrap mb-2">
                                                    {item.topic && <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold">{item.topic}</span>}
                                                    {conf && <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", conf === "sure" ? "bg-green-50 text-green-600" : conf === "unsure" ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600")}>You were {conf}</span>}
                                                    {!chosen && <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 text-[10px] font-bold">⏭ Skipped</span>}
                                                </div>
                                                <p className="font-semibold text-gray-900 text-sm leading-relaxed">{item.text}</p>
                                            </div>
                                        </div>
                                        <div className="grid sm:grid-cols-2 gap-2 ml-11">
                                            {item.options.map((opt, oi) => {
                                                const isChosen = opt.id === chosen;
                                                return (
                                                    <div key={opt.id} className={cn("p-3 rounded-[16px] border text-sm font-medium flex items-center justify-between gap-2 transition-all",
                                                        opt.isCorrect ? "bg-emerald-50 border-emerald-200 text-emerald-800" : isChosen ? "bg-rose-50 border-rose-200 text-rose-800" : "bg-white border-slate-100 text-slate-500")}>
                                                        <span className="flex items-center gap-2">
                                                            <span className={cn("w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0",
                                                                opt.isCorrect ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" : isChosen ? "bg-rose-500 text-white shadow-md shadow-rose-500/20" : "bg-slate-100 text-slate-500")}>
                                                                {["A", "B", "C", "D"][oi]}
                                                            </span>{opt.text}
                                                        </span>
                                                        {opt.isCorrect && <span className="text-emerald-500 shrink-0">✓</span>}
                                                        {isChosen && !opt.isCorrect && <span className="text-rose-500 shrink-0">✗</span>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {item.explanation && (
                                            <div className="ml-11 mt-3 flex gap-2 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                                                <span className="text-indigo-400 shrink-0">💡</span>
                                                <p className="text-xs text-gray-700 leading-relaxed">{item.explanation}</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 flex-wrap">
                        <button onClick={() => window.history.back()} className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">← Back to Hub</button>
                        <button onClick={() => { window.location.href = "/student/history"; }} className="flex-1 py-4 rounded-2xl bg-white border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50">📜 History</button>
                        {attemptId && <button onClick={() => { window.location.href = `/student/results/${attemptId}`; }} className="flex-1 py-4 rounded-2xl bg-white border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50">🔗 Full Results Page</button>}
                    </div>
                </div>
            </div>
        );
    }

    // ── NTA Exam UI ───────────────────────────────────────────────────────────
    const q = questions[current];
    const ans = answers[q.id] ?? { optionId: null, status: "not-visited" as AnswerStatus, startedAt: Date.now(), confidence: null };

    return (
        <div className={cn("min-h-screen flex flex-col", highContrast ? "bg-black text-white" : "bg-[#f5f7fa]")}>
            {/* Pause overlay */}
            {paused && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white rounded-3xl p-10 text-center shadow-2xl space-y-4 max-w-sm mx-4">
                        <div className="text-5xl">⏸</div>
                        <h2 className="text-2xl font-black text-gray-900">Exam Paused</h2>
                        <p className="text-gray-400 text-sm">Timer is stopped. Take a breath.</p>
                        <button onClick={togglePause} className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-black text-lg hover:bg-indigo-700 transition-all">▶ Resume</button>
                    </div>
                </div>
            )}

            {/* Top Bar */}
            <header className={cn("flex items-center justify-between px-6 py-3 shadow-sm border-b", highContrast ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200")}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded flex items-center justify-center font-black text-white text-xs bg-indigo-700">NTA</div>
                    <div>
                        <div className={cn("font-bold text-sm", highContrast ? "text-white" : "text-gray-900")}>{examTitle}</div>
                        <div className="text-[10px] text-gray-400">{examCategory} · {questions.length} Questions</div>
                    </div>
                    {mode === "practice" && <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100">📖 Practice Mode</span>}
                </div>
                <div className="flex items-center gap-3">
                    {/* Font size */}
                    <div className="hidden sm:flex items-center gap-1">
                        {(["sm", "md", "lg"] as const).map(s => (
                            <button key={s} onClick={() => setFontSize(s)}
                                className={cn("w-8 h-8 rounded font-bold text-xs", fontSize === s ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
                                {s === "sm" ? "A-" : s === "md" ? "A" : "A+"}
                            </button>
                        ))}
                    </div>
                    {/* High contrast */}
                    <button onClick={() => setHighContrast(h => !h)}
                        className={cn("w-10 h-6 rounded-full transition-all relative", highContrast ? "bg-indigo-600" : "bg-gray-200")}>
                        <span className={cn("absolute top-0.5 w-5 h-5 rounded-full transition-all bg-white shadow", highContrast ? "left-4" : "left-0.5")} />
                    </button>
                    {/* Pause (mock mode only) */}
                    {mode === "mock" && (
                        <button onClick={togglePause} disabled={pauseUsed && !paused}
                            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all",
                                pauseUsed && !paused ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100")}>
                            {paused ? "▶ Resume" : "⏸ Pause"}
                            {!pauseUsed && <span className="text-[9px] text-amber-400">(1×)</span>}
                        </button>
                    )}
                </div>
            </header>

            {/* Progress + status bar */}
            <div className={cn("border-b", highContrast ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100")}>
                {/* Progress bar */}
                <div className="h-1 bg-gray-100">
                    <div className="h-full bg-indigo-500 transition-all" style={{ width: `${(answered / questions.length) * 100}%` }} />
                </div>
                <div className={cn("flex items-center gap-6 px-6 py-2 text-xs font-bold", highContrast ? "text-white" : "text-gray-600")}>
                    <span>✅ <span className="text-[#00cc00]">{answered}</span> answered</span>
                    <span>🟣 <span className="text-[#9b59b6]">{marked}</span> marked</span>
                    <span>⬜ {notVisited} unvisited</span>
                    {mode === "mock" && (
                        <div className="ml-auto flex items-center gap-2">
                            <span className="text-gray-400 text-[10px] uppercase tracking-widest">Time Left</span>
                            <span className={cn("font-mono font-black text-base", timeLeft < 300 ? "text-red-500" : highContrast ? "text-white" : "text-gray-900")}>{formatTime(timeLeft)}</span>
                        </div>
                    )}
                    {mode === "practice" && <span className="ml-auto text-blue-500 font-medium">📖 No Timer · {answered}/{questions.length} done</span>}
                </div>
            </div>

            {/* Main layout */}
            <div className="flex flex-1 overflow-hidden">
                {/* Palette sidebar */}
                <aside className={cn("w-52 shrink-0 flex flex-col border-r overflow-y-auto", highContrast ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200")}>
                    <div className={cn("px-4 py-3 font-bold text-sm border-b", highContrast ? "border-gray-700 text-white" : "border-gray-100 text-gray-800")}>Question Palette</div>
                    <div className="px-3 py-3 grid grid-cols-4 gap-1.5">
                        {questions.map((qItem, i) => (
                            <button key={qItem.id} onClick={() => setCurrent(i)}
                                className={cn("w-10 h-10 rounded-lg font-bold text-xs transition-all hover:opacity-90 active:scale-95",
                                    paletteColor(answers[qItem.id]?.status ?? "not-visited"),
                                    current === i && "ring-2 ring-indigo-400 ring-offset-1")}>
                                {i + 1}
                            </button>
                        ))}
                    </div>
                    <div className="px-4 py-2 space-y-1 text-[10px]">
                        {[["bg-[#00cc00]", `Answered: ${answered}`], ["bg-[#e05050]", `Not Answered: ${notAnswered}`], ["bg-[#9b59b6]", `Marked: ${marked}`], ["bg-white border border-gray-300", `Not Visited: ${notVisited}`]].map(([cls, lbl]) => (
                            <div key={lbl} className="flex items-center gap-2"><span className={cn("w-4 h-4 rounded-full shrink-0", cls)} /><span className={highContrast ? "text-gray-300" : "text-gray-500"}>{lbl}</span></div>
                        ))}
                    </div>
                </aside>

                {/* Question area */}
                <main className="flex-1 flex flex-col overflow-y-auto">
                    {/* Question header */}
                    <div className={cn("flex items-center gap-3 px-8 py-4 border-b flex-wrap", highContrast ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100")}>
                        <span className={cn("px-3 py-1 rounded-full font-bold text-[11px]", highContrast ? "bg-indigo-900 text-indigo-300" : "bg-indigo-50 text-indigo-600")}>Q {q.no}/{questions.length}</span>
                        <span className={cn("px-3 py-1 rounded-full font-bold text-[11px]", highContrast ? "bg-amber-900 text-amber-300" : "bg-amber-50 text-amber-600")}>{q.marks} Mark</span>
                        <span className={cn("px-3 py-1 rounded-full font-bold text-[11px]",
                            q.difficulty === "EASY" ? "bg-green-50 text-green-600" : q.difficulty === "HARD" ? "bg-rose-50 text-rose-500" : "bg-orange-50 text-orange-600")}>
                            {q.difficulty}
                        </span>
                        {q.topic && <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-bold text-[11px]">{q.topic}</span>}
                    </div>

                    {/* Question text + options */}
                    <div className="px-8 py-8 flex-1">
                        <div className={cn("mb-2 text-[10px] font-black uppercase tracking-widest", highContrast ? "text-gray-500" : "text-gray-400")}>QUESTION</div>
                        <p className={cn("font-semibold leading-relaxed mb-8", fontClass, highContrast ? "text-white" : "text-gray-900")}>{q.text}</p>

                        <div className="space-y-3 mb-8">
                            {q.options.map((opt, oi) => {
                                const selected = ans.optionId === opt.id;
                                const showCorrect = (mode === "practice" && showPracticeAnswer) || false;
                                const isCorrectOpt = opt.isCorrect;
                                return (
                                    <button key={opt.id} onClick={() => !showPracticeAnswer && selectOption(opt.id)}
                                        className={cn("w-full flex items-center gap-4 p-4 rounded-[20px] border text-left transition-all duration-300", fontClass,
                                            showCorrect && isCorrectOpt ? "border-emerald-500 bg-emerald-50 hover:shadow-md hover:-translate-y-0.5" :
                                                showCorrect && selected && !isCorrectOpt ? "border-rose-400 bg-rose-50 hover:shadow-md hover:-translate-y-0.5" :
                                                    selected ? "border-indigo-600 bg-indigo-50/80 text-indigo-950 shadow-md shadow-indigo-600/10 hover:-translate-y-0.5" :
                                                        highContrast ? "border-slate-700 bg-slate-800 hover:border-slate-500 hover:-translate-y-0.5" :
                                                            "border-slate-100 bg-white hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-[0_8px_30px_rgb(79,70,229,0.06)] hover:-translate-y-0.5")}>
                                        <span className={cn("w-8 h-8 rounded-[10px] flex items-center justify-center font-bold text-sm shrink-0 shadow-sm transition-colors",
                                            showCorrect && isCorrectOpt ? "bg-emerald-500 text-white shadow-emerald-500/20" :
                                                showCorrect && selected && !isCorrectOpt ? "bg-rose-500 text-white shadow-rose-500/20" :
                                                    selected ? "bg-indigo-600 text-white shadow-indigo-600/20" : highContrast ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-500")}>
                                            {["A", "B", "C", "D", "E"][oi]}
                                        </span>
                                        <span className={highContrast ? "text-gray-200" : "text-gray-800"}>{opt.text}</span>
                                        {showCorrect && isCorrectOpt && <span className="ml-auto text-emerald-500 font-black shrink-0">✓ Correct</span>}
                                        {showCorrect && selected && !isCorrectOpt && <span className="ml-auto text-rose-500 font-black shrink-0">✗ Wrong</span>}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Practice mode explanation */}
                        {mode === "practice" && showPracticeAnswer && q.explanation && (
                            <div className="flex gap-3 p-4 rounded-2xl bg-indigo-50 border border-indigo-100 mb-6">
                                <span className="text-indigo-500 shrink-0">💡</span>
                                <div>
                                    <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Explanation</div>
                                    <p className="text-sm text-gray-700 leading-relaxed">{q.explanation}</p>
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
                    </div>

                    {/* Bottom action bar */}
                    <div className={cn("sticky bottom-0 flex items-center justify-between px-8 py-4 border-t gap-3 flex-wrap", highContrast ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200")}>
                        <div className="flex items-center gap-2">
                            <button onClick={markForReview} className="flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-purple-400 text-purple-600 font-bold text-sm hover:bg-purple-50">
                                🔖 Mark & Next
                            </button>
                            <button onClick={clearAnswer} className={cn("px-5 py-2.5 rounded-lg border-2 font-bold text-sm", highContrast ? "border-gray-600 text-gray-300 hover:bg-gray-800" : "border-gray-300 text-gray-600 hover:bg-gray-50")}>
                                Clear
                            </button>
                            <button onClick={() => void handleFinalSubmit()}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#00cc00] text-white font-bold text-sm hover:bg-green-500 shadow-lg shadow-green-500/20">
                                ✓ Submit
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
                                className={cn("px-5 py-2.5 rounded-lg border-2 font-bold text-sm disabled:opacity-30", highContrast ? "border-gray-600 text-gray-300" : "border-gray-300 text-gray-600 hover:bg-gray-50")}>
                                ← Previous
                            </button>
                            <button onClick={() => { if (current < questions.length - 1) setCurrent(c => c + 1); }} disabled={current === questions.length - 1}
                                className="px-6 py-2.5 rounded-lg bg-indigo-700 text-white font-bold text-sm hover:bg-indigo-600 disabled:opacity-30 shadow-lg shadow-indigo-500/20">
                                Next →
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
