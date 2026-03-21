import { FeatureRouteGate } from "@/components/access/feature-route-gate";
import type { ReactNode } from "react";

export default function FeatureLayout({ children }: { children: ReactNode }) {
  return (
    <FeatureRouteGate
      seedRole="TEACHER"
      allowedRoles={["TEACHER", "ADMIN"]}
      featureKey="TEACHER_MATERIALS"
      homeHref="/teacher/dashboard"
      homeLabel="Return to teacher dashboard"
    >
      {children}
    </FeatureRouteGate>
  );
}