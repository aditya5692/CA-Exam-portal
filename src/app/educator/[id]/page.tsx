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
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 mb-3">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-700">Official CA Partner</span>
                                </div>

                                <h1 className="text-4xl md:text-5xl font-black font-outfit text-white leading-tight flex items-center gap-4">
                                    {fullName}
                                </h1>

                                <div className="mt-3 flex flex-wrap items-center gap-3 md:gap-6 text-sm md:text-base font-medium text-gray-400">
                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-lg text-gray-200"><ShieldCheck className="w-4 h-4" /> {designation}</span>
                                    <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-indigo-500" /> {expertise}</span>
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 mt-8 relative overflow-hidden">
                                <h2 className="text-xl font-bold font-outfit mb-4 flex items-center gap-2">About the Educator</h2>
                                <p className="text-gray-600 leading-relaxed text-sm md:text-base whitespace-pre-wrap">
                                    {bio || "This educator hasn't written a biography yet, but their materials speak for themselves!"}
                                </p>
                            </div>

                            {/* Key Metrics */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-colors">
                                    <div>
                                        <p className="text-3xl font-black text-gray-900 font-outfit">{totalMaterials}</p>
                                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-1">Free Resources</p>
                                    </div>
                                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                </div>
                                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-colors">
                                    <div>
                                        <p className="text-3xl font-black text-gray-900 font-outfit">{totalBatches}</p>
                                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-1">Active Batches</p>
                                    </div>
                                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <UsersRound className="w-6 h-6" />
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
