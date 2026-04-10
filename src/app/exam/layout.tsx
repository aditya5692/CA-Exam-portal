import { FeatureRouteGate } from "@/components/access/feature-route-gate";
import type { ReactNode } from "react";

export default function FeatureLayout({ children }: { children: ReactNode }) {
  return (
    <FeatureRouteGate
      seedRole="STUDENT"
      allowedRoles={["STUDENT", "ADMIN"]}
      featureKey="STUDENT_EXAMS"
      homeHref="/student/dashboard"
      homeLabel="Return to student dashboard"
    >
      {children}
    </FeatureRouteGate>
  );
}
