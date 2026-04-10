import { FeatureRouteGate } from "@/components/access/feature-route-gate";
import type { ReactNode } from "react";

export default function MaterialsNestedLayout({ children }: { children: ReactNode }) {
  return (
    <FeatureRouteGate
      seedRole="TEACHER"
      allowedRoles={["TEACHER", "ADMIN"]}
      featureKey="TEACHER_MATERIALS"
      homeHref="/teacher/free-resources"
      homeLabel="Return to study materials"
    >
      {children}
    </FeatureRouteGate>
  );
}
