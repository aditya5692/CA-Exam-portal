"use server";

/**
 * @deprecated This file is deprecated. Please import from specialized action files:
 * - @/actions/teacher/materials
 * - @/actions/teacher/analytics
 * - @/actions/teacher/overview
 * - @/actions/student-actions (for getStudentSharedMaterials)
 */

export * from "./teacher/materials";
export * from "./teacher/analytics";
export * from "./teacher/overview";
export { getStudentSharedMaterials } from "./student-actions";
