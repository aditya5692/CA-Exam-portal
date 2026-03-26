import { Metadata } from "next";
import { RedeemCodeClient } from "@/components/student/redeem/client-page";
import { getCurrentUser } from "@/lib/auth/session";
import prisma from "@/lib/prisma/client";

export const metadata: Metadata = {
  title: "Redeem Code | Student Portal",
  description: "Verify your batch access payload.",
};

export default async function StudentRedeemPage() {
  const user = await getCurrentUser(["STUDENT", "ADMIN"]);
  let claimedCodes: any[] = [];
  
  if (user?.id) {
      claimedCodes = await prisma.studentAccessCode.findMany({
          where: { studentId: user.id },
          include: { teacher: { select: { fullName: true, email: true } } },
          orderBy: { createdAt: "desc" }
      });
  }

  return (
    <div className="space-y-6 pb-10 w-full max-w-[1280px] mx-auto font-outfit animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--student-accent-strong)] shadow-[0_0_10px_rgba(31,92,80,0.2)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--student-muted)]">
              Access Verification
            </span>
          </div>
          <h1 className="font-outfit tracking-tighter leading-tight text-3xl font-bold text-[var(--student-text)]">
            Redeem Code
          </h1>
          <p className="text-[var(--student-muted)] font-medium text-base font-sans max-w-2xl leading-relaxed">
            Validate your batch code to securely attach your profile to the corresponding instructional segment.
          </p>
        </div>
      </div>
      
      <RedeemCodeClient claimedCodes={claimedCodes} />
    </div>
  );
}
