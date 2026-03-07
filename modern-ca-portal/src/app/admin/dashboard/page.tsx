import Link from "next/link";
import prisma from "@/lib/prisma/client";
import { getCurrentUserOrDemoUser } from "@/lib/auth/session";
import { buildFeatureMatrixForUser } from "@/lib/auth/feature-access";
import {
  assignAdminManagedEnrollment,
  createAdminAnnouncement,
  createAdminManagedBatch,
  createAdminManagedUser,
  deleteAdminAnnouncement,
  deleteAdminManagedBatch,
  deleteAdminManagedMaterial,
  deleteAdminManagedUser,
  grantAdminManagedMaterialAccess,
  removeAdminManagedEnrollment,
  resetAdminManagedFeatureAccess,
  revokeAdminManagedMaterialAccess,
  saveAdminManagedFeatureAccess,
  setAdminManagedUserBlock,
  updateAdminManagedBatch,
  updateAdminManagedMaterial,
  updateAdminManagedUser,
} from "@/actions/admin-actions";

const TEACHER_WORKSPACE_LINKS = [
  { href: "/teacher/dashboard", label: "Teacher Overview" },
  { href: "/teacher/batches", label: "Batches" },
  { href: "/teacher/students", label: "Students" },
  { href: "/teacher/materials", label: "Study Materials" },
  { href: "/teacher/updates", label: "Updates" },
  { href: "/teacher/questions", label: "Question Bank" },
  { href: "/teacher/mcq-extract", label: "MCQ Extract" },
  { href: "/teacher/analytics", label: "Analytics" },
];

const STUDENT_WORKSPACE_LINKS = [
  { href: "/student/dashboard", label: "Student Overview" },
  { href: "/student/exams", label: "Mock Exams" },
  { href: "/student/materials", label: "Study Materials" },
  { href: "/student/updates", label: "Updates Feed" },
  { href: "/student/analytics", label: "Analytics" },
  { href: "/student/profile", label: "Profile" },
  { href: "/exam", label: "Exam Engine" },
  { href: "/exam/war-room", label: "War Room" },
];

const FEATURE_FLAG_FIELDS = [
  { name: "canRead", label: "Read" },
  { name: "canCreate", label: "Create" },
  { name: "canUpdate", label: "Update" },
  { name: "canDelete", label: "Delete" },
  { name: "canShare", label: "Share" },
] as const;

const MATERIAL_ACCESS_TYPES = ["FREE_BATCH_MATERIAL", "ADMIN_GRANTED"];

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function capabilityLabels(feature: {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canShare: boolean;
}) {
  return FEATURE_FLAG_FIELDS.filter((item) => feature[item.name]).map((item) => item.label);
}

export default async function AdminDashboardPage() {
  const admin = await getCurrentUserOrDemoUser("ADMIN");

  const [users, batches, materials, announcements] = await Promise.all([
    prisma.user.findMany({
      include: {
        featureOverrides: true,
        enrollments: {
          include: {
            batch: {
              select: {
                id: true,
                name: true,
                uniqueJoinCode: true,
              },
            },
          },
          orderBy: { joinedAt: "desc" },
        },
        _count: {
          select: {
            batchesTeaching: true,
            enrollments: true,
            materialsUploaded: true,
            featureOverrides: true,
          },
        },
      },
      orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    }),
    prisma.batch.findMany({
      include: {
        teacher: {
          select: { id: true, fullName: true, registrationNumber: true, role: true },
        },
        enrollments: {
          include: {
            student: {
              select: { id: true, fullName: true, registrationNumber: true },
            },
          },
          orderBy: { joinedAt: "desc" },
        },
        _count: {
          select: { enrollments: true, announcements: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.studyMaterial.findMany({
      include: {
        uploadedBy: {
          select: { id: true, fullName: true, registrationNumber: true, role: true },
        },
        accessedBy: {
          include: {
            student: {
              select: { id: true, fullName: true, registrationNumber: true },
            },
          },
          orderBy: { grantedAt: "desc" },
        },
        _count: {
          select: { accessedBy: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.announcement.findMany({
      include: {
        teacher: {
          select: { id: true, fullName: true, registrationNumber: true, role: true },
        },
        batch: {
          select: { id: true, name: true, uniqueJoinCode: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
  ]);

  const teachers = users.filter((user) => user.role === "TEACHER");
  const teacherOrAdminUsers = users.filter(
    (user) => user.role === "TEACHER" || user.role === "ADMIN"
  );
  const students = users.filter((user) => user.role === "STUDENT");
  const blockedUsers = users.filter((user) => user.isBlocked).length;
  const totalFeatureOverrides = users.reduce(
    (sum, user) => sum + user.featureOverrides.length,
    0
  );
  const totalEnrollments = batches.reduce((sum, batch) => sum + batch._count.enrollments, 0);
  const totalMaterialShares = materials.reduce((sum, material) => sum + material._count.accessedBy, 0);

  const featureMatrixByUser = new Map(
    users.map((user) => [user.id, buildFeatureMatrixForUser(user)])
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">
                Admin Control Matrix
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                {admin.fullName ?? "Portal Admin"}
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-600 md:text-base">
                Admin inherits the teacher and student workspaces, then adds governance over who can
                access, modify, restrict, block, map, and share each operational feature.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-[26rem]">
              <Link
                href="/teacher/dashboard"
                className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
              >
                Open Teacher Workspace
              </Link>
              <Link
                href="/student/dashboard"
                className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
              >
                Open Student Workspace
              </Link>
              <Link
                href="/exam"
                className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
              >
                Open Exam Engine
              </Link>
              <Link
                href="/admin/dashboard"
                className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
              >
                Refresh Admin Surface
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Users</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{users.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Teachers</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{teachers.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Students</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{students.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Blocked</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{blockedUsers}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Batches</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{batches.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Enrollments</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{totalEnrollments}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Shared Access</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{totalMaterialShares}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Overrides</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{totalFeatureOverrides}</p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Teacher System
                </p>
                <h2 className="mt-2 text-xl font-bold text-slate-900">Teacher workspace inheritance</h2>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {teachers.length} teacher accounts
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {TEACHER_WORKSPACE_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Student System
                </p>
                <h2 className="mt-2 text-xl font-bold text-slate-900">Student workspace inheritance</h2>
              </div>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                {students.length} student accounts
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {STUDENT_WORKSPACE_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Create User</h2>
            <form action={createAdminManagedUser} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                name="fullName"
                required
                placeholder="Full name"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring"
              />
              <select
                name="role"
                defaultValue="STUDENT"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring"
              >
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Teacher</option>
                <option value="ADMIN">Admin</option>
              </select>
              <input
                name="email"
                placeholder="Email (optional)"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring"
              />
              <input
                name="registrationNumber"
                required
                placeholder="Registration no"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm uppercase outline-none ring-indigo-200 focus:ring"
              />
              <input
                name="department"
                placeholder="Department"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring"
              />
              <input
                name="password"
                type="password"
                required
                placeholder="Password"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring"
              />
              <button
                type="submit"
                className="sm:col-span-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Add User
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Create Batch</h2>
            <form action={createAdminManagedBatch} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                name="name"
                required
                placeholder="Batch name"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring"
              />
              <input
                name="uniqueJoinCode"
                placeholder="Join code (optional)"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm uppercase outline-none ring-indigo-200 focus:ring"
              />
              <select
                name="teacherId"
                required
                className="sm:col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring"
              >
                <option value="">Select teacher/admin owner</option>
                {teacherOrAdminUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName ?? "Unnamed"} ({user.registrationNumber ?? "N/A"}) - {user.role}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="sm:col-span-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Add Batch
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-1 lg:col-span-2">
            <h2 className="text-xl font-bold text-slate-900">Post Announcement</h2>
            <form action={createAdminAnnouncement} className="mt-4 grid gap-3 sm:grid-cols-2">
              <select
                name="batchId"
                required
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring"
              >
                <option value="">Select batch</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.name} ({batch.uniqueJoinCode})
                  </option>
                ))}
              </select>
              <select
                name="teacherId"
                defaultValue={admin.id}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring"
              >
                {teacherOrAdminUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName ?? "Unnamed"} - {user.role}
                  </option>
                ))}
              </select>
              <textarea
                name="content"
                required
                rows={4}
                placeholder="Announcement message"
                className="sm:col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring"
              />
              <button
                type="submit"
                className="sm:col-span-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                Post Announcement
              </button>
            </form>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Batch Mapping
                </p>
                <h2 className="mt-2 text-xl font-bold text-slate-900">Assign students to batches</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {totalEnrollments} active links
              </span>
            </div>
            <form action={assignAdminManagedEnrollment} className="mt-5 grid gap-3 sm:grid-cols-[1fr,1fr,auto]">
              <select
                name="studentId"
                required
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring"
              >
                <option value="">Select student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.fullName ?? "Unnamed"} ({student.registrationNumber ?? "N/A"})
                  </option>
                ))}
              </select>
              <select
                name="batchId"
                required
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring"
              >
                <option value="">Select batch</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.name} ({batch.uniqueJoinCode})
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Map Student
              </button>
            </form>
            <div className="mt-5 space-y-3">
              {batches.map((batch) => (
                <div key={batch.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{batch.name}</p>
                      <p className="text-xs text-slate-500">
                        {batch.uniqueJoinCode} | Owner: {batch.teacher.fullName ?? "Unnamed"} ({batch.teacher.role})
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {batch._count.enrollments} students
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {batch.enrollments.length === 0 ? (
                      <p className="text-sm text-slate-500">No students mapped to this batch yet.</p>
                    ) : (
                      batch.enrollments.map((enrollment) => (
                        <div
                          key={enrollment.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {enrollment.student.fullName ?? "Unnamed"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {enrollment.student.registrationNumber ?? "N/A"} | Joined {formatDate(enrollment.joinedAt)}
                            </p>
                          </div>
                          <form action={removeAdminManagedEnrollment}>
                            <input type="hidden" name="enrollmentId" value={enrollment.id} />
                            <button
                              type="submit"
                              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white"
                            >
                              Remove
                            </button>
                          </form>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Material Sharing
                </p>
                <h2 className="mt-2 text-xl font-bold text-slate-900">Grant and revoke study access</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {totalMaterialShares} access grants
              </span>
            </div>
            <form action={grantAdminManagedMaterialAccess} className="mt-5 grid gap-3 sm:grid-cols-[1fr,1fr,auto] lg:grid-cols-1 xl:grid-cols-[1fr,1fr,auto]">
              <select
                name="studentId"
                required
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring"
              >
                <option value="">Select student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.fullName ?? "Unnamed"} ({student.registrationNumber ?? "N/A"})
                  </option>
                ))}
              </select>
              <select
                name="materialId"
                required
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring"
              >
                <option value="">Select material</option>
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.title} - {material.uploadedBy.fullName ?? "Unnamed"}
                  </option>
                ))}
              </select>
              <div className="flex gap-3">
                <select
                  name="accessType"
                  defaultValue="ADMIN_GRANTED"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring"
                >
                  {MATERIAL_ACCESS_TYPES.map((accessType) => (
                    <option key={accessType} value={accessType}>
                      {accessType}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Share Material
                </button>
              </div>
            </form>
            <div className="mt-5 space-y-3">
              {materials.map((material) => (
                <div key={material.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{material.title}</p>
                      <p className="text-xs text-slate-500">
                        Uploaded by {material.uploadedBy.fullName ?? "Unnamed"} ({material.uploadedBy.role}) | {formatDate(material.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                        {material.isPublic ? "Public" : "Private"}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                        {material.isProtected ? "Protected" : "Unprotected"}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                        {material._count.accessedBy} grants
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    {material.accessedBy.length === 0 ? (
                      <p className="text-sm text-slate-500">No direct student shares yet.</p>
                    ) : (
                      material.accessedBy.map((access) => (
                        <div
                          key={access.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {access.student.fullName ?? "Unnamed"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {access.student.registrationNumber ?? "N/A"} | {access.accessType} | Granted {formatDate(access.grantedAt)}
                            </p>
                          </div>
                          <form action={revokeAdminManagedMaterialAccess}>
                            <input type="hidden" name="studentId" value={access.studentId} />
                            <input type="hidden" name="materialId" value={access.materialId} />
                            <button
                              type="submit"
                              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white"
                            >
                              Revoke
                            </button>
                          </form>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                User Governance
              </p>
              <h2 className="mt-2 text-xl font-bold text-slate-900">Manage users, blocking, and role identity</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {blockedUsers} blocked accounts
            </span>
          </div>
          <div className="space-y-4">
            {users.map((user) => {
              const featureMatrix = featureMatrixByUser.get(user.id) ?? [];

              return (
                <div key={user.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-slate-900">{user.fullName ?? "Unnamed user"}</p>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                          {user.role}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                          {user.plan}
                        </span>
                        {user.isBlocked ? (
                          <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                            Blocked
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                            Active
                          </span>
                        )}
                        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                          {user._count.featureOverrides} overrides
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {user.registrationNumber ?? "No registration"}
                        {user.email ? ` | ${user.email}` : ""}
                        {user.department ? ` | ${user.department}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Teaching: {user._count.batchesTeaching} | Enrollments: {user._count.enrollments} | Materials: {user._count.materialsUploaded}
                      </p>
                      {user.isBlocked && user.blockedReason ? (
                        <p className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
                          Block reason: {user.blockedReason}
                        </p>
                      ) : null}
                    </div>
                    <form action={deleteAdminManagedUser}>
                      <input type="hidden" name="userId" value={user.id} />
                      <button
                        type="submit"
                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Delete User
                      </button>
                    </form>
                  </div>

                  <form action={updateAdminManagedUser} className="mt-4 grid gap-2 lg:grid-cols-7">
                    <input type="hidden" name="userId" value={user.id} />
                    <input
                      name="fullName"
                      defaultValue={user.fullName ?? ""}
                      className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    />
                    <select
                      name="role"
                      defaultValue={user.role}
                      className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    >
                      <option value="STUDENT">STUDENT</option>
                      <option value="TEACHER">TEACHER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                    <input
                      name="email"
                      defaultValue={user.email ?? ""}
                      className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    />
                    <input
                      name="registrationNumber"
                      defaultValue={user.registrationNumber ?? ""}
                      className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm uppercase"
                    />
                    <input
                      name="department"
                      defaultValue={user.department ?? ""}
                      className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    />
                    <input
                      name="plan"
                      defaultValue={user.plan}
                      className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm uppercase"
                    />
                    <input
                      name="password"
                      type="password"
                      placeholder="Set new password"
                      className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Save Identity
                    </button>
                  </form>

                  <form action={setAdminManagedUserBlock} className="mt-3 grid gap-2 lg:grid-cols-[160px,1fr,auto]">
                    <input type="hidden" name="userId" value={user.id} />
                    <select
                      name="isBlocked"
                      defaultValue={String(user.isBlocked)}
                      className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    >
                      <option value="false">Unblocked</option>
                      <option value="true">Blocked</option>
                    </select>
                    <input
                      name="blockedReason"
                      defaultValue={user.blockedReason ?? ""}
                      placeholder="Reason for restriction or block"
                      className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Save Block State
                    </button>
                  </form>

                  <details className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">
                      Feature policies for {user.fullName ?? user.registrationNumber ?? user.id}
                    </summary>
                    <p className="mt-2 text-xs text-slate-500">
                      These policies define which teacher or student capabilities this account can use,
                      restrict, or share. No change applies unless you save it for a specific feature.
                    </p>
                    <div className="mt-4 space-y-3">
                      {featureMatrix.map((feature) => {
                        const override = user.featureOverrides.find(
                          (entry) => entry.featureKey === feature.key
                        );
                        const activeCapabilities = capabilityLabels(feature);

                        return (
                          <div key={feature.key} className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold text-slate-900">{feature.label}</p>
                                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                                    {feature.audience}
                                  </span>
                                  {override ? (
                                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                                      Override active
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                                      Default policy
                                    </span>
                                  )}
                                  {feature.isRestricted ? (
                                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                                      Restricted
                                    </span>
                                  ) : null}
                                  {!feature.isEnabled ? (
                                    <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                                      Disabled
                                    </span>
                                  ) : null}
                                </div>
                                <p className="mt-1 text-xs text-slate-500">{feature.description}</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {(activeCapabilities.length === 0 ? ["No capabilities"] : activeCapabilities).map((label) => (
                                    <span
                                      key={label}
                                      className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700"
                                    >
                                      {label}
                                    </span>
                                  ))}
                                </div>
                                {feature.note ? (
                                  <p className="mt-2 text-xs text-slate-500">Note: {feature.note}</p>
                                ) : null}
                              </div>
                            </div>

                            <form action={saveAdminManagedFeatureAccess} className="mt-4 grid gap-2 xl:grid-cols-9">
                              <input type="hidden" name="userId" value={user.id} />
                              <input type="hidden" name="featureKey" value={feature.key} />
                              <select
                                name="isEnabled"
                                defaultValue={String(override ? override.isEnabled : feature.isEnabled)}
                                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                              >
                                <option value="true">Enabled</option>
                                <option value="false">Disabled</option>
                              </select>
                              <select
                                name="isRestricted"
                                defaultValue={String(override ? override.isRestricted : feature.isRestricted)}
                                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                              >
                                <option value="false">Unrestricted</option>
                                <option value="true">Restricted</option>
                              </select>
                              {FEATURE_FLAG_FIELDS.map((field) => (
                                <select
                                  key={field.name}
                                  name={field.name}
                                  defaultValue={String(override ? override[field.name] : feature[field.name])}
                                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                                >
                                  <option value="true">{field.label} on</option>
                                  <option value="false">{field.label} off</option>
                                </select>
                              ))}
                              <input
                                name="note"
                                defaultValue={override?.note ?? feature.note ?? ""}
                                placeholder="Why this override exists"
                                className="xl:col-span-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                              />
                              <div className="flex gap-2 xl:col-span-9">
                                <button
                                  type="submit"
                                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white"
                                >
                                  Save Feature Policy
                                </button>
                              </div>
                            </form>

                            <form action={resetAdminManagedFeatureAccess} className="mt-2">
                              <input type="hidden" name="userId" value={user.id} />
                              <input type="hidden" name="featureKey" value={feature.key} />
                              <button
                                type="submit"
                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                              >
                                Reset to Default
                              </button>
                            </form>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Manage Batches</h2>
          <div className="space-y-3">
            {batches.map((batch) => (
              <div key={batch.id} className="rounded-2xl border border-slate-200 p-4">
                <form action={updateAdminManagedBatch} className="grid gap-2 lg:grid-cols-4">
                  <input type="hidden" name="batchId" value={batch.id} />
                  <input
                    name="name"
                    defaultValue={batch.name}
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  />
                  <input
                    name="uniqueJoinCode"
                    defaultValue={batch.uniqueJoinCode}
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm uppercase"
                  />
                  <select
                    name="teacherId"
                    defaultValue={batch.teacherId}
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  >
                    {teacherOrAdminUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName ?? "Unnamed"} ({user.registrationNumber ?? "N/A"}) - {user.role}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Save Batch
                  </button>
                </form>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <span>
                    Students: {batch._count.enrollments} | Updates: {batch._count.announcements} | Owner: {batch.teacher.fullName ?? "Unnamed"}
                  </span>
                  <form action={deleteAdminManagedBatch}>
                    <input type="hidden" name="batchId" value={batch.id} />
                    <button
                      type="submit"
                      className="rounded-lg bg-rose-600 px-3 py-1.5 font-semibold text-white"
                    >
                      Delete Batch
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Manage Study Materials</h2>
          <div className="space-y-3">
            {materials.map((material) => (
              <div key={material.id} className="rounded-2xl border border-slate-200 p-4">
                <form action={updateAdminManagedMaterial} className="grid gap-2 lg:grid-cols-4">
                  <input type="hidden" name="materialId" value={material.id} />
                  <input
                    name="title"
                    defaultValue={material.title}
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  />
                  <select
                    name="isPublic"
                    defaultValue={String(material.isPublic)}
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  >
                    <option value="false">Private</option>
                    <option value="true">Public</option>
                  </select>
                  <select
                    name="isProtected"
                    defaultValue={String(material.isProtected)}
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  >
                    <option value="true">Protected</option>
                    <option value="false">Unprotected</option>
                  </select>
                  <button
                    type="submit"
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Save Material
                  </button>
                </form>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <span>
                    Uploaded by: {material.uploadedBy.fullName ?? "Unnamed"} ({material.uploadedBy.role}) | Shared: {material._count.accessedBy} | {formatDate(material.createdAt)}
                  </span>
                  <form action={deleteAdminManagedMaterial}>
                    <input type="hidden" name="materialId" value={material.id} />
                    <button
                      type="submit"
                      className="rounded-lg bg-rose-600 px-3 py-1.5 font-semibold text-white"
                    >
                      Delete Material
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Manage Announcements</h2>
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm text-slate-800">{announcement.content}</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <span>
                    Batch: {announcement.batch.name} ({announcement.batch.uniqueJoinCode}) | By: {announcement.teacher.fullName ?? "Unnamed"} ({announcement.teacher.role}) | {formatDate(announcement.createdAt)}
                  </span>
                  <form action={deleteAdminAnnouncement}>
                    <input type="hidden" name="announcementId" value={announcement.id} />
                    <button
                      type="submit"
                      className="rounded-lg bg-rose-600 px-3 py-1.5 font-semibold text-white"
                    >
                      Delete Announcement
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
