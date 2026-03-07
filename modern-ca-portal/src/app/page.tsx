"use client";

import Link from "next/link";
import {
  GraduationCap,
  CaretRight,
  ChalkboardTeacher,
  Exam,
  ShieldCheck,
  ChartLineUp,
  Sparkle,
  Play,
  Timer,
  CheckCircle
} from "@phosphor-icons/react";
import { EliteNavbar } from "@/components/common/navbar";
import { EliteFooter } from "@/components/common/footer";
import { Testimonials } from "@/components/common/testimonials";

export default function Home() {
  return (
    <div className="min-h-screen bg-white selection:bg-indigo-100 selection:text-indigo-900">
      <EliteNavbar />

      {/* Offer Countdown Banner */}
      <div className="pt-24 sm:pt-32">
        <div className="bg-indigo-600 py-3 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-white">
            <div className="flex items-center gap-2">
              <Sparkle size={18} weight="fill" className="text-amber-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-[0.2em]">Mega Holi Offer</span>
            </div>
            <p className="text-sm font-bold text-indigo-50 leading-none">
              Get <span className="text-white decoration-amber-400 underline decoration-2 underline-offset-4">CA Pass PRO</span> for just <span className="text-xl font-outfit text-white">₹399</span>/year!
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest bg-white/10 px-2 py-1 rounded">Ends in 08:44:21</span>
              <Link href="/pricing" className="bg-white text-indigo-600 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-amber-400 hover:text-white transition-all shadow-lg active:scale-95">
                Claim Now
              </Link>
            </div>
          </div>
        </div>
      </div>

      <main>
        {/* Hero Section */}
        <section className="relative pt-20 pb-24 overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-50/30 to-transparent -z-10 blur-3xl opacity-50" />
          <div className="max-w-7xl mx-auto px-6 sm:px-12 grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-10 animate-in fade-in slide-in-from-left-8 duration-1000">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100">
                <ShieldCheck size={14} weight="bold" className="text-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">NISM &amp; ICAI Approved Standards</span>
              </div>
              <h1 className="text-6xl md:text-7xl font-bold text-gray-900 font-outfit leading-[1.1] tracking-tight">
                Prepare for <span className="text-indigo-600">Success</span> with India&apos;s Smartest Portal.
              </h1>
              <p className="text-xl text-gray-500 leading-relaxed max-w-lg font-medium">
                The ultimate tool for CA Foundation, Inter, and Final aspirants. Experience ACCA-level simulation and NISM standards.
              </p>
              <div className="flex flex-col sm:flex-row gap-6">
                <Link
                  href="/student/exams"
                  className="px-8 py-5 rounded-[24px] bg-indigo-600 text-white font-bold text-lg shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 hover:shadow-indigo-600/40 transition-all active:scale-95 flex items-center justify-center gap-3 group"
                >
                  Start Mock Test <Play size={20} weight="fill" className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/pricing"
                  className="px-8 py-5 rounded-[24px] bg-white border-2 border-gray-100 text-gray-900 font-bold text-lg hover:border-indigo-100 hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
                >
                  Explore Pass Pro
                </Link>
              </div>
              <div className="flex items-center gap-8 pt-4">
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-gray-900 font-outfit">500k+</span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Learners</span>
                </div>
                <div className="w-px h-10 bg-gray-100" />
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-gray-900 font-outfit">18,000+</span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mock Tests</span>
                </div>
              </div>
            </div>

            <div className="relative animate-in zoom-in-95 duration-1000 delay-200">
              {/* Visual Abstract Elements */}
              <div className="aspect-square rounded-[48px] bg-gray-50 border border-gray-100 relative overflow-hidden flex items-center justify-center shadow-inner">
                <div className="absolute top-8 left-8 p-6 rounded-3xl bg-white border border-gray-100 shadow-xl animate-bounce-slow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                      <Timer size={20} weight="bold" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Accuracy</p>
                      <p className="text-lg font-bold text-gray-900 font-outfit">92.4%</p>
                    </div>
                  </div>
                  <div className="h-1.5 w-32 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500" style={{ width: '92.4%' }} />
                  </div>
                </div>

                <div className="absolute bottom-12 right-12 p-8 rounded-[36px] bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30 animate-float">
                  <ChartLineUp size={48} weight="bold" className="opacity-20 absolute -top-4 -right-4" />
                  <p className="text-xs font-bold uppercase tracking-widest mb-2 text-indigo-100">Daily Progress</p>
                  <p className="text-4xl font-bold font-outfit">+12%</p>
                  <p className="text-[10px] text-indigo-100 mt-4 leading-tight opacity-80">Rank: Top 1% in CA Inter</p>
                </div>

                <GraduationCap size={240} weight="thin" className="text-gray-200 opacity-20 rotate-12" />
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 px-6 sm:px-12 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "Expert Instruction",
                  desc: "Learn from top CA educators with real-world case studies.",
                  icon: ChalkboardTeacher,
                  color: "bg-indigo-50",
                  iconColor: "text-indigo-600"
                },
                {
                  title: "Adaptive Exams",
                  desc: "Tests that adapt to your performance levels to maximize learning.",
                  icon: Exam,
                  color: "bg-emerald-50",
                  iconColor: "text-emerald-600"
                },
                {
                  title: "Live Analytics",
                  desc: "Instant feedback on your performance with detailed subject analysis.",
                  icon: ChartLineUp,
                  color: "bg-amber-50",
                  iconColor: "text-amber-600"
                },
              ].map((feature, i) => (
                <div key={i} className="p-10 rounded-[40px] border border-gray-100 hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all group">
                  <div className={`w-14 h-14 rounded-2xl ${feature.color} ${feature.iconColor} flex items-center justify-center mb-10 group-hover:scale-110 transition-transform`}>
                    <feature.icon size={28} weight="bold" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 font-outfit">{feature.title}</h3>
                  <p className="text-gray-500 leading-relaxed font-medium mb-8">
                    {feature.desc}
                  </p>
                  <Link href="/pricing" className="text-xs font-bold text-gray-400 group-hover:text-indigo-600 uppercase tracking-widest flex items-center gap-2 transition-colors">
                    Learn More <CaretRight size={14} weight="bold" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Testimonials />

        {/* CTA Overlay */}
        <section className="py-24 px-6 sm:px-12">
          <div className="max-w-7xl mx-auto bg-indigo-900 rounded-[56px] p-12 md:p-24 relative overflow-hidden text-center text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent pointer-events-none" />
            <Sparkle size={120} weight="fill" className="absolute -top-10 -right-10 opacity-10" />
            <GraduationCap size={160} weight="fill" className="absolute -bottom-20 -left-10 opacity-5" />

            <div className="relative z-10 space-y-8">
              <h2 className="text-4xl md:text-6xl font-bold font-outfit leading-tight tracking-tight max-w-4xl mx-auto">
                Ready to transform your preparation journey?
              </h2>
              <p className="text-indigo-100/70 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                Join the ranks of toppers. Get unlimited access to 18,000+ mock tests and live mentor support today.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Link
                  href="/auth/signup"
                  className="px-10 py-5 rounded-2xl bg-white text-indigo-900 font-bold text-lg hover:bg-gray-50 transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3"
                >
                  Start Premium Journey
                </Link>
                <Link
                  href="/contact"
                  className="px-10 py-5 rounded-2xl bg-indigo-800 text-white font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
                >
                  Talk to Expert Counselor
                </Link>
              </div>
              <div className="flex items-center justify-center gap-12 pt-8 opacity-60">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"><CheckCircle size={18} /> Instant Activation</span>
                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                  <ShieldCheck size={16} weight="bold" /> ICAI Pattern 2026
                </div>
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"><CheckCircle size={18} /> Secure ₹ Gateway</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <EliteFooter />
    </div>
  );
}
