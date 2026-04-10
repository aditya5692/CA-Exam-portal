"use client";


import { updateStudentProfile } from "@/actions/profile-actions";
import { type ProfileFieldErrors, type ProfileFieldName } from "@/lib/profile-validation";
import type { UserProfile } from "@/types/profile";
import {
  Briefcase,Calendar,
  CheckCircle2,ChevronLeft,
  FileText,
  Mail,
  MapPin,
  Save,
  ShieldCheck,
  Target,
  User
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState,type ReactNode } from "react";
import { StudentPageHeader } from "../shared/page-header";

import { getStudentAttemptMonthOptions,resolveStudentExamTarget } from "@/lib/student-level";

type ProfileFormState = {
    fullName: string;
    email: string;
    registrationNumber: string;
    department: string;
    phone: string;
    preferredLanguage: string;
    timezone: string;
    bio: string;
    examTargetMonth: string;
    examTargetYear: string;
    caLevel: string;

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

type CheckboxFieldName = "foundationCleared" | "intermediateCleared" | "finalCleared";
type TextFieldName = Exclude<keyof ProfileFormState, CheckboxFieldName>;

interface StudentProfileEditorProps {
    profile: UserProfile;
    onCancel: () => void;
    onSaveSuccess: () => void;
}

const RELATED_FIELD_ERRORS: Partial<Record<ProfileFieldName, ProfileFieldName[]>> = {
    examTargetMonth: ["examTargetMonth", "examTargetYear"],
    examTargetYear: ["examTargetMonth", "examTargetYear"],
    articleshipYear: ["articleshipYear", "articleshipTotal"],
    articleshipTotal: ["articleshipYear", "articleshipTotal"],
};

export function StudentProfileEditor({ profile, onCancel, onSaveSuccess }: StudentProfileEditorProps) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const [statusMessage, setStatusMessage] = useState("");
    const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({});
    const examTarget = resolveStudentExamTarget(profile);

    // Initial state from profile
    const [formData, setFormData] = useState<ProfileFormState>({
        fullName: profile.fullName ?? "",
        email: profile.email ?? "",
        registrationNumber: profile.registrationNumber ?? "",
        department: profile.department ?? "",
        phone: profile.phone ?? "",
        preferredLanguage: profile.preferredLanguage ?? "",
        timezone: profile.timezone ?? "",
        bio: profile.bio ?? "",
        examTargetMonth: examTarget.attemptMonth ? String(examTarget.attemptMonth) : "",
        examTargetYear: examTarget.attemptYear ? String(examTarget.attemptYear) : "",
        caLevel: examTarget.caLevelKey,

        dob: profile.dob ? String(profile.dob) : "",
        location: profile.location ?? "",
        firm: profile.firm ?? "",
        firmRole: profile.firmRole ?? "",
        articleshipYear: profile.articleshipYear === null || profile.articleshipYear === undefined ? "" : String(profile.articleshipYear),
        articleshipTotal: profile.articleshipTotal === null || profile.articleshipTotal === undefined ? "" : String(profile.articleshipTotal),
        foundationCleared: Boolean(profile.foundationCleared),
        intermediateCleared: Boolean(profile.intermediateCleared),
        finalCleared: Boolean(profile.finalCleared),
        resumeUrl: profile.resumeUrl ?? "",
    });

    const clearFieldErrors = (fieldName: ProfileFieldName) => {
        setError("");
        setFieldErrors((prev) => {
            const next = { ...prev };
            let hasChanges = false;

            for (const field of RELATED_FIELD_ERRORS[fieldName] ?? [fieldName]) {
                if (!next[field]) {
                    continue;
                }

                delete next[field];
                hasChanges = true;
            }

            if (!hasChanges) {
                return prev;
            }

            return next;
        });
    };

    const handleTextChange = (key: TextFieldName, value: string) => {
        clearFieldErrors(key as ProfileFieldName);
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleCheckboxChange = (key: CheckboxFieldName, value: boolean) => {
        setError("");
        setFormData(prev => ({ ...prev, [key]: value }));
    };


    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError("");
        setStatusMessage("");
        setFieldErrors({});

        const data = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            data.append(key, String(value));
        });

        const response = await updateStudentProfile(data);
        setIsSaving(false);

        if (response.success) {
            setStatusMessage("Profile updated successfully!");
            setTimeout(() => {
                router.refresh();
                onSaveSuccess();
            }, 1000);
        } else {
            setError(response.message || "Failed to update profile.");
            setFieldErrors(response.fieldErrors || {});
        }
    };

    return (
        <div className="max-w-4xl mx-auto   animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 space-y-5">
                <button 
                    onClick={onCancel}
                    className="inline-flex items-center gap-2 text-sm font-bold text-[var(--student-muted)] transition-colors hover:text-[var(--student-accent-strong)]"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Discard Changes
                </button>
                <StudentPageHeader
                    eyebrow="Edit Profile"
                    title="Update your"
                    accent="details"
                    description="Adjust the academic, contact, and professional details that shape your student workspace."
                    aside={null}
                />
            </div>

            <form onSubmit={handleSave} className="space-y-8">
                {/* Core Identity Section */}
                <Section title="Basic Information" icon={<User className="w-5 h-5" />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField 
                            label="Full Name" 
                            name="fullName" 
                            value={formData.fullName} 
                            onChange={handleTextChange} 
                            placeholder="Aditya Vardhan"
                            icon={<User className="w-4 h-4" />}
                            error={fieldErrors.fullName}
                        />
                        <InputField 
                            label="Email Address" 
                            name="email" 
                            value={formData.email} 
                            onChange={handleTextChange} 
                            type="email"
                            placeholder="aditya@example.com"
                            icon={<Mail className="w-4 h-4" />}
                            error={fieldErrors.email}
                        />
                        <InputField 
                            label="Registration Number (CRO)" 
                            name="registrationNumber" 
                            value={formData.registrationNumber} 
                            onChange={handleTextChange} 
                            placeholder="CRO-0742918"
                            icon={<ShieldCheck className="w-4 h-4" />}
                            error={fieldErrors.registrationNumber}
                        />
                         <InputField 
                            label="Phone Number" 
                            name="phone" 
                            value={formData.phone} 
                            onChange={handleTextChange} 
                            placeholder="+91 98200 12345"
                            icon={<Mail className="w-4 h-4" />}
                            error={fieldErrors.phone}
                        />
                    </div>
                </Section>

                 <Section title="Personal Details" icon={<Calendar className="w-5 h-5" />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SelectField 
                            label="CA Level" 
                            name="caLevel" 
                            value={formData.caLevel} 
                            onChange={handleTextChange}
                            options={[
                                { value: "foundation", label: "CA Foundation" },
                                { value: "ipc", label: "CA Intermediate (IPC)" },
                                { value: "final", label: "CA Final" }
                            ]}
                            icon={<ShieldCheck className="w-4 h-4" />}
                            error={fieldErrors.caLevel}
                        />
                        <div className="flex flex-col gap-2.5">
                            <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-[var(--student-muted)]">Class/Batch Connection</span>
                            <div className="flex h-[56px] w-full items-center justify-between rounded-2xl border border-[var(--student-border)] bg-[var(--student-panel-muted)] px-6 shadow-inner">
                                <span className="text-sm font-bold text-[var(--student-muted)]">
                                    Manage linked educators and batches
                                </span>
                                <button
                                    type="button"
                                    onClick={() => router.push('/student/redeem')}
                                    className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 bg-[var(--student-accent-strong)] text-white shadow-[0_4px_12px_rgba(31,92,80,0.15)]"
                                >
                                    Redeem Code
                                </button>
                            </div>
                        </div>
                        <SelectField 
                            label="Attempt Month" 
                            name="examTargetMonth" 
                            value={formData.examTargetMonth} 
                            onChange={handleTextChange}
                            options={[
                                { value: "", label: "Select month" },
                                ...getStudentAttemptMonthOptions(),
                            ]}
                            icon={<Target className="w-4 h-4" />}
                            error={fieldErrors.examTargetMonth}
                        />
                        <InputField 
                            label="Attempt Year" 
                            name="examTargetYear" 
                            value={formData.examTargetYear} 
                            onChange={handleTextChange} 
                            placeholder="2026"
                            type="number"
                            error={fieldErrors.examTargetYear}
                        />
                         <InputField 
                            label="Location" 
                            name="location" 
                            value={formData.location} 
                            onChange={handleTextChange} 
                            placeholder="Mumbai"
                            icon={<MapPin className="w-4 h-4" />}
                            error={fieldErrors.location}
                        />
                        <InputField 
                            label="Date of Birth" 
                            name="dob" 
                            value={formData.dob} 
                            onChange={handleTextChange} 
                            placeholder="14 Aug 2002"
                            error={fieldErrors.dob}
                        />
                    </div>
                </Section>

                {/* Professional Info Section */}
                <Section title="Professional Info" icon={<Briefcase className="w-5 h-5" />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField 
                            label="Current Firm" 
                            name="firm" 
                            value={formData.firm} 
                            onChange={handleTextChange} 
                            placeholder="Deloitte & Touche"
                            error={fieldErrors.firm}
                        />
                        <InputField 
                            label="Role" 
                            name="firmRole" 
                            value={formData.firmRole} 
                            onChange={handleTextChange} 
                            placeholder="Statutory Audit"
                            error={fieldErrors.firmRole}
                        />
                         <div className="grid grid-cols-2 gap-4">
                            <InputField 
                                label="Articleship Year" 
                                name="articleshipYear" 
                                type="number"
                                value={formData.articleshipYear} 
                                onChange={handleTextChange} 
                                error={fieldErrors.articleshipYear}
                            />
                            <InputField 
                                label="Total Duration" 
                                name="articleshipTotal" 
                                type="number"
                                value={formData.articleshipTotal} 
                                onChange={handleTextChange} 
                                error={fieldErrors.articleshipTotal}
                            />
                        </div>
                        <InputField 
                            label="Resume URL" 
                            name="resumeUrl" 
                            value={formData.resumeUrl} 
                            onChange={handleTextChange} 
                            placeholder="https://..."
                            icon={<FileText className="w-4 h-4" />}
                            error={fieldErrors.resumeUrl}
                        />
                    </div>
                </Section>

                {/* Journey Milestones Section */}
                <Section title="Journey Milestones" icon={<CheckCircle2 className="w-5 h-5" />}>
                    <div className="flex flex-wrap gap-8 py-2">
                        <CheckboxField 
                            label="Foundation Cleared" 
                            name="foundationCleared" 
                            checked={formData.foundationCleared} 
                            onChange={handleCheckboxChange} 
                        />
                        <CheckboxField 
                            label="Intermediate Cleared" 
                            name="intermediateCleared" 
                            checked={formData.intermediateCleared} 
                            onChange={handleCheckboxChange} 
                        />
                        <CheckboxField 
                            label="Final Cleared" 
                            name="finalCleared" 
                            checked={formData.finalCleared} 
                            onChange={handleCheckboxChange} 
                        />
                    </div>
                </Section>

                {/* Submission Section */}
                <div className="flex items-center gap-4 pt-6">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="student-button-primary flex-1 md:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-12 py-4 text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isSaving ? "Saving..." : <><Save className="w-4 h-4" /> Save All Changes</>}
                    </button>
                    {statusMessage && (
                        <p className="text-emerald-600 text-xs font-bold animate-in fade-in duration-300">
                             {statusMessage}
                        </p>
                    )}
                    {error && (
                        <p className="text-rose-600 text-xs font-bold animate-in fade-in duration-300">
                             {error}
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
}

function Section({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
    return (
        <div className="student-surface rounded-[32px] p-8 md:p-10 space-y-8">
            <div className="flex items-center gap-4 mb-2">
                <div className="student-icon-tile flex h-10 w-10 items-center justify-center rounded-xl">
                    {icon}
                </div>
                <h3 className="text-lg font-black tracking-tight text-[var(--student-text)]">{title}</h3>
            </div>
            {children}
        </div>
    );
}

type InputFieldProps = {
    label: string;
    name: TextFieldName;
    value: string;
    onChange: (key: TextFieldName, value: string) => void;
    placeholder?: string;
    type?: string;
    icon?: ReactNode;
    error?: string;
    suffix?: ReactNode;
};

function InputField({ label, name, value, onChange, placeholder, type = "text", icon, error, suffix }: InputFieldProps) {
    return (
        <label className="block space-y-2.5">
            <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-[var(--student-muted)]">{label}</span>
            <div className="relative group">
                {icon && <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--student-muted)]/50 transition-colors group-focus-within:text-[var(--student-accent-strong)]">{icon}</div>}
                <input 
                    type={type}
                    value={value}
                    onChange={(e) => onChange(name, e.target.value)}
                    placeholder={placeholder}
                    aria-invalid={Boolean(error)}
                    className={`w-full rounded-2xl border bg-[var(--student-panel-muted)] py-4.5 ${icon ? "pl-14" : "px-6"} ${suffix ? "pr-32" : "pr-6"} text-sm font-bold text-[var(--student-text)] placeholder:text-[var(--student-muted)]/45 focus:bg-[var(--student-panel-solid)] focus:outline-none focus:ring-4 transition-all shadow-inner ${error ? "border-rose-300 focus:ring-rose-100/80" : "border-[var(--student-border)] focus:ring-[var(--student-accent-soft)]/70"}`}
                />
                {suffix && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        {suffix}
                    </div>
                )}
            </div>
            {error && (
                <p className="ml-1 text-xs font-bold text-rose-600">{error}</p>
            )}
        </label>
    );
}

type SelectFieldProps = {
    label: string;
    name: TextFieldName;
    value: string;
    onChange: (key: TextFieldName, value: string) => void;
    options: { value: string; label: string }[];
    icon?: ReactNode;
    error?: string;
};

function SelectField({ label, name, value, onChange, options, icon, error }: SelectFieldProps) {
    return (
        <label className="block space-y-2.5">
            <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-[var(--student-muted)]">{label}</span>
            <div className="relative group">
                {icon && <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--student-muted)]/50 transition-colors group-focus-within:text-[var(--student-accent-strong)] z-10">{icon}</div>}
                <select 
                    value={value}
                    onChange={(e) => onChange(name, e.target.value)}
                    aria-invalid={Boolean(error)}
                    className={`w-full appearance-none rounded-2xl border bg-[var(--student-panel-muted)] py-4.5 ${icon ? "pl-14" : "px-6"} pr-10 text-sm font-bold text-[var(--student-text)] focus:bg-[var(--student-panel-solid)] focus:outline-none focus:ring-4 transition-all shadow-inner cursor-pointer ${error ? "border-rose-300 focus:ring-rose-100/80" : "border-[var(--student-border)] focus:ring-[var(--student-accent-soft)]/70"}`}
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--student-muted)]/50">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>
            {error && (
                <p className="ml-1 text-xs font-bold text-rose-600">{error}</p>
            )}
        </label>
    );
}

type CheckboxFieldProps = {
    label: string;
    name: CheckboxFieldName;
    checked: boolean;
    onChange: (key: CheckboxFieldName, value: boolean) => void;
};

function CheckboxField({ label, name, checked, onChange }: CheckboxFieldProps) {
    return (
        <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative w-6 h-6">
                <input 
                    type="checkbox" 
                    checked={checked}
                    onChange={(e) => onChange(name, e.target.checked)}
                    className="sr-only peer"
                />
                <div className="flex h-full w-full items-center justify-center rounded-lg border-2 border-[var(--student-border)] bg-[var(--student-panel-muted)] shadow-inner transition-all group-hover:border-[var(--student-accent-soft-strong)] peer-checked:border-[var(--student-accent-strong)] peer-checked:bg-[var(--student-accent-strong)]">
                    {checked && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-[var(--student-text)] transition-colors group-hover:text-[var(--student-accent-strong)]">{label}</span>
        </label>
    );
}
