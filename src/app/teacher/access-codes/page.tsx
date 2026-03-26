import { Metadata } from "next";
import { getTeacherStudents } from "@/actions/student-manager-actions";
import { AccessCodesClient } from "@/components/teacher/access-codes/client-page";

export const metadata: Metadata = {
  title: "Batch Codes | Teacher Studio",
  description: "Manage pre-registered students and batch join codes.",
};

export default async function TeacherAccessCodesPage() {
  const response = await getTeacherStudents();
  const codes = response.success ? response.data || [] : [];

  return (
    <div className="space-y-6 pb-10 w-full max-w-[1280px] mx-auto font-outfit animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.2)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Access Management
            </span>
          </div>
          <h1 className="font-outfit tracking-tighter leading-tight text-3xl font-bold text-slate-900">
            Batch Codes
          </h1>
          <p className="text-slate-500 font-medium text-base font-sans max-w-2xl leading-relaxed">
            Generate and manage access codes for your students. Students can use these codes to join your batches.
          </p>
        </div>
      </div>
      
      <AccessCodesClient initialCodes={codes} />
    </div>
  );
}
