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

const FEATURE_FLAG_FIELDS = [
  { name: "canRead", label: "Read" },
  { name: "canCreate", label: "Create" },
  { name: "canUpdate", label: "Update" },
  { name: "canDelete", label: "Delete" },
  { name: "canShare", label: "Share" },
] as const;

const MATERIAL_ACCESS_TYPES = ["FREE_BATCH_MATERIAL", "ADMIN_GRANTED"];

const DOMAIN_LINKS = {
  people: [
    { href: "/teacher/dashboard", label: "Teacher dashboard" },
    { href: "/student/dashboard", label: "Student dashboard" },
    { href: "/teacher/profile", label: "Teacher profile" },
    { href: "/student/profile", label: "Student profile" },
  ],
  batches: [
    { href: "/teacher/batches", label: "Teacher batches" },
    { href: "/teacher/students", label: "Teacher students" },
    { href: "/student/updates", label: "Student updates" },
  ],
  content: [
    { href: "/teacher/materials", label: "Teacher materials" },
    { href: "/teacher/updates", label: "Teacher updates" },
    { href: "/student/materials", label: "Student materials" },
    { href: "/exam", label: "Exam engine" },
  ],
};

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

function roleBadgeClass(role: string) {
  if (role === "ADMIN") return "bg-amber-100 text-amber-800";
  if (role === "TEACHER") return "bg-emerald-100 text-emerald-800";
  return "bg-sky-100 text-sky-800";
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
        announcements: {
          include: {
            teacher: {
              select: { fullName: true, role: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 3,
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
  const students = users.filter((user) => user.role === "STUDENT");
  const teacherOrAdminUsers = users.filter(
    (user) => user.role === "TEACHER" || user.role === "ADMIN"
  );
  const blockedUsers = users.filter((user) => user.isBlocked).length;
  const totalFeatureOverrides = users.reduce(
    (sum, user) => sum + user.featureOverrides.length,
    0
  );
  const totalEnrollments = batches.reduce((sum, batch) => sum + batch._count.enrollments, 0);
  const totalMaterialShares = materials.reduce((sum, material) => sum + material._count.accessedBy, 0);
  const totalPrivateMaterials = materials.filter((material) => !material.isPublic).length;

  const featureMatrixByUser = new Map(
    users.map((user) => [user.id, buildFeatureMatrixForUser(user)])
  );

  return (
    <div className="min-h-screen bg-[#f6f5f1] p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[40px] border border-stone-200 bg-gradient-to-br from-stone-950 via-slate-900 to-emerald-950 p-8 text-white shadow-2xl md:p-10">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
                Unified Admin Workspace
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
                {admin.fullName ?? "Portal Admin"}
              </h1>
              <p className="mt-4 text-sm leading-7 text-white/75 md:text-base">
                This admin surface now works as a merged academy workspace. People, batches,
                materials, updates, permissions, and learner operations are handled inside the same
                sections that drive teacher and student workflows.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:w-[30rem]">
              <Link
                href="/teacher/dashboard"
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Open Teacher Dashboard
              </Link>
              <Link
                href="/student/dashboard"
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Open Student Dashboard
              </Link>
              <Link
                href="/teacher/materials"
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Open Teacher Materials
              </Link>
              <Link
                href="/student/materials"
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Open Student Materials
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Teachers</p>
              <p className="mt-2 text-3xl font-bold">{teachers.length}</p>
              <p className="mt-2 text-sm text-white/60">Accounts teaching batches and publishing content.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Students</p>
              <p className="mt-2 text-3xl font-bold">{students.length}</p>
              <p className="mt-2 text-sm text-white/60">Learners receiving materials, updates, and exams.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Live Enrollments</p>
              <p className="mt-2 text-3xl font-bold">{totalEnrollments}</p>
              <p className="mt-2 text-sm text-white/60">Batch mappings that drive teacher and student visibility.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Restrictions</p>
              <p className="mt-2 text-3xl font-bold">{blockedUsers + totalFeatureOverrides}</p>
              <p className="mt-2 text-sm text-white/60">Blocked accounts and feature-level overrides currently active.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[34px] border border-stone-200 bg-white p-8 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                  Academy Pulse
                </p>
                <h2 className="mt-2 text-2xl font-bold text-stone-900">
                  One operational view across teachers and students
                </h2>
              </div>
              <span className="rounded-full bg-stone-100 px-4 py-2 text-xs font-semibold text-stone-700">
                {announcements.length} recent updates synced across the academy
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Batches Live</p>
                <p className="mt-2 text-3xl font-bold text-stone-900">{batches.length}</p>
                <p className="mt-2 text-sm text-stone-500">Teaching structure shared across teacher and student sides.</p>
              </div>
              <div className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Material Grants</p>
                <p className="mt-2 text-3xl font-bold text-stone-900">{totalMaterialShares}</p>
                <p className="mt-2 text-sm text-stone-500">Direct or protected student access grants in circulation.</p>
              </div>
              <div className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Private Assets</p>
                <p className="mt-2 text-3xl font-bold text-stone-900">{totalPrivateMaterials}</p>
                <p className="mt-2 text-sm text-stone-500">Teacher-owned content that still depends on access rules.</p>
              </div>
              <div className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Policy Overrides</p>
                <p className="mt-2 text-3xl font-bold text-stone-900">{totalFeatureOverrides}</p>
                <p className="mt-2 text-sm text-stone-500">Fine-grained feature controls across both workspace types.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl bg-[#0f172a] p-6 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">Instruction Layer</p>
                <h3 className="mt-3 text-xl font-bold">Teacher-facing operations with admin reach</h3>
                <ul className="mt-4 space-y-2 text-sm text-white/70">
                  <li>Batches, student mapping, materials, updates, question bank, analytics.</li>
                  <li>Admin actions here immediately affect what teachers see and can change.</li>
                </ul>
              </div>
              <div className="rounded-3xl bg-[#fff8ec] p-6 text-stone-900">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">Learner Layer</p>
                <h3 className="mt-3 text-xl font-bold">Student-facing delivery with admin control</h3>
                <ul className="mt-4 space-y-2 text-sm text-stone-600">
                  <li>Profile, materials, updates feed, exams, analytics, and batch visibility.</li>
                  <li>Admin changes here directly control learner access and visible content.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-[34px] border border-stone-200 bg-white p-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
              Admin Model
            </p>
            <h2 className="mt-2 text-2xl font-bold text-stone-900">Section-first, not separate-page-first</h2>
            <div className="mt-6 space-y-4 text-sm leading-7 text-stone-600">
              <p>People and access changes govern both teacher and student identities.</p>
              <p>Batch and enrollment changes drive classroom visibility for both sides.</p>
              <p>Materials and announcements control content that teachers publish and students consume.</p>
            </div>
            <div className="mt-6 space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">People Links</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {DOMAIN_LINKS.people.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="rounded-full border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-100"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Batch Links</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {DOMAIN_LINKS.batches.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="rounded-full border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-100"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Content Links</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {DOMAIN_LINKS.content.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="rounded-full border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-100"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[34px] border border-stone-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                People & Access
              </p>
              <h2 className="mt-2 text-2xl font-bold text-stone-900">
                Teacher identities, student identities, blocking, and permissions in one place
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-stone-600">
                Changes made here reflect directly in teacher and student systems because these are the
                same accounts, roles, and feature controls that power those experiences.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {DOMAIN_LINKS.people.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-100"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-stone-200 bg-stone-50 p-6">
                <h3 className="text-lg font-bold text-stone-900">Create person</h3>
                <p className="mt-2 text-sm text-stone-600">
                  Add a teacher, student, or secondary admin without leaving the merged people section.
                </p>
                <form action={createAdminManagedUser} className="mt-5 grid gap-3 sm:grid-cols-2">
                  <input
                    name="fullName"
                    required
                    placeholder="Full name"
                    className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none ring-emerald-200 focus:ring"
                  />
                  <select
                    name="role"
                    defaultValue="STUDENT"
                    className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none ring-emerald-200 focus:ring"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="TEACHER">Teacher</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <input
                    name="email"
                    placeholder="Email (optional)"
                    className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none ring-emerald-200 focus:ring"
                  />
                  <input
                    name="registrationNumber"
                    required
                    placeholder="Registration no"
                    className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm uppercase outline-none ring-emerald-200 focus:ring"
                  />
                  <input
                    name="department"
                    placeholder="Department"
                    className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none ring-emerald-200 focus:ring"
                  />
                  <input
                    name="password"
                    type="password"
                    required
                    placeholder="Password"
                    className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none ring-emerald-200 focus:ring"
                  />
                  <button
                    type="submit"
                    className="sm:col-span-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
                  >
                    Add account to academy
                  </button>
                </form>
              </div>

              <div className="rounded-3xl border border-stone-200 bg-stone-50 p-6">
                <h3 className="text-lg font-bold text-stone-900">Access summary</h3>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Blocked</p>
                    <p className="mt-2 text-3xl font-bold text-stone-900">{blockedUsers}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Overrides</p>
                    <p className="mt-2 text-3xl font-bold text-stone-900">{totalFeatureOverrides}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Teachers</p>
                    <p className="mt-2 text-3xl font-bold text-stone-900">{teachers.length}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Students</p>
                    <p className="mt-2 text-3xl font-bold text-stone-900">{students.length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">              {users.map((user) => {
                const featureMatrix = featureMatrixByUser.get(user.id) ?? [];

                return (
                  <div key={user.id} className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-semibold text-stone-900">
                            {user.fullName ?? "Unnamed person"}
                          </p>
                          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${roleBadgeClass(user.role)}`}>
                            {user.role}
                          </span>
                          <span className="rounded-full bg-stone-200 px-3 py-1 text-[11px] font-semibold text-stone-700">
                            {user.plan}
                          </span>
                          {user.isBlocked ? (
                            <span className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-semibold text-rose-700">
                              Blocked
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-stone-500">
                          {user.registrationNumber ?? "No registration"}
                          {user.email ? ` | ${user.email}` : ""}
                          {user.department ? ` | ${user.department}` : ""}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          Teaching: {user._count.batchesTeaching} | Enrollments: {user._count.enrollments} |
                          Materials: {user._count.materialsUploaded} | Overrides: {user._count.featureOverrides}
                        </p>
                        {user.isBlocked && user.blockedReason ? (
                          <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {user.blockedReason}
                          </p>
                        ) : null}
                      </div>
                      <form action={deleteAdminManagedUser}>
                        <input type="hidden" name="userId" value={user.id} />
                        <button
                          type="submit"
                          className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                        >
                          Delete account
                        </button>
                      </form>
                    </div>

                    <form action={updateAdminManagedUser} className="mt-5 grid gap-2 lg:grid-cols-7">
                      <input type="hidden" name="userId" value={user.id} />
                      <input
                        name="fullName"
                        defaultValue={user.fullName ?? ""}
                        className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm"
                      />
                      <select
                        name="role"
                        defaultValue={user.role}
                        className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm"
                      >
                        <option value="STUDENT">STUDENT</option>
                        <option value="TEACHER">TEACHER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                      <input
                        name="email"
                        defaultValue={user.email ?? ""}
                        className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm"
                      />
                      <input
                        name="registrationNumber"
                        defaultValue={user.registrationNumber ?? ""}
                        className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm uppercase"
                      />
                      <input
                        name="department"
                        defaultValue={user.department ?? ""}
                        className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm"
                      />
                      <input
                        name="plan"
                        defaultValue={user.plan}
                        className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm uppercase"
                      />
                      <input
                        name="password"
                        type="password"
                        placeholder="Set new password"
                        className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm"
                      />
                      <button
                        type="submit"
                        className="rounded-2xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
                      >
                        Save identity
                      </button>
                    </form>

                    <form action={setAdminManagedUserBlock} className="mt-3 grid gap-2 lg:grid-cols-[170px,1fr,auto]">
                      <input type="hidden" name="userId" value={user.id} />
                      <select
                        name="isBlocked"
                        defaultValue={String(user.isBlocked)}
                        className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm"
                      >
                        <option value="false">Unblocked</option>
                        <option value="true">Blocked</option>
                      </select>
                      <input
                        name="blockedReason"
                        defaultValue={user.blockedReason ?? ""}
                        placeholder="Reason for block or restriction"
                        className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm"
                      />
                      <button
                        type="submit"
                        className="rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                      >
                        Save access state
                      </button>
                    </form>

                    <details className="mt-4 rounded-3xl border border-stone-200 bg-white p-4">
                      <summary className="cursor-pointer list-none text-sm font-semibold text-stone-900">
                        Section-level permissions for {user.fullName ?? user.registrationNumber ?? user.id}
                      </summary>
                      <p className="mt-3 text-sm text-stone-500">
                        These settings control what this teacher or student can see and change in the
                        merged academy sections and in their own workspace.
                      </p>
                      <div className="mt-4 space-y-3">
                        {featureMatrix.map((feature) => {
                          const override = user.featureOverrides.find(
                            (entry) => entry.featureKey === feature.key
                          );
                          const activeCapabilities = capabilityLabels(feature);

                          return (
                            <div key={feature.key} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-stone-900">{feature.label}</p>
                                <span className="rounded-full bg-stone-200 px-3 py-1 text-[11px] font-semibold text-stone-700">
                                  {feature.audience}
                                </span>
                                {override ? (
                                  <span className="rounded-full bg-indigo-100 px-3 py-1 text-[11px] font-semibold text-indigo-700">
                                    Override active
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-stone-200 px-3 py-1 text-[11px] font-semibold text-stone-700">
                                    Default policy
                                  </span>
                                )}
                                {feature.isRestricted ? (
                                  <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-800">
                                    Restricted
                                  </span>
                                ) : null}
                                {!feature.isEnabled ? (
                                  <span className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-semibold text-rose-700">
                                    Disabled
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-2 text-sm text-stone-500">{feature.description}</p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {(activeCapabilities.length === 0 ? ["No capabilities"] : activeCapabilities).map((label) => (
                                  <span
                                    key={label}
                                    className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-stone-700"
                                  >
                                    {label}
                                  </span>
                                ))}
                              </div>
                              {feature.note ? (
                                <p className="mt-2 text-xs text-stone-500">Note: {feature.note}</p>
                              ) : null}

                              <form action={saveAdminManagedFeatureAccess} className="mt-4 grid gap-2 xl:grid-cols-9">
                                <input type="hidden" name="userId" value={user.id} />
                                <input type="hidden" name="featureKey" value={feature.key} />
                                <select
                                  name="isEnabled"
                                  defaultValue={String(override ? override.isEnabled : feature.isEnabled)}
                                  className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm"
                                >
                                  <option value="true">Enabled</option>
                                  <option value="false">Disabled</option>
                                </select>
                                <select
                                  name="isRestricted"
                                  defaultValue={String(override ? override.isRestricted : feature.isRestricted)}
                                  className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm"
                                >
                                  <option value="false">Unrestricted</option>
                                  <option value="true">Restricted</option>
                                </select>
                                {FEATURE_FLAG_FIELDS.map((field) => (
                                  <select
                                    key={field.name}
                                    name={field.name}
                                    defaultValue={String(override ? override[field.name] : feature[field.name])}
                                    className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm"
                                  >
                                    <option value="true">{field.label} on</option>
                                    <option value="false">{field.label} off</option>
                                  </select>
                                ))}
                                <input
                                  name="note"
                                  defaultValue={override?.note ?? feature.note ?? ""}
                                  placeholder="Why this override exists"
                                  className="xl:col-span-2 rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm"
                                />
                                <div className="xl:col-span-9 flex gap-2">
                                  <button
                                    type="submit"
                                    className="rounded-2xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
                                  >
                                    Save section policy
                                  </button>
                                </div>
                              </form>

                              <form action={resetAdminManagedFeatureAccess} className="mt-2">
                                <input type="hidden" name="userId" value={user.id} />
                                <input type="hidden" name="featureKey" value={feature.key} />
                                <button
                                  type="submit"
                                  className="rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                                >
                                  Reset to default
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
          </div>
        </section>        <section className="rounded-[34px] border border-stone-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                Batches & Enrollments
              </p>
              <h2 className="mt-2 text-2xl font-bold text-stone-900">
                Classroom structure for teachers and classroom visibility for students
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-stone-600">
                Batch ownership, join codes, learner mapping, and recent updates live together here.
                Changing this section immediately changes what both teachers and students can access.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {DOMAIN_LINKS.batches.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-100"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <div className="rounded-3xl border border-stone-200 bg-stone-50 p-6">
              <h3 className="text-lg font-bold text-stone-900">Create classroom</h3>
              <form action={createAdminManagedBatch} className="mt-5 grid gap-3 sm:grid-cols-2">
                <input
                  name="name"
                  required
                  placeholder="Batch name"
                  className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm"
                />
                <input
                  name="uniqueJoinCode"
                  placeholder="Join code (optional)"
                  className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm uppercase"
                />
                <select
                  name="teacherId"
                  required
                  className="sm:col-span-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm"
                >
                  <option value="">Select teacher or admin owner</option>
                  {teacherOrAdminUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName ?? "Unnamed"} ({user.registrationNumber ?? "N/A"}) - {user.role}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="sm:col-span-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
                >
                  Create batch
                </button>
              </form>
            </div>

            <div className="rounded-3xl border border-stone-200 bg-stone-50 p-6">
              <h3 className="text-lg font-bold text-stone-900">Map learner to classroom</h3>
              <form action={assignAdminManagedEnrollment} className="mt-5 grid gap-3 sm:grid-cols-[1fr,1fr,auto]">
                <select
                  name="studentId"
                  required
                  className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm"
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
                  className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm"
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
                  className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-stone-900 transition hover:bg-stone-100"
                >
                  Map student
                </button>
              </form>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Batches</p>
                  <p className="mt-2 text-3xl font-bold text-stone-900">{batches.length}</p>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Enrollments</p>
                  <p className="mt-2 text-3xl font-bold text-stone-900">{totalEnrollments}</p>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Updates</p>
                  <p className="mt-2 text-3xl font-bold text-stone-900">{announcements.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {batches.map((batch) => (
              <div key={batch.id} className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-stone-900">{batch.name}</p>
                    <p className="mt-1 text-sm text-stone-500">
                      Owner: {batch.teacher.fullName ?? "Unnamed"} ({batch.teacher.role}) | Join code: {batch.uniqueJoinCode}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      Students: {batch._count.enrollments} | Updates: {batch._count.announcements} | Created {formatDate(batch.createdAt)}
                    </p>
                  </div>
                  <form action={deleteAdminManagedBatch}>
                    <input type="hidden" name="batchId" value={batch.id} />
                    <button
                      type="submit"
                      className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                    >
                      Delete batch
                    </button>
                  </form>
                </div>

                <form action={updateAdminManagedBatch} className="mt-5 grid gap-2 lg:grid-cols-4">
                  <input type="hidden" name="batchId" value={batch.id} />
                  <input
                    name="name"
                    defaultValue={batch.name}
                    className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm"
                  />
                  <input
                    name="uniqueJoinCode"
                    defaultValue={batch.uniqueJoinCode}
                    className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm uppercase"
                  />
                  <select
                    name="teacherId"
                    defaultValue={batch.teacherId}
                    className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm"
                  >
                    {teacherOrAdminUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName ?? "Unnamed"} ({user.registrationNumber ?? "N/A"}) - {user.role}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-2xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
                  >
                    Save batch changes
                  </button>
                </form>

                <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-3xl border border-stone-200 bg-white p-5">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
                      Linked learners
                    </h3>
                    <div className="mt-4 space-y-3">
                      {batch.enrollments.length === 0 ? (
                        <p className="rounded-2xl bg-stone-50 px-4 py-4 text-sm text-stone-500">
                          No learners mapped yet.
                        </p>
                      ) : (
                        batch.enrollments.map((enrollment) => (
                          <div key={enrollment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-stone-50 px-4 py-3">
                            <div>
                              <p className="font-medium text-stone-900">
                                {enrollment.student.fullName ?? "Unnamed learner"}
                              </p>
                              <p className="text-xs text-stone-500">
                                {enrollment.student.registrationNumber ?? "N/A"} | Joined {formatDate(enrollment.joinedAt)}
                              </p>
                            </div>
                            <form action={removeAdminManagedEnrollment}>
                              <input type="hidden" name="enrollmentId" value={enrollment.id} />
                              <button
                                type="submit"
                                className="rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                              >
                                Remove mapping
                              </button>
                            </form>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-stone-200 bg-white p-5">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
                      Recent batch updates
                    </h3>
                    <div className="mt-4 space-y-3">
                      {batch.announcements.length === 0 ? (
                        <p className="rounded-2xl bg-stone-50 px-4 py-4 text-sm text-stone-500">
                          No updates posted for this batch yet.
                        </p>
                      ) : (
                        batch.announcements.map((announcement) => (
                          <div key={announcement.id} className="rounded-2xl bg-stone-50 px-4 py-4">
                            <p className="text-sm text-stone-800">{announcement.content}</p>
                            <p className="mt-2 text-xs text-stone-500">
                              {announcement.teacher.fullName ?? "Unknown"} ({announcement.teacher.role}) | {formatDate(announcement.createdAt)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>        <section className="rounded-[34px] border border-stone-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                Content & Distribution
              </p>
              <h2 className="mt-2 text-2xl font-bold text-stone-900">
                Teacher publishing, student delivery, material sharing, and announcements in one section
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-stone-600">
                This section is where admin manages the exact content lifecycle: publish updates, share
                materials, edit availability, and revoke access with immediate effect on learners.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {DOMAIN_LINKS.content.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-100"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <div className="rounded-3xl border border-stone-200 bg-stone-50 p-6">
              <h3 className="text-lg font-bold text-stone-900">Publish academy update</h3>
              <form action={createAdminAnnouncement} className="mt-5 grid gap-3 sm:grid-cols-2">
                <select
                  name="batchId"
                  required
                  className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm"
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
                  className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm"
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
                  className="sm:col-span-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm"
                />
                <button
                  type="submit"
                  className="sm:col-span-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
                >
                  Publish update
                </button>
              </form>
            </div>

            <div className="rounded-3xl border border-stone-200 bg-stone-50 p-6">
              <h3 className="text-lg font-bold text-stone-900">Grant learner material access</h3>
              <form action={grantAdminManagedMaterialAccess} className="mt-5 grid gap-3 sm:grid-cols-[1fr,1fr,auto]">
                <select
                  name="studentId"
                  required
                  className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm"
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
                  className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm"
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
                    className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm"
                  >
                    {MATERIAL_ACCESS_TYPES.map((accessType) => (
                      <option key={accessType} value={accessType}>
                        {accessType}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-stone-900 transition hover:bg-stone-100"
                  >
                    Share material
                  </button>
                </div>
              </form>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Materials</p>
                  <p className="mt-2 text-3xl font-bold text-stone-900">{materials.length}</p>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Shares</p>
                  <p className="mt-2 text-3xl font-bold text-stone-900">{totalMaterialShares}</p>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Announcements</p>
                  <p className="mt-2 text-3xl font-bold text-stone-900">{announcements.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="space-y-4">
              {materials.map((material) => (
                <div key={material.id} className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-stone-900">{material.title}</p>
                      <p className="mt-1 text-sm text-stone-500">
                        Uploaded by {material.uploadedBy.fullName ?? "Unnamed"} ({material.uploadedBy.role})
                      </p>
                      <p className="mt-1 text-xs text-stone-500">
                        {material._count.accessedBy} access grants | {formatDate(material.createdAt)}
                      </p>
                    </div>
                    <form action={deleteAdminManagedMaterial}>
                      <input type="hidden" name="materialId" value={material.id} />
                      <button
                        type="submit"
                        className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                      >
                        Delete material
                      </button>
                    </form>
                  </div>

                  <form action={updateAdminManagedMaterial} className="mt-5 grid gap-2 lg:grid-cols-4">
                    <input type="hidden" name="materialId" value={material.id} />
                    <input
                      name="title"
                      defaultValue={material.title}
                      className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm"
                    />
                    <select
                      name="isPublic"
                      defaultValue={String(material.isPublic)}
                      className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm"
                    >
                      <option value="false">Private</option>
                      <option value="true">Public</option>
                    </select>
                    <select
                      name="isProtected"
                      defaultValue={String(material.isProtected)}
                      className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm"
                    >
                      <option value="true">Protected</option>
                      <option value="false">Unprotected</option>
                    </select>
                    <button
                      type="submit"
                      className="rounded-2xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
                    >
                      Save material state
                    </button>
                  </form>

                  <div className="mt-5 space-y-3">
                    {material.accessedBy.length === 0 ? (
                      <p className="rounded-2xl bg-white px-4 py-4 text-sm text-stone-500">
                        No direct learner grants for this material yet.
                      </p>
                    ) : (
                      material.accessedBy.map((access) => (
                        <div key={access.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
                          <div>
                            <p className="font-medium text-stone-900">
                              {access.student.fullName ?? "Unnamed learner"}
                            </p>
                            <p className="text-xs text-stone-500">
                              {access.student.registrationNumber ?? "N/A"} | {access.accessType} | Granted {formatDate(access.grantedAt)}
                            </p>
                          </div>
                          <form action={revokeAdminManagedMaterialAccess}>
                            <input type="hidden" name="studentId" value={access.studentId} />
                            <input type="hidden" name="materialId" value={access.materialId} />
                            <button
                              type="submit"
                              className="rounded-2xl border border-stone-300 bg-stone-50 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                            >
                              Revoke access
                            </button>
                          </form>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
                  <p className="text-sm leading-7 text-stone-800">{announcement.content}</p>
                  <p className="mt-3 text-xs text-stone-500">
                    Batch: {announcement.batch.name} ({announcement.batch.uniqueJoinCode}) | By {announcement.teacher.fullName ?? "Unnamed"} ({announcement.teacher.role}) | {formatDate(announcement.createdAt)}
                  </p>
                  <form action={deleteAdminAnnouncement} className="mt-4">
                    <input type="hidden" name="announcementId" value={announcement.id} />
                    <button
                      type="submit"
                      className="rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                    >
                      Remove announcement
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}