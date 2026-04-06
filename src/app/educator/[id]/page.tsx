import { getPublicEducatorProfile } from "@/actions/public-actions";
import { BookOpen,CheckCircle,Share2,ShieldCheck,UsersRound } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function PublicEducatorProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const profile = await getPublicEducatorProfile(resolvedParams.id);

    if (!profile) {
        notFound();
    }

    const { fullName, designation, expertise, bio, totalMaterials, totalBatches } = profile;
    const initial = fullName.charAt(0).toUpperCase();

    return (
        <main className="min-h-screen bg-[var(--landing-bg)] text-[var(--landing-text)] font-medium selection:bg-[var(--landing-selection-bg)] selection:text-[var(--landing-accent)]">
            {/* Simple Navbar */}
            <nav className="fixed top-0 inset-x-0 h-16 bg-[var(--landing-panel)]/80 backdrop-blur-md border-b border-[var(--landing-border)] z-50 flex items-center px-6">
                <Link href="/" className="font-outfit font-black text-xl text-[var(--landing-text)]">Financly</Link>
            </nav>

            <section className="relative pt-32 pb-24 px-6 sm:px-12">
                {/* Background Decorators */}
                <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-[var(--landing-panel-dark)]/10 to-transparent pointer-events-none" />
                <div className="absolute top-20 left-1/4 w-[40rem] h-[20rem] bg-[var(--landing-selection-bg)]/20 blur-[100px] pointer-events-none rounded-full" />

                <div className="relative z-10 max-w-4xl mx-auto">

                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Profile Avatar / Left Column */}
                        <div className="flex-shrink-0 flex flex-col items-center gap-4">
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-tr from-[var(--landing-panel-dark)] to-[var(--landing-bg-dark)] shadow-[var(--landing-shadow-accent)] p-1 flex items-center justify-center relative border-4 border-[var(--landing-bg)]">
                                <div className="w-full h-full rounded-full bg-[var(--landing-panel)] border border-[var(--landing-border)] flex items-center justify-center text-4xl font-black text-[var(--landing-text)]">
                                    {initial}
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-[var(--landing-accent)] text-white p-2 rounded-full border-[3px] border-[var(--landing-bg)] shadow-lg" title="Verified Educator">
                                    <CheckCircle className="w-5 h-5" />
                                </div>
                            </div>

                            <button className="flex items-center gap-2 text-sm font-bold text-[var(--landing-muted)] hover:text-[var(--landing-accent)] bg-[var(--landing-panel)] px-4 py-2 rounded-full shadow-[var(--landing-shadow-sm)] border border-[var(--landing-border)] transition-colors w-full justify-center">
                                <Share2 className="w-4 h-4" /> Share Profile
                            </button>
                        </div>

                        {/* Profile Details / Right Column */}
                        <div className="flex-1 space-y-6 lg:pt-4">
                            <div>
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[12px] bg-[var(--landing-selection-bg)] border border-[var(--landing-border)] mb-4 backdrop-blur-sm">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--landing-accent)]">Official CA Partner</span>
                                </div>

                                <h1 className="text-4xl md:text-5xl font-black font-outfit text-[var(--landing-text)] tracking-tight flex items-center gap-4">
                                    {fullName}
                                </h1>

                                <div className="mt-4 flex flex-wrap items-center gap-3 md:gap-6 text-sm md:text-base font-medium text-[var(--landing-text)]/70">
                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-[var(--landing-panel)] rounded-[12px] text-[var(--landing-text)] border border-[var(--landing-border)] backdrop-blur-sm shadow-[var(--landing-shadow-sm)]"><ShieldCheck className="w-4 h-4" /> {designation}</span>
                                    <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-[var(--landing-accent)]" /> {expertise}</span>
                                </div>
                            </div>

                             <div className="bg-[var(--landing-panel)] rounded-[32px] p-8 shadow-[var(--landing-shadow)] border border-[var(--landing-border)] mt-8 relative overflow-hidden">
                                <h2 className="text-xl font-bold font-outfit text-[var(--landing-text)] mb-4 flex items-center gap-2">About the Educator</h2>
                                <p className="text-[var(--landing-muted)] leading-relaxed text-sm md:text-base whitespace-pre-wrap font-sans">
                                    {bio || "This educator hasn't written a biography yet, but their materials speak for themselves!"}
                                </p>
                            </div>

                            {/* Key Metrics */}
                            <div className="grid grid-cols-2 gap-6 mt-6">
                                <div className="bg-[var(--landing-panel)] rounded-[32px] p-8 border border-[var(--landing-border)] shadow-[var(--landing-shadow)] flex items-center justify-between group hover:shadow-[var(--landing-shadow-lg)] hover:-translate-y-1 transition-all duration-300">
                                    <div>
                                        <p className="text-3xl font-black text-[var(--landing-text)] font-outfit">{totalMaterials}</p>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--landing-muted)] mt-2">Free Resources</p>
                                    </div>
                                    <div className="w-14 h-14 bg-[var(--landing-selection-bg)] text-[var(--landing-accent)] rounded-[20px] flex items-center justify-center shrink-0">
                                        <BookOpen className="w-7 h-7" />
                                    </div>
                                </div>
                                <div className="bg-[var(--landing-panel)] rounded-[32px] p-8 border border-[var(--landing-border)] shadow-[var(--landing-shadow)] flex items-center justify-between group hover:shadow-[var(--landing-shadow-lg)] hover:-translate-y-1 transition-all duration-300">
                                    <div>
                                        <p className="text-3xl font-black text-[var(--landing-text)] font-outfit">{totalBatches}</p>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--landing-muted)] mt-2">Active Batches</p>
                                    </div>
                                    <div className="w-14 h-14 bg-[var(--landing-selection-bg)] text-[var(--landing-accent)] rounded-[20px] flex items-center justify-center shrink-0">
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
