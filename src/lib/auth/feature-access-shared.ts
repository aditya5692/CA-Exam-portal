import type { User, UserFeatureAccess } from "@prisma/client";

export type FeatureCapability = "read" | "create" | "update" | "delete" | "share";
export type FeatureAudience = "TEACHER" | "STUDENT";
export type FeatureKey =
  | "TEACHER_DASHBOARD"
  | "TEACHER_PROFILE"
  | "TEACHER_BATCHES"
  | "TEACHER_UPDATES"
  | "TEACHER_STUDENTS"
  | "TEACHER_MATERIALS"
  | "TEACHER_QUESTION_BANK"
  | "TEACHER_ANALYTICS"
  | "STUDENT_DASHBOARD"
  | "STUDENT_PROFILE"
  | "STUDENT_EXAMS"
  | "STUDENT_MATERIALS"
  | "STUDENT_UPDATES"
  | "STUDENT_ANALYTICS";

export type FeatureDefinition = {
  key: FeatureKey;
  label: string;
  description: string;
  audience: FeatureAudience;
  defaults: Record<FeatureCapability, boolean>;
};

export type UserWithOverrides = Pick<User, "id" | "role" | "fullName" | "isBlocked" | "blockedReason"> & {
  featureOverrides?: Pick<
    UserFeatureAccess,
    | "featureKey"
    | "isEnabled"
    | "isRestricted"
    | "canRead"
    | "canCreate"
    | "canUpdate"
    | "canDelete"
    | "canShare"
    | "note"
  >[];
};

export type ResolvedFeatureAccess = FeatureDefinition & {
  isEnabled: boolean;
  isRestricted: boolean;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canShare: boolean;
  note: string | null;
};

export const FEATURE_DEFINITIONS: FeatureDefinition[] = [
  {
    key: "TEACHER_DASHBOARD",
    label: "Teacher Dashboard",
    description: "Access the teacher overview workspace.",
    audience: "TEACHER",
    defaults: { read: true, create: false, update: false, delete: false, share: false },
  },
  {
    key: "TEACHER_PROFILE",
    label: "Teacher Profile",
    description: "Read and update teacher profile details.",
    audience: "TEACHER",
    defaults: { read: true, create: false, update: true, delete: false, share: false },
  },
  {
    key: "TEACHER_BATCHES",
    label: "Teacher Batches",
    description: "Create, edit, delete, and map teacher batches.",
    audience: "TEACHER",
    defaults: { read: true, create: true, update: true, delete: true, share: true },
  },
  {
    key: "TEACHER_UPDATES",
    label: "Teacher Updates",
    description: "Post and manage announcements for batches.",
    audience: "TEACHER",
    defaults: { read: true, create: true, update: true, delete: true, share: true },
  },
  {
    key: "TEACHER_STUDENTS",
    label: "Teacher Students",
    description: "Read and manage linked students.",
    audience: "TEACHER",
    defaults: { read: true, create: false, update: true, delete: false, share: true },
  },
  {
    key: "TEACHER_MATERIALS",
    label: "Teacher Materials",
    description: "Upload, edit, delete, and share study materials.",
    audience: "TEACHER",
    defaults: { read: true, create: true, update: true, delete: true, share: true },
  },
  {
    key: "TEACHER_QUESTION_BANK",
    label: "Teacher Question Bank",
    description: "Create, import, and manage question bank assets.",
    audience: "TEACHER",
    defaults: { read: true, create: true, update: true, delete: true, share: true },
  },
  {
    key: "TEACHER_ANALYTICS",
    label: "Teacher Analytics",
    description: "Access teacher-side analytics views.",
    audience: "TEACHER",
    defaults: { read: true, create: false, update: false, delete: false, share: false },
  },
  {
    key: "STUDENT_DASHBOARD",
    label: "Student Dashboard",
    description: "Access the student overview workspace.",
    audience: "STUDENT",
    defaults: { read: true, create: false, update: false, delete: false, share: false },
  },
  {
    key: "STUDENT_PROFILE",
    label: "Student Profile",
    description: "Read and update student profile details.",
    audience: "STUDENT",
    defaults: { read: true, create: false, update: true, delete: false, share: false },
  },
  {
    key: "STUDENT_EXAMS",
    label: "Student Exams",
    description: "Access exam-related student actions.",
    audience: "STUDENT",
    defaults: { read: true, create: true, update: true, delete: false, share: false },
  },
  {
    key: "STUDENT_MATERIALS",
    label: "Student Materials",
    description: "Access personal vault and educator-shared materials.",
    audience: "STUDENT",
    defaults: { read: true, create: true, update: true, delete: true, share: false },
  },
  {
    key: "STUDENT_UPDATES",
    label: "Student Updates",
    description: "Join batches and read/update the student feed.",
    audience: "STUDENT",
    defaults: { read: true, create: true, update: false, delete: false, share: false },
  },
  {
    key: "STUDENT_ANALYTICS",
    label: "Student Analytics",
    description: "Access student analytics views.",
    audience: "STUDENT",
    defaults: { read: true, create: false, update: false, delete: false, share: false },
  },
];

const FEATURE_DEFINITION_MAP = new Map(FEATURE_DEFINITIONS.map((feature) => [feature.key, feature]));

export function getFeatureDefinition(featureKey: FeatureKey) {
  const definition = FEATURE_DEFINITION_MAP.get(featureKey);
  if (!definition) {
    throw new Error(`Unknown feature key: ${featureKey}`);
  }
  return definition;
}

export function getDefaultFeatureAccess(role: string, definition: FeatureDefinition): ResolvedFeatureAccess {
  if (role === "ADMIN") {
    return {
      ...definition,
      isEnabled: true,
      isRestricted: false,
      canRead: true,
      canCreate: true,
      canUpdate: true,
      canDelete: true,
      canShare: true,
      note: null,
    };
  }

  const roleMatchesAudience = role === definition.audience;

  return {
    ...definition,
    isEnabled: roleMatchesAudience,
    isRestricted: false,
    canRead: roleMatchesAudience ? definition.defaults.read : false,
    canCreate: roleMatchesAudience ? definition.defaults.create : false,
    canUpdate: roleMatchesAudience ? definition.defaults.update : false,
    canDelete: roleMatchesAudience ? definition.defaults.delete : false,
    canShare: roleMatchesAudience ? definition.defaults.share : false,
    note: null,
  };
}

export function getFeatureDefinitionsForRole(role: string) {
  if (role === "ADMIN") return FEATURE_DEFINITIONS;
  return FEATURE_DEFINITIONS.filter((feature) => feature.audience === role);
}

export function resolveFeatureAccessForUser(
  user: UserWithOverrides,
  featureKey: FeatureKey
): ResolvedFeatureAccess {
  const definition = getFeatureDefinition(featureKey);
  const defaults = getDefaultFeatureAccess(user.role, definition);
  const override = user.featureOverrides?.find((entry) => entry.featureKey === featureKey);

  if (!override) {
    return defaults;
  }

  return {
    ...defaults,
    isEnabled: override.isEnabled,
    isRestricted: override.isRestricted,
    canRead: override.canRead,
    canCreate: override.canCreate,
    canUpdate: override.canUpdate,
    canDelete: override.canDelete,
    canShare: override.canShare,
    note: override.note ?? null,
  };
}

export function buildFeatureMatrixForUser(user: UserWithOverrides) {
  return getFeatureDefinitionsForRole(user.role).map((feature) =>
    resolveFeatureAccessForUser(user, feature.key)
  );
}
