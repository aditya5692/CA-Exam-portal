"use client";

import { getStudentProfile,getTeacherProfile,updateStudentProfile,updateTeacherProfile } from "@/actions/profile-actions";
import { Calendar } from "@phosphor-icons/react";
import { type ProfileFieldErrors } from "@/lib/profile-validation";
import { resolveStudentExamTarget } from "@/lib/student-level";
import {
  BookOpenCheck,
  CheckCircle2,
  GraduationCap,
  Languages,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Target,
  UserRound,
  UsersRound
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect,useMemo,useState } from "react";

type Mode = "teacher" | "student";

type Profile = {
    id: string;
    fullName: string | null;
    email: string | null;
    registrationNumber: string | null;
    department: string | null;
    phone: string | null;
    preferredLanguage: string | null;
    timezone: string | null;
    bio: string | null;
    designation: string | null;
    expertise: string | null;
    examTarget: string | null;
    role: string;
    plan: string;
    isPublicProfile: boolean;
    storageUsed: number;
    storageLimit: number;
    createdAt: string | Date;
    // New fields
    batch: string | null;
    dob: string | null;
    location: string | null;
    firm: string | null;
    firmRole: string | null;
    articleshipYear: number | null;
    articleshipTotal: number | null;
    foundationCleared: boolean;
    intermediateCleared: boolean;
    finalCleared: boolean;
    resumeUrl: string | null;
};

type FormState = {
    fullName: string;
    email: string;
    registrationNumber: string;
    department: string;
    phone: string;
    preferredLanguage: string;
    timezone: string;
    bio: string;
    designation: string;
    expertise: string;
    examTarget: string;
    isPublicProfile: boolean;
    // New fields
    batch: string;
    dob: string;
    location: string;
    firm: string;
    firmRole: string;
    articleshipYear: string;
    articleshipTotal: string;
    foundationCleared: boolean;
    intermediateCleared: boolean;
    finalCleared: boolean;
    resumeUrl: string;
};

const TEACHER_REQUIRED_FIELDS: Array<{ key: keyof FormState; label: string }> = [
    { key: "fullName", label: "Full name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "department", label: "Department" },
    { key: "designation", label: "Designation" },
    { key: "expertise", label: "Subjects / expertise" },
    { key: "bio", label: "Teacher bio" },
];

const STUDENT_REQUIRED_FIELDS: Array<{ key: keyof FormState; label: string }> = [
    { key: "fullName", label: "Full name" },
    { key: "email", label: "Email" },
    { key: "registrationNumber", label: "Registration number" },
    { key: "department", label: "Department" },
    { key: "phone", label: "Phone" },
    { key: "examTarget", label: "Exam target" },
    { key: "preferredLanguage", label: "Preferred language" },
];

const EMPTY_FORM: FormState = {
    fullName: "",
    email: "",
    registrationNumber: "",
    department: "",
    phone: "",
    preferredLanguage: "",
    timezone: "",
    bio: "",
    designation: "",
    expertise: "",
    examTarget: "",
    isPublicProfile: true,
    batch: "",
    dob: "",
    location: "",
    firm: "",
    firmRole: "",
    articleshipYear: "",
    articleshipTotal: "",
    foundationCleared: false,
    intermediateCleared: false,
    finalCleared: false,
    resumeUrl: "",
};

export function ProfileEditor({ mode }: { mode: Mode }) {
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [formState, setFormState] = useState<FormState>(EMPTY_FORM);
    const [isSaving, setIsSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({});
    const [tempLevel, setTempLevel] = useState("CA Final");
    const [tempCycle, setTempCycle] = useState("");

    useEffect(() => {
        let active = true;

        (async () => {
            const response = mode === "teacher"
                ? await getTeacherProfile()
                : await getStudentProfile();

            if (!active || !response.success) {
                return;
            }

            const loadedProfile = response.data as Profile;
            setProfile(loadedProfile);
            setFormState({
                fullName: loadedProfile.fullName ?? "",
                email: loadedProfile.email ?? "",
                registrationNumber: loadedProfile.registrationNumber ?? "",
                department: loadedProfile.department ?? "",
                phone: loadedProfile.phone ?? "",
                preferredLanguage: loadedProfile.preferredLanguage ?? "",
                timezone: loadedProfile.timezone ?? "",
                bio: loadedProfile.bio ?? "",
                designation: loadedProfile.designation ?? "",
                expertise: loadedProfile.expertise ?? "",
                examTarget: loadedProfile.examTarget ?? "",
                isPublicProfile: loadedProfile.isPublicProfile ?? true,
                batch: loadedProfile.batch ?? "",
                dob: loadedProfile.dob ?? "",
                location: loadedProfile.location ?? "",
                firm: loadedProfile.firm ?? "",
                firmRole: loadedProfile.firmRole ?? "",
                articleshipYear: loadedProfile.articleshipYear === null || loadedProfile.articleshipYear === undefined ? "" : String(loadedProfile.articleshipYear),
                articleshipTotal: loadedProfile.articleshipTotal === null || loadedProfile.articleshipTotal === undefined ? "" : String(loadedProfile.articleshipTotal),
                foundationCleared: loadedProfile.foundationCleared ?? false,
                intermediateCleared: loadedProfile.intermediateCleared ?? false,
                finalCleared: loadedProfile.finalCleared ?? false,
                resumeUrl: loadedProfile.resumeUrl ?? "",
            });
            
            // Re-parse level and cycle for UI
            const studentTarget = resolveStudentExamTarget(loadedProfile);
            setTempLevel(studentTarget.caLevelLabel);
            setTempCycle(studentTarget.cycleLabel ?? "");
        })();

        return () => {
            active = false;
        };
    }, [mode]);

    const requiredFields = mode === "teacher" ? TEACHER_REQUIRED_FIELDS : STUDENT_REQUIRED_FIELDS;

    const completion = useMemo(() => {
        const completedFields = requiredFields.filter(({ key }) => {
            const val = formState[key];
            return typeof val === "string" ? val.trim().length > 0 : true;
        });
        const percentage = Math.round((completedFields.length / requiredFields.length) * 100);
        const missing = requiredFields
            .filter(({ key }) => {
                const val = formState[key];
                return typeof val === "string" ? val.trim().length === 0 : false;
            })
            .map(({ label }) => label);

        return { percentage, missing };
    }, [formState, requiredFields]);

    const storageUsage = useMemo(() => {
        if (!profile || profile.storageLimit === 0) {
            return 0;
        }

        return Math.min(100, Math.round((profile.storageUsed / profile.storageLimit) * 100));
    }, [profile]);

    const studentTargetPreview = useMemo(() => {
        if (mode !== "student") {
            return null;
        }

        return resolveStudentExamTarget({
            examTarget: `${tempLevel} ${tempCycle}`.trim(),
        });
    }, [mode, tempCycle, tempLevel]);

    const validationMessages = useMemo(
        () => Array.from(new Set(Object.values(fieldErrors).filter((value): value is string => Boolean(value)))),
        [fieldErrors],
    );

    const daysToExam = studentTargetPreview?.daysToExam ?? 0;

    const handleChange = (key: keyof FormState, value: string | boolean) => {
        setStatusMessage("");
        setFieldErrors({});
        setFormState((current) => ({ ...current, [key]: value }));
    };

    const handleSave = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSaving(true);
        setStatusMessage("");
        setFieldErrors({});

        const formData = new FormData();
        const combinedTarget = `${tempLevel} ${tempCycle}`.trim();
        Object.entries(formState).forEach(([key, value]) => {
            if (key === "examTarget") {
                formData.append(key, combinedTarget);
            } else {
                formData.append(key, typeof value === "boolean" ? value.toString() : value);
            }
        });

        const response = mode === "teacher"
            ? await updateTeacherProfile(formData)
            : await updateStudentProfile(formData);

        setIsSaving(false);

        if (response.success) {
            const updatedProfile = response.data as Profile;
            setProfile(updatedProfile);
            setFieldErrors({});
            setStatusMessage("Profile saved successfully.");
            router.refresh();
            return;
        }

        setFieldErrors(response.fieldErrors ?? {});
        setStatusMessage(response.message || "Failed to save profile.");
    };

    if (!profile) {
        return (
            <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-500">
                Loading profile...
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-500 font-outfit">
            {/* Standardized Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.2)]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                            {mode === "teacher" ? "Faculty Protocol" : "Scholarly Identity"}
                        </span>
                    </div>
                    <h1 className="font-outfit tracking-tighter leading-tight text-2xl md:text-3xl font-black text-slate-900">
                        {profile.fullName?.split(" ")[0] || "User"}&apos;s <span className="text-indigo-600">Profile</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-sm font-sans max-w-2xl leading-relaxed">
                        Unified terminal for personal identity, scholarly credentials, and operational security management.
                    </p>
                </div>
                {daysToExam > 0 && mode === "student" && (
                    <div className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-900/5 hover:bg-slate-800 transition-all active:scale-95 shrink-0 mb-1 pointer-events-none">
                        <Calendar size={18} weight="bold" className="text-indigo-400" />
                        Next Milestone: {daysToExam} Days
                    </div>
                )}
            </div>

            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
                <div />
                <div className="rounded-3xl border border-indigo-100/50 bg-indigo-50/20 backdrop-blur-md px-10 py-8 min-w-[340px] shadow-xl shadow-indigo-900/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200/10 rounded-full blur-3xl -mr-16 -mt-16" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70 font-outfit">Identity Integrity</p>
                    <div className="mt-5 flex items-end gap-4">
                        <span className="text-6xl font-black text-indigo-600 tracking-tighter leading-none">{completion.percentage}%</span>
                        {completion.percentage === 100 && (
                            <span className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest shadow-lg shadow-emerald-500/5 border border-emerald-100 mb-1">
                                <CheckCircle2 className="w-4 h-4" /> Elite
                            </span>
                        )}
                    </div>
                    <div className="mt-8 h-2.5 rounded-full bg-indigo-100/50 overflow-hidden shadow-inner">
                        <div className="h-full rounded-full bg-indigo-600 transition-all duration-1000 shadow-[0_0_15px_rgba(79,70,229,0.5)]" style={{ width: `${completion.percentage}%` }} />
                    </div>
                    {completion.missing.length > 0 && (
                        <p className="mt-6 text-[10px] font-bold leading-relaxed text-indigo-400/80 uppercase tracking-widest">
                            Required Assets:
                            {" "}
                            <span className="text-indigo-600/80">{completion.missing.join(", ")}</span>
                        </p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[0.92fr_1.08fr] gap-6">
                <div className="rounded-[32px] border border-slate-100 bg-white/70 backdrop-blur-md p-8 shadow-[0_8px_40px_rgba(0,0,0,0.03)] space-y-10">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 text-indigo-500/80 flex items-center justify-center border border-slate-100 shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                            {mode === "teacher" ? <ShieldCheck className="w-8 h-8" strokeWidth={2.5} /> : <GraduationCap className="w-8 h-8" strokeWidth={2.5} />}
                        </div>
                        <div>
                            <h2 className="font-outfit tracking-tight">Identity Matrix</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-60">Verified Authorization</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="rounded-3xl bg-slate-50 border border-slate-100 px-7 py-7 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 rounded-full blur-2xl -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-indigo-500 transition-colors relative z-10">Access Tier</p>
                            <p className="mt-3 text-2xl font-bold text-slate-900 font-outfit tracking-tighter relative z-10">{profile.role}</p>
                        </div>
                        <div className="rounded-3xl bg-slate-50 border border-slate-100 px-7 py-7 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 rounded-full blur-2xl -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-indigo-500 transition-colors relative z-10">Asset Plan</p>
                            <p className="mt-3 text-2xl font-bold text-slate-900 font-outfit tracking-tighter relative z-10">{profile.plan}</p>
                        </div>
                        <div className="rounded-3xl bg-slate-50 border border-slate-100 px-7 py-7 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 group md:col-span-2 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full blur-3xl -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-indigo-500 transition-colors relative z-10">Storage Allocation</p>
                            <div className="flex justify-between items-end mt-3 relative z-10">
                                <p className="text-2xl font-bold text-slate-900 font-outfit tracking-tighter">{storageUsage}% <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1 opacity-60">Capacity</span></p>
                                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">Status: Nominal</p>
                            </div>
                            <div className="mt-6 h-2 rounded-full bg-slate-200/50 overflow-hidden ring-1 ring-slate-100 relative z-10 shadow-inner">
                                <div className="h-full rounded-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all duration-1000" style={{ width: `${storageUsage}%` }} />
                            </div>
                        </div>
                        {mode === "teacher" ? (
                            <>
                                <div className="rounded-[28px] bg-slate-50 border border-slate-100 px-7 py-7 group hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 relative overflow-hidden">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-indigo-600 relative z-10">Faculty Title</p>
                                    <p className="mt-3 text-2xl font-black text-slate-950 font-outfit tracking-tighter leading-none relative z-10">{profile.designation || "Faculty Member"}</p>
                                </div>
                                <div className="rounded-[28px] bg-slate-50 border border-slate-100 px-7 py-7 group hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 relative overflow-hidden">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-indigo-600 relative z-10">Core Domain</p>
                                    <p className="mt-3 text-2xl font-black text-slate-950 font-outfit tracking-tighter leading-none relative z-10">{profile.expertise || "Economics & Strategy"}</p>
                                </div>
                            </>
                        ) : (
                            <div className="rounded-[28px] bg-slate-50 border border-slate-100 px-7 py-7 md:col-span-2 group hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 relative overflow-hidden">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-indigo-600 relative z-10">Diagnostic Target</p>
                                <p className="mt-3 text-2xl font-black text-slate-950 font-outfit tracking-tighter relative z-10">{studentTargetPreview?.label || profile.examTarget || "Chartered Accountancy 2027"}</p>
                            </div>
                        )}
                    </div>
                </div>

                <form onSubmit={handleSave} className="rounded-3xl border border-slate-100 bg-white/80 backdrop-blur-md p-8 shadow-xl shadow-slate-200/20 space-y-8">
                    <div>
                        <h2 className="font-outfit tracking-tight">Security Records</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-60">Verified Asset Management</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <label className="space-y-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-5">Legal Identity</span>
                            <div className="relative group">
                                <UserRound className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="text"
                                    value={formState.fullName}
                                    onChange={(event) => handleChange("fullName", event.target.value)}
                                    className="w-full rounded-[20px] bg-slate-50 border border-slate-100 px-16 py-4.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:bg-white transition-all font-sans text-slate-900 placeholder:text-slate-300 shadow-inner"
                                    placeholder="Enter full name"
                                />
                            </div>
                        </label>

                        <label className="space-y-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-5">Primary Email</span>
                            <div className="relative group">
                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                <input
                                    type="email"
                                    value={formState.email}
                                    onChange={(event) => handleChange("email", event.target.value)}
                                    className="w-full rounded-[20px] bg-slate-50 border border-slate-100 px-16 py-4.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:bg-white transition-all font-sans text-slate-900 placeholder:text-slate-300 shadow-inner"
                                    placeholder="Enter email"
                                />
                            </div>
                        </label>

                        <label className="space-y-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-5">{mode === "teacher" ? "Faculty ID" : "Registration Number"}</span>
                            <div className="relative group">
                                <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                <input
                                    type="text"
                                    value={formState.registrationNumber}
                                    onChange={(event) => handleChange("registrationNumber", event.target.value.toUpperCase())}
                                    className="w-full rounded-[20px] bg-slate-50 border border-slate-100 px-16 py-4.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:bg-white transition-all font-sans text-slate-900 placeholder:text-slate-300 shadow-inner"
                                    placeholder={mode === "teacher" ? "Enter faculty ID" : "Enter registration number"}
                                />
                            </div>
                        </label>

                        <label className="space-y-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-5">Operational Sector</span>
                            <div className="relative group">
                                <UsersRound className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                <input
                                    type="text"
                                    value={formState.department}
                                    onChange={(event) => handleChange("department", event.target.value)}
                                    className="w-full rounded-[20px] bg-slate-50 border border-slate-100 px-16 py-4.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:bg-white transition-all font-sans text-slate-900 placeholder:text-slate-300 shadow-inner"
                                    placeholder="Enter department"
                                />
                            </div>
                        </label>

                        <label className="space-y-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-5">Contact Node</span>
                            <div className="relative group">
                                <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                <input
                                    type="text"
                                    value={formState.phone}
                                    onChange={(event) => handleChange("phone", event.target.value)}
                                    className="w-full rounded-[20px] bg-slate-50 border border-slate-100 px-16 py-4.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:bg-white transition-all font-sans text-slate-900 placeholder:text-slate-300 shadow-inner"
                                    placeholder="Enter phone number"
                                />
                            </div>
                        </label>

                        <label className="space-y-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-5">Cognitive Logic</span>
                            <div className="relative group">
                                <Languages className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                <input
                                    type="text"
                                    value={formState.preferredLanguage}
                                    onChange={(event) => handleChange("preferredLanguage", event.target.value)}
                                    className="w-full rounded-[20px] bg-slate-50 border border-slate-100 px-16 py-4.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:bg-white transition-all font-sans text-slate-900 placeholder:text-slate-300 shadow-inner"
                                    placeholder="English, Hindi, etc."
                                />
                            </div>
                        </label>

                        <label className="space-y-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-5">Temporal Matrix</span>
                            <div className="relative group">
                                <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                <input
                                    type="text"
                                    value={formState.timezone}
                                    onChange={(event) => handleChange("timezone", event.target.value)}
                                    className="w-full rounded-[20px] bg-slate-50 border border-slate-100 px-16 py-4.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:bg-white transition-all font-sans text-slate-900 placeholder:text-slate-300 shadow-inner"
                                    placeholder="Asia/Kolkata"
                                />
                            </div>
                        </label>

                        {mode === "teacher" ? (
                            <>
                                <label className="space-y-3">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-5">Official Designation</span>
                                    <div className="relative group">
                                        <GraduationCap className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                        <input
                                            type="text"
                                            value={formState.designation}
                                            onChange={(event) => handleChange("designation", event.target.value)}
                                            className="w-full rounded-[20px] bg-slate-50 border border-slate-100 px-16 py-4.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:bg-white transition-all font-sans text-slate-900 placeholder:text-slate-300 shadow-inner"
                                            placeholder="CA Faculty, Mentor, etc."
                                        />
                                    </div>
                                </label>

                                <label className="space-y-3">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-5">Expertise Matrix</span>
                                    <div className="relative group">
                                        <BookOpenCheck className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                        <input
                                            type="text"
                                            value={formState.expertise}
                                            onChange={(event) => handleChange("expertise", event.target.value)}
                                            className="w-full rounded-[20px] bg-slate-50 border border-slate-100 px-16 py-4.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:bg-white transition-all font-sans text-slate-900 placeholder:text-slate-300 shadow-inner"
                                            placeholder="Taxation, Audit, Accounts"
                                        />
                                    </div>
                                </label>

                                <label className="space-y-4 md:col-span-2 pt-6 border-t border-slate-100 mt-4">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <span className="text-sm font-black text-slate-950 uppercase tracking-tight flex items-center gap-2">
                                                Public Educator Profile <ShieldCheck className="text-emerald-500 w-4 h-4" />
                                            </span>
                                            <p className="text-xs text-slate-500 max-w-[80%] leading-relaxed font-medium">
                                                When enabled, anyone can view your public badge, bio, and free resources. Turn this off to stay completely private.
                                            </p>
                                        </div>
                                        <div className="relative inline-flex items-center cursor-pointer mt-1">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={formState.isPublicProfile}
                                                onChange={(e) => handleChange("isPublicProfile", e.target.checked)}
                                            />
                                            <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-7 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </div>
                                    </div>
                                </label>
                            </>
                        ) : (
                            <div className="space-y-3 md:col-span-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-5">Scholarly Objective</span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative group">
                                        <GraduationCap className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                        <select
                                            value={tempLevel}
                                            onChange={(e) => setTempLevel(e.target.value)}
                                            className="w-full rounded-[20px] bg-slate-50 border border-slate-100 px-16 py-4.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:bg-white transition-all font-sans text-slate-900 appearance-none shadow-inner"
                                        >
                                            <option value="CA Foundation">CA Foundation</option>
                                            <option value="CA Intermediate">CA Intermediate</option>
                                            <option value="CA Final">CA Final</option>
                                        </select>
                                    </div>
                                    <div className="relative group">
                                        <Target className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                        <input
                                            type="text"
                                            value={tempCycle}
                                            onChange={(e) => setTempCycle(e.target.value)}
                                            className="w-full rounded-[20px] bg-slate-50 border border-slate-100 px-16 py-4.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:bg-white transition-all font-sans text-slate-900 placeholder:text-slate-300 shadow-inner"
                                            placeholder="May 2026, Nov 2025, etc."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <label className="space-y-3 md:col-span-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-5">{mode === "teacher" ? "Pedagogical Note" : "Personal Dossier"}</span>
                            <textarea
                                rows={5}
                                value={formState.bio}
                                onChange={(event) => handleChange("bio", event.target.value)}
                                className="w-full rounded-[28px] bg-slate-50 border border-slate-100 px-8 py-6 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:bg-white transition-all font-sans text-slate-900 placeholder:text-slate-300 shadow-inner resize-none"
                                placeholder={mode === "teacher" ? "Brief summary of teaching experience, classes, and approach." : "Brief summary of goals, background, or study preferences."}
                            />
                        </label>

                        {mode === "student" && (
                            <div className="md:col-span-2 space-y-8 pt-6 border-t border-slate-100">
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-6">Extended Academic & Professional Records</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <label className="space-y-3">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-5">Batch</span>
                                            <input
                                                type="text"
                                                value={formState.batch}
                                                onChange={(e) => handleChange("batch", e.target.value)}
                                                className="w-full rounded-[20px] bg-slate-50 border border-slate-100 px-8 py-4.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:bg-white transition-all font-sans text-slate-900 placeholder:text-slate-300 shadow-inner"
                                                placeholder="e.g. Nov 2024"
                                            />
                                        </label>
                                        <label className="space-y-3">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-5">Date of Birth</span>
                                            <input
                                                type="text"
                                                value={formState.dob}
                                                onChange={(e) => handleChange("dob", e.target.value)}
                                                className="w-full rounded-[20px] bg-slate-50 border border-slate-100 px-8 py-4.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:bg-white transition-all font-sans text-slate-900 placeholder:text-slate-300 shadow-inner"
                                                placeholder="e.g. 14 Aug 2002"
                                            />
                                        </label>
                                        <label className="space-y-3">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-5">Location</span>
                                            <input
                                                type="text"
                                                value={formState.location}
                                                onChange={(e) => handleChange("location", e.target.value)}
                                                className="w-full rounded-[20px] bg-slate-50 border border-slate-100 px-8 py-4.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:bg-white transition-all font-sans text-slate-900 placeholder:text-slate-300 shadow-inner"
                                                placeholder="e.g. Mumbai"
                                            />
                                        </label>
                                        <label className="space-y-3">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-5">Current Firm</span>
                                            <input
                                                type="text"
                                                value={formState.firm}
                                                onChange={(e) => handleChange("firm", e.target.value)}
                                                className="w-full rounded-[20px] bg-slate-50 border border-slate-100 px-8 py-4.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:bg-white transition-all font-sans text-slate-900 placeholder:text-slate-300 shadow-inner"
                                                placeholder="e.g. Deloitte & Touche"
                                            />
                                        </label>
                                        <label className="space-y-3">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-5">Role in Firm</span>
                                            <input
                                                type="text"
                                                value={formState.firmRole}
                                                onChange={(e) => handleChange("firmRole", e.target.value)}
                                                className="w-full rounded-[20px] bg-slate-50 border border-slate-100 px-8 py-4.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:bg-white transition-all font-sans text-slate-900 placeholder:text-slate-300 shadow-inner"
                                                placeholder="e.g. Statutory Audit"
                                            />
                                        </label>
                                        <label className="space-y-3">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-5">Resume/Doc URL</span>
                                            <input
                                                type="text"
                                                value={formState.resumeUrl}
                                                onChange={(e) => handleChange("resumeUrl", e.target.value)}
                                                className="w-full rounded-[20px] bg-slate-50 border border-slate-100 px-8 py-4.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:bg-white transition-all font-sans text-slate-900 placeholder:text-slate-300 shadow-inner"
                                                placeholder="https://..."
                                            />
                                        </label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <label className="space-y-3">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-5">Articleship Year</span>
                                                <input
                                                    type="number"
                                                    value={formState.articleshipYear}
                                                    onChange={(e) => handleChange("articleshipYear", e.target.value)}
                                                    className="w-full rounded-[20px] bg-slate-50 border border-slate-100 px-8 py-4.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:bg-white transition-all font-sans text-slate-900 shadow-inner"
                                                />
                                            </label>
                                            <label className="space-y-3">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-5">Total Years</span>
                                                <input
                                                    type="number"
                                                    value={formState.articleshipTotal}
                                                    onChange={(e) => handleChange("articleshipTotal", e.target.value)}
                                                    className="w-full rounded-[20px] bg-slate-50 border border-slate-100 px-8 py-4.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:bg-white transition-all font-sans text-slate-900 shadow-inner"
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Milestone Verification</h3>
                                    <div className="flex flex-wrap gap-6">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={formState.foundationCleared}
                                                onChange={(e) => handleChange("foundationCleared", e.target.checked)}
                                                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-xs font-bold text-slate-700">Foundation Cleared</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={formState.intermediateCleared}
                                                onChange={(e) => handleChange("intermediateCleared", e.target.checked)}
                                                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-xs font-bold text-slate-700">Intermediate Cleared</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={formState.finalCleared}
                                                onChange={(e) => handleChange("finalCleared", e.target.checked)}
                                                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-xs font-bold text-slate-700">Final Cleared</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {statusMessage && Object.keys(fieldErrors).length === 0 && (
                        <div className="rounded-[20px] bg-emerald-50 border border-emerald-100 px-6 py-4 text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-3">
                            <CheckCircle2 className="w-4 h-4" /> {statusMessage}
                        </div>
                    )}

                    {validationMessages.length > 0 && (
                        <div className="rounded-[20px] border border-rose-100 bg-rose-50 px-6 py-4 text-rose-700">
                            <p className="text-[10px] font-black uppercase tracking-widest">
                                {statusMessage || "Please correct the highlighted fields."}
                            </p>
                            <ul className="mt-3 space-y-2 text-xs font-bold normal-case tracking-normal leading-relaxed">
                                {validationMessages.map((message) => (
                                    <li key={message}>{message}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-12 py-4 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-slate-800 shadow-lg shadow-indigo-900/5 disabled:opacity-60 transition-all duration-300 active:scale-95 w-full md:w-auto"
                    >
                        {isSaving ? (
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                Executing Save Protocol...
                            </div>
                        ) : "Synchronize Profile"}
                    </button>
                </form>
            </div>
        </div>
    );
}
