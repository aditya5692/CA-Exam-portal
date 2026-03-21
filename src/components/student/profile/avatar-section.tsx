"use client";

import { Download,Edit3 } from "lucide-react";

interface ProfileHeaderProps {
    fullName: string;
    registrationNumber: string | null;
    status: string;
    onEdit: () => void;
    onResumeDownload: () => void;
}

export function ProfileHeader({ 
    fullName, 
    registrationNumber, 
    status, 
    onEdit, 
    onResumeDownload 
}: ProfileHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 mb-8 font-outfit">
            <div className="flex flex-col md:flex-row items-center md:items-center gap-6 text-center md:text-left">
                <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-slate-100 border-4 border-white shadow-xl">
                    <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-400">
                         <span className="text-4xl font-bold">{fullName.charAt(0)}</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">{fullName}</h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                        <span className="px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold ring-1 ring-indigo-100 uppercase tracking-wider">
                            {status}
                        </span>
                        {registrationNumber && (
                            <span className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-widest">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                {registrationNumber}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                <button 
                    onClick={onEdit}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                >
                    <Edit3 className="w-4 h-4" />
                    Edit Profile
                </button>
                <button 
                    onClick={onResumeDownload}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-200"
                >
                    <Download className="w-4 h-4" />
                    Download Resume
                </button>
            </div>
        </div>
    );
}
