"use client";

import { getStudentProfile } from "@/actions/profile-actions";
import { isSafeExternalUrl } from "@/lib/profile-validation";
import { getStudentStatusLabel,resolveStudentExamTarget } from "@/lib/student-level";
import type { UserProfile } from "@/types/profile";
import { useCallback,useEffect,useState } from "react";
import { ProfileHeader } from "./avatar-section";
import { InfoCards } from "./info-cards";
import { JourneySection } from "./journey-section";
import { StudentProfileEditor } from "./student-profile-editor";
import { SharedPageHeader } from "@/components/shared/page-header";

export function StudentProfile() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const loadProfile = useCallback(async () => {
        setIsLoading(true);
        const response = await getStudentProfile();
        if (response.success) {
            setProfile(response.data);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadProfile();
        }, 0);

        return () => {
            window.clearTimeout(timer);
        };
    }, [loadProfile]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="h-12 w-12 rounded-full border-4 border-[var(--student-accent-soft)] border-t-[var(--student-accent-strong)] animate-spin" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="student-surface rounded-lg p-10 text-center text-[var(--student-muted)]">
                Failed to load profile. Please try again.
            </div>
        );
    }

    if (isEditing) {
        return (
            <StudentProfileEditor 
                profile={profile}
                onCancel={() => setIsEditing(false)}
                onSaveSuccess={() => {
                    setIsEditing(false);
                    loadProfile();
                }}
            />
        );
    }

    const examTarget = resolveStudentExamTarget(profile);
    const hasValidResumeUrl = isSafeExternalUrl(profile.resumeUrl);

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <SharedPageHeader
                eyebrow="Profile Center"
                title="Your learning"
                accent="identity"
                description="Keep your academic, professional, and account details current so the student experience stays tailored to your journey."
                aside={null}
            />

            <ProfileHeader 
                fullName={profile.fullName || "User"}
                registrationNumber={profile.registrationNumber}
                status={getStudentStatusLabel({
                    examTarget: profile.examTarget,
                    examTargetLevel: profile.examTargetLevel,
                    examTargetMonth: profile.examTargetMonth,
                    examTargetYear: profile.examTargetYear,
                    department: profile.department,
                    foundationCleared: profile.foundationCleared,
                    intermediateCleared: profile.intermediateCleared,
                    finalCleared: profile.finalCleared,
                })}
                onEdit={() => setIsEditing(true)}
                onResumeDownload={() => {
                    if (hasValidResumeUrl && profile.resumeUrl) {
                        window.open(profile.resumeUrl, "_blank", "noopener,noreferrer");
                    }
                }}
                isResumeDownloadAvailable={hasValidResumeUrl}
            />

            <JourneySection 
                foundationCleared={profile.foundationCleared}
                intermediateCleared={profile.intermediateCleared}
                finalCleared={profile.finalCleared}
                percentage={profile.finalCleared ? 100 : (profile.intermediateCleared ? 75 : (profile.foundationCleared ? 33 : 0))}
            />

            <InfoCards 
                batch={profile.batch}
                attemptDue={examTarget.label}
                location={profile.location}
                dob={profile.dob}
                plan={profile.plan}
                firm={profile.firm}
                firmRole={profile.firmRole}
                articleshipYear={profile.articleshipYear}
                articleshipTotal={profile.articleshipTotal}
                email={profile.email}
                phone={profile.phone}
                storageUsed={profile.storageUsed || 0}
                storageLimit={profile.storageLimit || 50 * 1024 * 1024}
            />
        </div>
    );
}
