"use client";

import { getStudentProfile } from "@/actions/profile-actions";
import type { UserProfile } from "@/types/profile";
import { useCallback,useEffect,useState } from "react";
import { ProfileHeader } from "./avatar-section";
import { InfoCards } from "./info-cards";
import { JourneySection } from "./journey-section";
import { StudentProfileEditor } from "./student-profile-editor";

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
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="p-10 text-center bg-white rounded-3xl border border-slate-100 text-slate-500">
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

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <ProfileHeader 
                fullName={profile.fullName || "User"}
                registrationNumber={profile.registrationNumber}
                status="Final Year CA Student" // Dynamically set if possible
                onEdit={() => setIsEditing(true)}
                onResumeDownload={() => window.open(profile.resumeUrl || "#", "_blank")}
            />

            <JourneySection 
                foundationCleared={profile.foundationCleared}
                intermediateCleared={profile.intermediateCleared}
                finalCleared={profile.finalCleared}
                percentage={profile.finalCleared ? 100 : (profile.intermediateCleared ? 75 : (profile.foundationCleared ? 33 : 0))}
            />

            <InfoCards 
                batch={profile.batch}
                attemptDue={profile.examTarget}
                location={profile.location}
                dob={profile.dob}
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
