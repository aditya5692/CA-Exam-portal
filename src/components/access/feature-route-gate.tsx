import Link from "next/link";
import type { ReactNode } from "react";
import type { AppRole } from "@/lib/auth/demo-accounts";
import {
  assertUserCanAccessFeature,
  type FeatureCapability,
  type FeatureKey,
} from "@/lib/auth/feature-access";
import { getCurrentUserOrDemoUser } from "@/lib/auth/session";

type FeatureRouteGateProps = {
  children: ReactNode;
  seedRole: AppRole;
  allowedRoles?: AppRole | AppRole[];
  featureKey: FeatureKey;
  capability?: FeatureCapability;
  homeHref: string;
  homeLabel?: string;
};

export async function FeatureRouteGate({
  children,
  seedRole,
  allowedRoles,
  featureKey,
  capability = "read",
  homeHref,
  homeLabel = "Return to dashboard",
}: FeatureRouteGateProps) {
  const currentUser = await getCurrentUserOrDemoUser(seedRole, allowedRoles);
  let hasAccess = false;
  let errorMessage = "";

  try {
    await assertUserCanAccessFeature(currentUser.id, featureKey, capability);
    hasAccess = true;
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "You do not currently have access to this page.";
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
          Access Restricted
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">
          This workspace is not available for {currentUser.fullName ?? currentUser.registrationNumber ?? "this account"}.
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-300">{errorMessage}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={homeHref}
            className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
          >
            {homeLabel}
          </Link>
          <Link
            href="/admin/dashboard"
            className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Open Admin Center
          </Link>
        </div>
      </div>
    </div>
  );
}