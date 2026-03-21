import { Footer } from "@/components/common/footer";
import { Navbar } from "@/components/common/navbar";
import { Testimonials } from "@/components/common/testimonials";
import { getSessionPayload } from "@/lib/auth/session";
import {
  CaretRight,
  ChalkboardTeacher,
  ChartLineUp,
  CheckCircle,
  Exam,
  GraduationCap,
  Play,
  ShieldCheck,
  Sparkle,
  Timer
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getSessionPayload();

  if (session) {
    if (session.role === "ADMIN") redirect("/admin/dashboard");
    if (session.role === "TEACHER") redirect("/teacher/dashboard");
    redirect("/student/dashboard");
  }

  return (
    <div className="min-h-screen bg-white selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar user={session} />

      <div className="pt-24 sm:pt-32">
        <div className="bg-indigo-600 py-4 relative overflow-hidden group shadow-lg shadow-indigo-600/20">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-center gap-6 text-white relative z-10">
            <div className="flex items-center gap-3">
              <Sparkle size={20} weight="fill" className="text-amber-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-100">Mega Holi Offer</span>
            </div>
            <p className="text-sm font-bold text-indigo-50 leading-none font-sans">
              Get <span className="text-white decoration-amber-400 underline decoration-2 underline-offset-4">CA Pass PRO</span> for just <span className="text-2xl font-bold font-outfit text-white">₹399</span>/year!
            </p>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-sm">Ends in 08:44:21</span>
              <Link href="/pricing" className="bg-white text-indigo-600 px-5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-amber-400 hover:text-white transition-all shadow-lg active:scale-95 border-b-2 border-indigo-200">
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
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 shadow-sm shadow-emerald-500/5">
                <ShieldCheck size={16} weight="bold" className="text-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">ICAI Approved Standards</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-slate-900 font-outfit leading-[1.05] tracking-tight">
                Prepare for <span className="text-indigo-600">Success</span> with India&apos;s Best CA Portal
              </h1>
              <p className="text-xl text-gray-500 leading-relaxed max-w-lg font-medium">
                The ultimate tool for CA Foundation, Inter, and Final aspirants. Experience ACCA-level simulation and NISM standards.
              </p>
              <div className="flex flex-col sm:flex-row gap-6">
                <Link
                  href="/student/exams"
                  className="px-10 py-6 rounded-2xl bg-indigo-600 text-white font-bold text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 hover:translate-y-[-2px] transition-all active:scale-95 flex items-center justify-center gap-3 group"
                >
                  Start Mock Test <Play size={22} weight="fill" className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/pricing"
                  className="px-10 py-6 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold text-lg hover:border-indigo-200 hover:bg-slate-50 hover:translate-y-[-2px] transition-all flex items-center justify-center gap-3 shadow-sm"
                >
                  Explore Pass Pro
                </Link>
              </div>
              <div className="flex items-center gap-10 pt-6">
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-slate-900 font-outfit">500k+</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Active Learners</span>
                </div>
                <div className="w-px h-12 bg-slate-100" />
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-slate-900 font-outfit">18,000+</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Mock Tests</span>
                </div>
              </div>
            </div>

            <div className="relative animate-in zoom-in-95 duration-1000 delay-200">
              {/* Visual Abstract Elements */}
              <div className="aspect-square rounded-3xl bg-gray-50 border border-gray-100 relative overflow-hidden flex items-center justify-center shadow-inner">
                <div className="absolute top-8 left-8 p-6 rounded-2xl bg-white border border-gray-100 shadow-xl animate-bounce-slow">
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

                <div className="absolute bottom-12 right-12 p-8 rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 animate-float">
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
                <div key={i} className="p-10 rounded-3xl border border-slate-100 bg-white hover:border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col items-start translate-y-0 hover:-translate-y-1">
                  <div className={`w-16 h-16 rounded-2xl ${feature.color} ${feature.iconColor} flex items-center justify-center mb-10 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110 shadow-lg shadow-current/5`}>
                    <feature.icon size={32} weight="bold" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4 font-outfit tracking-tight">{feature.title}</h3>
                  <p className="text-slate-500 leading-relaxed font-medium mb-10 font-sans">
                    {feature.desc}
                  </p>
                  <Link href="/pricing" className="mt-auto text-[10px] font-bold text-slate-400 group-hover:text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2 transition-all group-hover:translate-x-2">
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
          <div className="max-w-7xl mx-auto bg-indigo-900 rounded-3xl p-12 md:p-24 relative overflow-hidden text-center text-white">
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

      <Footer />
    </div>
  );
}
