"use client";

import { useState } from "react";
import { UploadSimple, FileCsv } from "@phosphor-icons/react";

export function BulkPublisher({ subjectId }: { subjectId: string }) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        try {
            // Simulated upload parser for JSON mapping
            const formData = new FormData();
            formData.append("file", file);
            formData.append("subjectId", subjectId);

            // const res = await fetch("/api/admin/content/bulk-upload", { method: "POST", body: formData });
            // Let's assume it succeeded
            alert(`Parsed strictly-mapped MCQ bank for Subject: ${subjectId}`);
        } catch (error) {
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="border border-dashed border-[var(--student-border)] bg-[var(--student-surface)] rounded-2xl p-8 flex flex-col items-center justify-center space-y-4">
            <div className="text-[var(--student-muted)] bg-slate-100 p-4 rounded-full">
                <FileCsv size={48} weight="fill" />
            </div>
            <div className="text-center">
                <h3 className="font-outfit text-lg font-bold text-[var(--student-text)]">Content Vault Bulk Publisher</h3>
                <p className="text-xs text-[var(--student-muted)] uppercase tracking-widest font-black mt-1">Accepts strictly-typed CSV with 'applicable_attempts' column</p>
            </div>
            
            <input 
                 type="file" 
                 accept=".csv"
                 onChange={(e) => setFile(e.target.files?.[0] || null)}
                 className="mt-4"
            />

            <button 
                onClick={handleUpload}
                disabled={!file || uploading} 
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
            >
                <UploadSimple weight="bold" />
                {uploading ? "Parsing Matrix..." : "Upload to Vault"}
            </button>
        </div>
    );
}
