import { getPublicEducatorProfile } from "@/actions/public-actions";
import { notFound } from "next/navigation";
import { CheckCircle, UsersRound, BookOpen, ShieldCheck, Share2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function PublicEducatorProfilePage({ params }: { params: { id: string } }) {
    const profile = await getPublicEducatorProfile(params.id);

    if (!profile) {
        notFound();
    }

    const { fullName, designation, expertise, bio, totalMaterials, totalBatches } = profile;
    const initial = fullName.charAt(0).toUpperCase();

    return (
        <main className="min-h-screen bg-[#FAFAFA] text-gray-900 font-inter selection:bg-indigo-500/30">
            {/* Simple Navbar */}
            <nav className="fixed top-0 inset-x-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center px-6">
                <Link href="/" className="font-outfit font-black text-xl text-indigo-600">CA Portal</Link>
            </nav>

            <section className="relative pt-32 pb-24 px-6 sm:px-12">
                {/* Background Decorators */}
                <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-[#0A0F1C] to-transparent pointer-events-none" />
                <div className="absolute top-20 left-1/4 w-[40rem] h-[20rem] bg-indigo-500/10 blur-[100px] pointer-events-none rounded-full" />

                <div className="relative z-10 max-w-4xl mx-auto">

                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Profile Avatar / Left Column */}
                        <div className="flex-shrink-0 flex flex-col items-center gap-4">
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-tr from-[#1A2235] to-[#2D3748] shadow-2xl shadow-indigo-500/20 p-1 flex items-center justify-center relative border-4 border-[#0A0F1C]">
                                <div className="w-full h-full rounded-full bg-gray-900 border border-gray-700 flex items-center justify-center text-4xl font-black text-white">
                                    {initial}
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-full border-[3px] border-[#0A0F1C] shadow-lg" title="Verified Educator">
                                    <CheckCircle className="w-5 h-5" />
                                </div>
                            </div>

                            <button className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200 transition-colors w-full justify-center">
                                <Share2 className="w-4 h-4" /> Share Profile
                            </button>
                        </div>

                        {/* Profile Details / Right Column */}
                        <div className="flex-1 space-y-6 lg:pt-4">
                            <div>
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[12px] bg-indigo-500/20 border border-indigo-500/30 mb-4 backdrop-blur-sm">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300">Official CA Partner</span>
                                </div>

                                <h1 className="text-4xl md:text-5xl font-black font-outfit text-white tracking-tight flex items-center gap-4">
                                    {fullName}
                                </h1>

                                <div className="mt-4 flex flex-wrap items-center gap-3 md:gap-6 text-sm md:text-base font-medium text-slate-400">
                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-[12px] text-slate-200 backdrop-blur-sm"><ShieldCheck className="w-4 h-4" /> {designation}</span>
                                    <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-indigo-400" /> {expertise}</span>
                                </div>
                            </div>

                            <div className="bg-white rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mt-8 relative overflow-hidden">
                                <h2 className="text-xl font-bold font-outfit text-slate-900 mb-4 flex items-center gap-2">About the Educator</h2>
                                <p className="text-slate-500 leading-relaxed text-sm md:text-base whitespace-pre-wrap font-sans">
                                    {bio || "This educator hasn't written a biography yet, but their materials speak for themselves!"}
                                </p>
                            </div>

                            {/* Key Metrics */}
                            <div className="grid grid-cols-2 gap-6 mt-6">
                                <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-between group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300">
                                    <div>
                                        <p className="text-3xl font-black text-slate-900 font-outfit">{totalMaterials}</p>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-2">Free Resources</p>
                                    </div>
                                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[20px] flex items-center justify-center shrink-0">
                                        <BookOpen className="w-7 h-7" />
                                    </div>
                                </div>
                                <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-between group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300">
                                    <div>
                                        <p className="text-3xl font-black text-slate-900 font-outfit">{totalBatches}</p>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-2">Active Batches</p>
                                    </div>
                                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-[20px] flex items-center justify-center shrink-0">
                                        <UsersRound className="w-7 h-7" />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </section>

            {/* Footer space */}
        </main>
    );
}
