"use client";

import { deletePYQ, publishMaterial } from "@/actions/educator-actions";
import { cn } from "@/lib/utils";
import type { TeacherMaterialWithRelations, TeacherMaterialsData } from "@/types/educator";
import {
    ArrowClockwise,
    ArrowUpRight,
    Check,
    DownloadSimple,
    FilePdf,
    FileText,
    MagnifyingGlass,
    Plus,
    Trash,
    Upload,
    Users,
    X,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

interface Props {
    initialData: TeacherMaterialsData;
    batches: { id: string; name: string; studentCount: number }[];
    currentUserId: string;
}

const CATEGORIES = ["GENERAL", "CA FINAL", "CA INTER", "CA FOUNDATION", "CASE STUDIES"];
const SUB_TYPES = ["PDF", "VIDEO", "RTP", "MTP", "PYQ"];

export function MaterialsManager({ initialData, batches, currentUserId }: Props) {
    const router = useRouter();
    const [materials, setMaterials] = useState<TeacherMaterialWithRelations[]>(initialData.materials);
    const [searchQuery, setSearchQuery] = useState("");
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("All");

    // Filtered materials
    const filteredMaterials = useMemo(() => {
        return materials.filter((m: TeacherMaterialWithRelations) => {
            const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.subType.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === "All" || m.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [materials, searchQuery, selectedCategory]);

    const stats = useMemo(() => {
        return {
            total: materials.length,
            downloads: materials.reduce((acc: number, m: TeacherMaterialWithRelations) => acc + (m.downloads || 0), 0),
            public: materials.filter((m: TeacherMaterialWithRelations) => m.isPublic).length
        };
    }, [materials]);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this material? This action cannot be undone.")) return;

        try {
            const res = await deletePYQ(id);
            if (res.success) {
                setMaterials((prev: TeacherMaterialWithRelations[]) => prev.filter((m: TeacherMaterialWithRelations) => m.id !== id));
                toast.success("Material deleted successfully");
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error("An error occurred while deleting");
        }
    };

    const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        
        try {
            const res = await publishMaterial(formData);
            if (res.success) {
                toast.success("Material uploaded and shared successfully!");
                setIsUploadModalOpen(false);
                router.refresh(); // Refresh to get updated list (or I could manually update state)
                // Since materials is a state, I'll update it if the action returns the new material
                if (res.data) {
                    // Note: Action returns Prisma object, might need to re-fetch to get relations
                    // For now, router.refresh is cleaner but won't update client state immediately 
                    // unless I re-fetch in useEffect or use server action correctly.
                    // Actually, I'll just refresh and the page will re-render with new data.
                    window.location.reload(); 
                }
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error("Failed to upload material");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header section with Stats */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        Educator Library
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Manage Materials</h1>
                    <p className="text-sm text-slate-400 font-medium">Upload, organize, and distribute study content across your student batches.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-6 px-6 py-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                        <div className="text-center">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Total Files</p>
                            <p className="text-lg font-bold text-slate-900 leading-none">{stats.total}</p>
                        </div>
                        <div className="w-px h-8 bg-slate-100" />
                        <div className="text-center">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Downloads</p>
                            <p className="text-lg font-bold text-slate-900 leading-none">{stats.downloads}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="h-12 px-6 rounded-lg bg-slate-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-950/10 flex items-center gap-2 active:scale-95"
                    >
                        <Plus size={18} weight="bold" /> Upload Material
                    </button>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 bg-white border border-slate-100 rounded-lg shadow-sm">
                <div className="relative group w-full sm:max-w-sm">
                    < MagnifyingGlass size={18} weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search your library..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-slate-50/50 border border-transparent text-sm text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-100 focus:bg-white transition-all"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-hide">
                    <button
                        onClick={() => setSelectedCategory("All")}
                        className={cn(
                            "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap",
                            selectedCategory === "All" ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20" : "bg-white text-slate-500 border-slate-100 hover:border-slate-300"
                        )}
                    >
                        All Levels
                    </button>
                    {CATEGORIES.slice(1, 4).map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={cn(
                                "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap",
                                selectedCategory === cat ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20" : "bg-white text-slate-500 border-slate-100 hover:border-slate-300"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Materials Table */}
            <div className="bg-white border border-slate-100 rounded-lg overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Material</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Category</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Stats</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredMaterials.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <div className="w-16 h-16 rounded-lg bg-slate-50 flex items-center justify-center text-slate-200">
                                                <Upload size={32} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">No materials found</p>
                                                <p className="text-xs text-slate-400 font-medium">Try adjusting your filters or upload some new files.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredMaterials.map((m: TeacherMaterialWithRelations) => (
                                    <tr key={m.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-500 group-hover:border-indigo-100 transition-all">
                                                    {m.subType === "VIDEO" ? <ArrowUpRight size={20} weight="bold" /> : <FilePdf size={20} weight="fill" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-slate-900 leading-tight truncate max-w-[200px] lg:max-w-xs">{m.title}</p>
                                                    <p className="text-[10px] font-black text-indigo-500/70 uppercase tracking-widest mt-1">{m.subType}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                                {m.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            {m.isPublic ? (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                                                    <Check size={12} weight="bold" /> Public
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                                                    <Users size={12} weight="bold" /> Batch Only
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col items-center">
                                                <span className="text-sm font-bold text-slate-900">{m.downloads || 0}</span>
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Downloads</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <a
                                                    href={m.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm active:scale-95"
                                                    title="View"
                                                >
                                                    <DownloadSimple size={16} weight="bold" />
                                                </a>
                                                <button
                                                    onClick={() => handleDelete(m.id)}
                                                    className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm active:scale-95"
                                                    title="Delete"
                                                >
                                                    <Trash size={16} weight="bold" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        onClick={() => setIsUploadModalOpen(false)}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
                    />
                    <div
                        className="relative w-full max-w-xl bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-300"
                    >
                            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Upload New Material</h2>
                                    <p className="text-xs text-slate-400 font-medium mt-1">Files up to 50MB supported (PDF, Images, etc.)</p>
                                </div>
                                <button
                                    onClick={() => setIsUploadModalOpen(false)}
                                    className="w-10 h-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-950 transition-all active:scale-90 shadow-sm"
                                >
                                    <X size={20} weight="bold" />
                                </button>
                            </div>

                            <form onSubmit={handleUpload} className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5 group">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 group-focus-within:text-indigo-600 transition-colors">Title</label>
                                        <input
                                            required
                                            name="title"
                                            placeholder="e.g. Chapter 1 Summary"
                                            className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 focus:bg-white transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5 group">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 group-focus-within:text-indigo-600 transition-colors">Category</label>
                                        <select
                                            name="category"
                                            className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 focus:bg-white transition-all appearance-none"
                                        >
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5 group">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 group-focus-within:text-indigo-600 transition-colors">Type</label>
                                        <select
                                            name="subType"
                                            className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 focus:bg-white transition-all appearance-none"
                                        >
                                            {SUB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 group">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Visibility</label>
                                        <div className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                                            <input type="checkbox" name="isPublic" id="isPublic" className="sr-only peer" />
                                            <label htmlFor="isPublic" className="flex-1 flex items-center justify-center py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer bg-blue-100 text-blue-700 peer-checked:bg-slate-50 peer-checked:text-slate-400">
                                                Private
                                            </label>
                                            <label htmlFor="isPublic" className="flex-1 flex items-center justify-center py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer bg-slate-50 text-slate-400 peer-checked:bg-emerald-100 peer-checked:text-emerald-700">
                                                Public
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Assign to Batches</label>
                                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 grid grid-cols-2 gap-2 max-h-32 overflow-y-auto scrollbar-hide">
                                        {batches.length === 0 ? (
                                            <p className="col-span-2 text-[10px] text-slate-400 font-bold uppercase text-center py-2">No batches created yet</p>
                                        ) : (
                                            batches.map(b => (
                                                <label key={b.id} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-transparent hover:border-indigo-200 transition-all cursor-pointer group">
                                                    <input type="checkbox" name="batchIds" value={b.id} className="w-3.5 h-3.5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-bold text-slate-700 truncate">{b.name}</p>
                                                        <p className="text-[8px] font-black text-slate-300 uppercase">{b.studentCount} Students</p>
                                                    </div>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 group-focus-within:text-indigo-600 transition-colors">Select File</label>
                                    <div className="relative group/file">
                                        <input
                                            type="file"
                                            name="file"
                                            required
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="w-full border-2 border-dashed border-slate-200 rounded-lg p-8 flex flex-col items-center justify-center gap-3 bg-slate-50 group-hover/file:bg-indigo-50 group-hover/file:border-indigo-200 transition-all group-hover/file:scale-[0.99]">
                                            <div className="w-12 h-12 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover/file:text-indigo-600 group-hover/file:border-indigo-100 shadow-sm transition-all duration-300">
                                                <Upload size={24} weight="bold" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-bold text-slate-900">Drop file here or click to browse</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">PDF, DOCX, ZIP, MP4 (MAX 50MB)</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full h-14 rounded-lg bg-slate-900 text-white font-bold text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 overflow-hidden"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <ArrowClockwise size={20} className="animate-spin" weight="bold" />
                                            Uploading & Encrypting...
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={20} weight="bold" />
                                            Finalize & Publish Material
                                        </>
                                    )}
                                </button>
                            </form>
                    </div>
                </div>
            )}
        </div>
    );
}
