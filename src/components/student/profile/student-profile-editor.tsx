"use client";

import { updateStudentProfile } from "@/actions/profile-actions";
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
import { useState,type ReactNode } from "react";

type ProfileFormState = {
    fullName: string;
    email: string;
    registrationNumber: string;
    department: string;
    phone: string;
    preferredLanguage: string;
    timezone: string;
    bio: string;
    examTarget: string;
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

type CheckboxFieldName = "foundationCleared" | "intermediateCleared" | "finalCleared";
type TextFieldName = Exclude<keyof ProfileFormState, CheckboxFieldName>;

interface StudentProfileEditorProps {
    profile: UserProfile;
    onCancel: () => void;
    onSaveSuccess: () => void;
}

export function StudentProfileEditor({ profile, onCancel, onSaveSuccess }: StudentProfileEditorProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const [statusMessage, setStatusMessage] = useState("");

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
        examTarget: profile.examTarget ?? "",
        batch: profile.batch ?? "",
        dob: profile.dob ? String(profile.dob) : "",
        location: profile.location ?? "",
        firm: profile.firm ?? "",
        firmRole: profile.firmRole ?? "",
        articleshipYear: String(profile.articleshipYear ?? 0),
        articleshipTotal: String(profile.articleshipTotal ?? 3),
        foundationCleared: Boolean(profile.foundationCleared),
        intermediateCleared: Boolean(profile.intermediateCleared),
        finalCleared: Boolean(profile.finalCleared),
        resumeUrl: profile.resumeUrl ?? "",
    });

    const handleTextChange = (key: TextFieldName, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleCheckboxChange = (key: CheckboxFieldName, value: boolean) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError("");
        setStatusMessage("");

        const data = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            data.append(key, String(value));
        });

        const response = await updateStudentProfile(data);
        setIsSaving(false);

        if (response.success) {
            setStatusMessage("Profile updated successfully!");
            setTimeout(() => {
                onSaveSuccess();
            }, 1000);
        } else {
            setError(response.message || "Failed to update profile.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto font-outfit animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
                <button 
                    onClick={onCancel}
                    className="flex items-center gap-2 text-slate-400 font-bold text-sm hover:text-indigo-600 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Discard Changes
                </button>
                <div className="flex items-center gap-2">
                     <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                     <h1 className="text-xl font-black text-slate-900 tracking-tight">Updating Profile</h1>
                </div>
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
                        />
                        <InputField 
                            label="Email Address" 
                            name="email" 
                            value={formData.email} 
                            onChange={handleTextChange} 
                            type="email"
                            placeholder="aditya@example.com"
                            icon={<Mail className="w-4 h-4" />}
                        />
                        <InputField 
                            label="Registration Number (CRO)" 
                            name="registrationNumber" 
                            value={formData.registrationNumber} 
                            onChange={handleTextChange} 
                            placeholder="CRO-0742918"
                            icon={<ShieldCheck className="w-4 h-4" />}
                        />
                         <InputField 
                            label="Phone Number" 
                            name="phone" 
                            value={formData.phone} 
                            onChange={handleTextChange} 
                            placeholder="+91 98200 12345"
                            icon={<Mail className="w-4 h-4" />}
                        />
                    </div>
                </Section>

                {/* Personal Details Section */}
                <Section title="Personal Details" icon={<Calendar className="w-5 h-5" />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <InputField 
                            label="Batch" 
                            name="batch" 
                            value={formData.batch} 
                            onChange={handleTextChange} 
                            placeholder="Nov 2024"
                        />
                        <InputField 
                            label="Attempt Due" 
                            name="examTarget" 
                            value={formData.examTarget} 
                            onChange={handleTextChange} 
                            placeholder="May 2025"
                            icon={<Target className="w-4 h-4" />}
                        />
                         <InputField 
                            label="Location" 
                            name="location" 
                            value={formData.location} 
                            onChange={handleTextChange} 
                            placeholder="Mumbai"
                            icon={<MapPin className="w-4 h-4" />}
                        />
                        <InputField 
                            label="Date of Birth" 
                            name="dob" 
                            value={formData.dob} 
                            onChange={handleTextChange} 
                            placeholder="14 Aug 2002"
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
                        />
                        <InputField 
                            label="Role" 
                            name="firmRole" 
                            value={formData.firmRole} 
                            onChange={handleTextChange} 
                            placeholder="Statutory Audit"
                        />
                         <div className="grid grid-cols-2 gap-4">
                            <InputField 
                                label="Articleship Year" 
                                name="articleshipYear" 
                                type="number"
                                value={formData.articleshipYear} 
                                onChange={handleTextChange} 
                            />
                            <InputField 
                                label="Total Duration" 
                                name="articleshipTotal" 
                                type="number"
                                value={formData.articleshipTotal} 
                                onChange={handleTextChange} 
                            />
                        </div>
                        <InputField 
                            label="Resume URL" 
                            name="resumeUrl" 
                            value={formData.resumeUrl} 
                            onChange={handleTextChange} 
                            placeholder="https://..."
                            icon={<FileText className="w-4 h-4" />}
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
                        className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-12 py-4 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-200 disabled:opacity-50"
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

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-[32px] p-8 md:p-10 border border-slate-100 shadow-xl shadow-slate-200/20 space-y-8">
            <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                    {icon}
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">{title}</h3>
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
};

function InputField({ label, name, value, onChange, placeholder, type = "text", icon }: InputFieldProps) {
    return (
        <label className="block space-y-2.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</span>
            <div className="relative group">
                {icon && <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-indigo-500">{icon}</div>}
                <input 
                    type={type}
                    value={value}
                    onChange={(e) => onChange(name, e.target.value)}
                    placeholder={placeholder}
                    className={`w-full bg-slate-50 border border-slate-100 rounded-2xl py-4.5 ${icon ? 'pl-14' : 'px-6'} pr-6 text-sm font-bold text-slate-900 placeholder:text-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:bg-white transition-all shadow-inner`}
                />
            </div>
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
                <div className="w-full h-full rounded-lg bg-slate-50 border-2 border-slate-100 peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all flex items-center justify-center shadow-inner group-hover:border-indigo-200">
                    {checked && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
            </div>
            <span className="text-xs font-black text-slate-700 tracking-tight uppercase tracking-widest group-hover:text-indigo-600 transition-colors">{label}</span>
        </label>
    );
}
