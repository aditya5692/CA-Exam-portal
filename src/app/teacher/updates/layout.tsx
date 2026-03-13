import type { ReactNode } from "react";
import { FeatureRouteGate } from "@/components/access/feature-route-gate";

export default function FeatureLayout({ children }: { children: ReactNode }) {
  return (
    <FeatureRouteGate
      seedRole="TEACHER"
      allowedRoles={["TEACHER", "ADMIN"]}
      featureKey="TEACHER_UPDATES"
      homeHref="/teacher/dashboard"
      homeLabel="Return to teacher dashboard"
    >
      {children}
    </FeatureRouteGate>
  );
}