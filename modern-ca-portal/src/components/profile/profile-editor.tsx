"use client";

import { useEffect, useMemo, useState } from "react";
import { getStudentProfile, getTeacherProfile, updateStudentProfile, updateTeacherProfile } from "@/actions/profile-actions";
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
};

export function ProfileEditor({ mode }: { mode: Mode }) {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [formState, setFormState] = useState<FormState>(EMPTY_FORM);
    const [isSaving, setIsSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");

    useEffect(() => {
        let active = true;

        (async () => {
            const response = mode === "teacher"
                ? await getTeacherProfile()
                : await getStudentProfile();

            if (!active || !response.success) {
                return;
            }

            const loadedProfile = response.profile as Profile;
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
            });
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

    const handleChange = (key: keyof FormState, value: string) => {
        setFormState((current) => ({ ...current, [key]: value }));
    };

    const handleSave = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSaving(true);
        setStatusMessage("");

        const formData = new FormData();
        Object.entries(formState).forEach(([key, value]) => {
            formData.append(key, typeof value === "boolean" ? value.toString() : value);
        });

        const response = mode === "teacher"
            ? await updateTeacherProfile(formData)
            : await updateStudentProfile(formData);

        setIsSaving(false);

        if (response.success) {
            const updatedProfile = response.profile as Profile;
            setProfile(updatedProfile);
            setStatusMessage("Profile saved successfully.");
            return;
        }

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
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-500">
                        {mode === "teacher" ? "Teacher profile" : "Student profile"}
                    </p>
                    <h1 className="mt-2 text-3xl font-bold text-gray-900">
                        {profile.fullName || (mode === "teacher" ? "Teacher Profile" : "Student Profile")}
                    </h1>
                    <p className="text-sm text-gray-500 mt-2">
                        This profile is now tailored for your platform roles, batches, materials, updates, and exam workflows.
                    </p>
                </div>
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4 min-w-[280px]">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Completion status</p>
                    <div className="mt-3 flex items-end gap-3">
                        <span className="text-4xl font-black text-indigo-700">{completion.percentage}%</span>
                        {completion.percentage === 100 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
                                <CheckCircle2 className="w-4 h-4" /> Complete
                            </span>
                        )}
                    </div>
                    <div className="mt-4 h-2 rounded-full bg-white/80">
                        <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${completion.percentage}%` }} />
                    </div>
                    {completion.missing.length > 0 && (
                        <p className="mt-3 text-xs leading-relaxed text-indigo-700">
                            Missing:
                            {" "}
                            <span className="font-semibold">{completion.missing.join(", ")}</span>
                        </p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[0.92fr_1.08fr] gap-6">
                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            {mode === "teacher" ? <ShieldCheck className="w-6 h-6" /> : <GraduationCap className="w-6 h-6" />}
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Profile overview</h2>
                            <p className="text-sm text-gray-500">Role-aware summary for this account.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-2xl bg-gray-50 px-4 py-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Role</p>
                            <p className="mt-2 text-lg font-bold text-gray-900">{profile.role}</p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 px-4 py-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Plan</p>
                            <p className="mt-2 text-lg font-bold text-gray-900">{profile.plan}</p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 px-4 py-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Language</p>
                            <p className="mt-2 text-lg font-bold text-gray-900">{profile.preferredLanguage || "--"}</p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 px-4 py-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Timezone</p>
                            <p className="mt-2 text-lg font-bold text-gray-900">{profile.timezone || "--"}</p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 px-4 py-4 md:col-span-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Storage usage</p>
                            <p className="mt-2 text-lg font-bold text-gray-900">{storageUsage}%</p>
                            <div className="mt-3 h-2 rounded-full bg-white">
                                <div className="h-full rounded-full bg-indigo-600" style={{ width: `${storageUsage}%` }} />
                            </div>
                        </div>
                        {mode === "teacher" ? (
                            <>
                                <div className="rounded-2xl bg-gray-50 px-4 py-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Designation</p>
                                    <p className="mt-2 text-lg font-bold text-gray-900">{profile.designation || "--"}</p>
                                </div>
                                <div className="rounded-2xl bg-gray-50 px-4 py-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Expertise</p>
                                    <p className="mt-2 text-lg font-bold text-gray-900">{profile.expertise || "--"}</p>
                                </div>
                            </>
                        ) : (
                            <div className="rounded-2xl bg-gray-50 px-4 py-4 md:col-span-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Exam target</p>
                                <p className="mt-2 text-lg font-bold text-gray-900">{profile.examTarget || "--"}</p>
                            </div>
                        )}
                    </div>
                </div>

                <form onSubmit={handleSave} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-6">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Complete your profile</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            The fields below are selected for this platform’s real workflows, not a generic social profile.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="space-y-2">
                            <span className="text-sm font-medium text-gray-700">Full name</span>
                            <div className="relative">
                                <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={formState.fullName}
                                    onChange={(event) => handleChange("fullName", event.target.value)}
                                    className="w-full rounded-xl border border-gray-200 px-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Enter full name"
                                />
                            </div>
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium text-gray-700">Email</span>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="email"
                                    value={formState.email}
                                    onChange={(event) => handleChange("email", event.target.value)}
                                    className="w-full rounded-xl border border-gray-200 px-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Enter email"
                                />
                            </div>
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium text-gray-700">{mode === "teacher" ? "Faculty / employee ID" : "Registration number"}</span>
                            <input
                                type="text"
                                value={formState.registrationNumber}
                                onChange={(event) => handleChange("registrationNumber", event.target.value.toUpperCase())}
                                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder={mode === "teacher" ? "Enter faculty ID" : "Enter registration number"}
                            />
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium text-gray-700">Department</span>
                            <div className="relative">
                                <UsersRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={formState.department}
                                    onChange={(event) => handleChange("department", event.target.value)}
                                    className="w-full rounded-xl border border-gray-200 px-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Enter department"
                                />
                            </div>
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium text-gray-700">Phone</span>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={formState.phone}
                                    onChange={(event) => handleChange("phone", event.target.value)}
                                    className="w-full rounded-xl border border-gray-200 px-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Enter phone number"
                                />
                            </div>
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium text-gray-700">Preferred language</span>
                            <div className="relative">
                                <Languages className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={formState.preferredLanguage}
                                    onChange={(event) => handleChange("preferredLanguage", event.target.value)}
                                    className="w-full rounded-xl border border-gray-200 px-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="English, Hindi, etc."
                                />
                            </div>
                        </label>

                        <label className="space-y-2 md:col-span-2">
                            <span className="text-sm font-medium text-gray-700">Timezone</span>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={formState.timezone}
                                    onChange={(event) => handleChange("timezone", event.target.value)}
                                    className="w-full rounded-xl border border-gray-200 px-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Asia/Kolkata"
                                />
                            </div>
                        </label>

                        {mode === "teacher" ? (
                            <>
                                <label className="space-y-2">
                                    <span className="text-sm font-medium text-gray-700">Designation</span>
                                    <div className="relative">
                                        <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={formState.designation}
                                            onChange={(event) => handleChange("designation", event.target.value)}
                                            className="w-full rounded-xl border border-gray-200 px-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="CA Faculty, Mentor, etc."
                                        />
                                    </div>
                                </label>

                                <label className="space-y-2">
                                    <span className="text-sm font-medium text-gray-700">Subjects / expertise</span>
                                    <div className="relative">
                                        <BookOpenCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={formState.expertise}
                                            onChange={(event) => handleChange("expertise", event.target.value)}
                                            className="w-full rounded-xl border border-gray-200 px-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Taxation, Audit, Accounts"
                                        />
                                    </div>
                                </label>

                                <label className="space-y-3 md:col-span-2 pt-2 border-t border-gray-100 mt-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <span className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                Public Educator Profile <ShieldCheck className="text-emerald-500 w-4 h-4" />
                                            </span>
                                            <p className="text-xs text-gray-500 mt-1 max-w-[80%]">
                                                When enabled, anyone can view your public badge, bio, and free resources. Turn this off to stay completely private.
                                            </p>
                                        </div>
                                        <div className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={formState.isPublicProfile}
                                                onChange={(e) => handleChange("isPublicProfile", e.target.checked.toString())}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </div>
                                    </div>
                                </label>
                            </>
                        ) : (
                            <label className="space-y-2 md:col-span-2">
                                <span className="text-sm font-medium text-gray-700">Exam target</span>
                                <div className="relative">
                                    <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={formState.examTarget}
                                        onChange={(event) => handleChange("examTarget", event.target.value)}
                                        className="w-full rounded-xl border border-gray-200 px-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="CA Inter May 2027, CA Final Group 1, etc."
                                    />
                                </div>
                            </label>
                        )}

                        <label className="space-y-2 md:col-span-2">
                            <span className="text-sm font-medium text-gray-700">{mode === "teacher" ? "Bio / teaching note" : "Bio / study note"}</span>
                            <textarea
                                rows={5}
                                value={formState.bio}
                                onChange={(event) => handleChange("bio", event.target.value)}
                                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder={mode === "teacher" ? "Brief summary of teaching experience, classes, and approach." : "Brief summary of goals, background, or study preferences."}
                            />
                        </label>
                    </div>

                    {statusMessage && (
                        <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
                            {statusMessage}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {isSaving ? "Saving..." : "Save profile"}
                    </button>
                </form>
            </div>
        </div>
    );
}
