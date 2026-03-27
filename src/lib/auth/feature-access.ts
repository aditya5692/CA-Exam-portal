import "server-only";

import prisma from "@/lib/prisma/client";
import { getCurrentUserOrDemoUser } from "./session";
import type { AppRole } from "./demo-accounts";
import { 
  FEATURE_DEFINITIONS, 
  FeatureKey, 
  FeatureCapability, 
  UserWithOverrides,
  resolveFeatureAccessForUser,
  buildFeatureMatrixForUser
} from "./feature-access-shared";

export * from "./feature-access-shared";

export async function getUserWithFeatureOverrides(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      featureOverrides: true,
    },
  });
}

export async function getCurrentUserFeatureMatrix(
  seedRole: AppRole,
  allowedRoles?: AppRole | AppRole[]
) {
  const currentUser = await getCurrentUserOrDemoUser(seedRole, allowedRoles);
  const fullUser = await getUserWithFeatureOverrides(currentUser.id);
  const user = fullUser ?? { ...currentUser, featureOverrides: [] };

  return {
    user,
    features: buildFeatureMatrixForUser(user),
  };
}

export async function assertUserCanAccessFeature(
  userId: string,
  featureKey: FeatureKey,
  capability: FeatureCapability
) {
  const user = await getUserWithFeatureOverrides(userId);
  if (!user) {
    throw new Error("User not found.");
  }

  if (user.isBlocked) {
    throw new Error(user.blockedReason?.trim() || "This account has been blocked by an administrator.");
  }

  const feature = resolveFeatureAccessForUser(user, featureKey);
  if (!feature.isEnabled) {
    throw new Error(`${feature.label} has been disabled for this account.`);
  }

  if (feature.isRestricted) {
    throw new Error(`${feature.label} is currently restricted by an administrator.`);
  }

  const capabilityMap: Record<FeatureCapability, boolean> = {
    read: feature.canRead,
    create: feature.canCreate,
    update: feature.canUpdate,
    delete: feature.canDelete,
    share: feature.canShare,
  };

  if (!capabilityMap[capability]) {
    throw new Error(`This account is not allowed to ${capability} in ${feature.label}.`);
  }

  return { user, feature };
}
