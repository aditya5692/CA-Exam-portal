"use client";

import { useState } from "react";
import { Plus, UploadSimple, PaperPlaneRight, User, GraduationCap, Copy, CheckCircle } from "@phosphor-icons/react";
import { StudentAccessCode } from "@prisma/client";
import { createStudentAccess, bulkCreateStudentAccess, sendCodesViaMailchimp } from "@/actions/student-manager-actions";

export function AccessCodesClient({ initialCodes }: { initialCodes: StudentAccessCode[] }) {
    const [codes, setCodes] = useState<StudentAccessCode[]>(initialCodes);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    
    // Add Student Form State
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [caLevel, setCaLevel] = useState("");
    const [subject, setSubject] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    
    // Bulk Upload State
    const [csvContent, setCsvContent] = useState("");
    
    // Global actions
    const [isSending, setIsSending] = useState(false);
    
    // Utilities
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const handleCreateStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const res = await createStudentAccess({ name, email, caLevel, subject });
        setIsSaving(false);
        if (res.success && res.data) {
            setCodes([res.data, ...codes]);
            setShowAddModal(false);
            setName(""); setEmail(""); setCaLevel(""); setSubject("");
        } else {
            alert(res.message);
        }
    };

    const handleBulkUpload = async () => {
        if (!csvContent) return;
        setIsSaving(true);
        
        // simple CSV parser
        const lines = csvContent.split("\n").map(l => l.trim()).filter(l => l);
        const headers = lines[0].split(",");
        
        const data = lines.slice(1).map(line => {
            const values = line.split(",");
            return {
                name: values[0]?.trim() || "Unknown",
                email: values[1]?.trim() || "",
                caLevel: values[2]?.trim() || "",
                subject: values[3]?.trim() || ""
            };
        }).filter(item => item.email);

        const res = await bulkCreateStudentAccess(data);
        setIsSaving(false);
        if (res.success) {
            alert(res.message);
            setShowUploadModal(false);
            setCsvContent("");
            window.location.reload(); // Refresh to get all codes
        } else {
            alert(res.message);
        }
    };

    const handleSendEmails = async () => {
        const pendingIds = codes.filter(c => !c.isEmailed).map(c => c.id);
        if (pendingIds.length === 0) {
            alert("No pending emails to send.");
            return;
        }

        setIsSending(true);
        const res = await sendCodesViaMailchimp(pendingIds);
        setIsSending(false);
        if (res.success) {
            alert(res.message);
            setCodes(codes.map(c => pendingIds.includes(c.id) ? { ...c, isEmailed: true } : c));
        } else {
            alert(res.message);
        }
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight font-outfit">Batch Access Codes</h2>
                    <p className="text-sm text-slate-500 font-medium">Manage pre-registered students and their join links.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowAddModal(true)} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-50 flex items-center gap-2 transition-all shadow-sm">
                        <Plus size={16} weight="bold" /> Add Student
                    </button>
                    <button onClick={() => setShowUploadModal(true)} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-50 flex items-center gap-2 transition-all shadow-sm">
                        <UploadSimple size={16} weight="bold" /> Upload CSV
                    </button>
                    <button onClick={handleSendEmails} disabled={isSending} className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50">
                        <PaperPlaneRight size={16} weight="bold" /> {isSending ? "Sending..." : "Send Emails to All"}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Student Info</th>
                            <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Level & Subject</th>
                            <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Access Code</th>
                            <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {codes.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-10 text-center text-slate-400 font-bold text-sm">No access codes generated yet. Add a student to begin.</td>
                            </tr>
                        )}
                        {codes.map(c => (
                            <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                            <User size={18} weight="bold" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900 text-sm">{c.name}</div>
                                            <div className="text-[10px] font-bold text-slate-400 mt-0.5">{c.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-5">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2.5 py-1 bg-slate-100 rounded text-[9px] font-bold text-slate-600 uppercase tracking-widest truncate max-w-[120px]">{c.caLevel || "N/A"}</span>
                                        <span className="px-2.5 py-1 bg-slate-100 rounded text-[9px] font-bold text-slate-600 uppercase tracking-widest truncate max-w-[120px]">{c.subject || "N/A"}</span>
                                    </div>
                                </td>
                                <td className="p-5">
                                    <div className="flex items-center gap-3">
                                        <code className="text-sm font-mono font-bold text-indigo-600">{c.code}</code>
                                        <button onClick={() => copyCode(c.code)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors">
                                            {copiedCode === c.code ? <CheckCircle size={16} weight="bold" className="text-emerald-500" /> : <Copy size={16} weight="bold" />}
                                        </button>
                                    </div>
                                </td>
                                <td className="p-5">
                                    <div className="flex flex-col gap-2">
                                        <span className={`w-fit px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${c.status === "VERIFIED" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"}`}>
                                            {c.status}
                                        </span>
                                        <span className={`text-[9px] font-bold uppercase tracking-widest ${c.isEmailed ? "text-emerald-500" : "text-slate-400"}`}>
                                            {c.isEmailed ? "Emailed" : "Not sent yet"}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Student Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <User size={20} weight="bold" />
                            </div>
                            <h3 className="text-xl font-bold">Add Student</h3>
                        </div>
                        <form onSubmit={handleCreateStudent} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Name</label>
                                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
                                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">CA Level</label>
                                    <input placeholder="e.g. CA Inter" type="text" value={caLevel} onChange={e => setCaLevel(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Subject</label>
                                    <input placeholder="e.g. Audit" type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl">Cancel</button>
                                <button type="submit" disabled={isSaving} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md disabled:opacity-50">Save Student</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bulk Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <UploadSimple size={20} weight="bold" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Bulk Upload CSV</h3>
                                <p className="text-xs text-slate-500 mt-1">Format: Name,Email,Level,Subject</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <textarea value={csvContent} onChange={e => setCsvContent(e.target.value)} placeholder="Jane Doe,jane@example.com,CA Inter,Audit&#10;John Smith,john@example.com,CA Final,Law" className="w-full h-40 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono text-sm whitespace-pre"></textarea>
                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setShowUploadModal(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl">Cancel</button>
                                <button type="button" onClick={handleBulkUpload} disabled={isSaving || !csvContent} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md disabled:opacity-50">Upload & Generate Codes</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
