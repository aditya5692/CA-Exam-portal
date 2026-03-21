/**
 * fix-and-link.mts
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Renames seeded teachers → teacher1…teacher10 (reg number + email)
 * 2. Renames seeded students → student1…student100 (reg number + email)
 * 3. Sets passwordHash = demo123 for all renamed accounts
 * 4. Ensures every exam is attached to a batch and that batch's students
 *    are enrolled, then creates realistic exam attempts + answers
 * 5. Adds varied announcements, study-material access, topic progress, XP
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';
import { createHash,scryptSync } from 'crypto';

const prisma = new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: 'file:./dev.db' }),
})

// ─── Hash helper (mirrors demo-accounts.ts) ──────────────────────────────────
function makeHash(password: string, seed: string) {
    const salt = createHash('sha256')
        .update(`modern-ca-portal-demo:${seed}`)
        .digest('hex')
        .slice(0, 32)
    const derived = scryptSync(password, salt, 64).toString('hex')
    return `${salt}:${derived}`
}

function rnd(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}
function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}
function daysAgo(n: number) {
    const d = new Date(); d.setDate(d.getDate() - n); return d
}

const CA_SUBJECTS = ['Financial Reporting', 'Auditing', 'Direct Taxation', 'Cost Accounting', 'Business Law', 'Strategic Finance', 'Economics', 'Information Technology']
const CA_TOPICS = ['Partnership', 'Depreciation', 'GST Basics', 'Internal Audit', 'Tax Planning', 'Standard Costing', 'Companies Act', 'Capital Budgeting', 'Ratio Analysis', 'Marginal Costing']
const REASONS = ['exam_completed', 'perfect_score', 'streak_bonus', 'first_attempt', 'accuracy_bonus', 'daily_login', 'topic_mastered']

const ANNOUNCEMENTS = [
    'Next class is rescheduled to tomorrow at 6 PM. Please be punctual!',
    'Mock test this Saturday — full syllabus Chapters 1–5. Prepare well.',
    'Study notes for Chapter 6 uploaded. Find them in the batch folder.',
    'Great job to everyone who scored above 80% in last week\'s quiz 🎉',
    'ICAI released a new practice manual. Link shared in resources.',
    'Doubt-clearing session this Friday at 7 PM. Bring all your questions!',
    'Reminder: Assignment submission deadline is end of this week.',
    'New video lecture on Partnership Accounts is now live.',
    'Office hours extended — reach me until 9 PM on weekdays.',
    'This week\'s top scorer will be announced after Sunday\'s revision test.',
    'Syllabus revision schedule updated — check the announcement board.',
    'Missed yesterday\'s class? Recording posted in study materials.',
    'Congratulations to our top performers! Keep up the excellent work.',
    'We have an upcoming guest lecture by a seasoned CA practitioner.',
    'Formula sheet for Chapter 3 updated with corrections — re-download.',
]

async function main() {
    console.log('🔧  Starting fix-and-link script...\n')

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 1: Rename seeded teachers → teacher1…teacher10
    // ──────────────────────────────────────────────────────────────────────────
    console.log('👩‍🏫  Renaming teachers to teacher1…teacher10...')

    // Fetch seeded teachers in creation order (they have T1001–T1010 initially)
    // We match by the old seed registration numbers
    const seedTeacherRegs = ['T1001', 'T1002', 'T1003', 'T1004', 'T1005', 'T1006', 'T1007', 'T1008', 'T1009', 'T1010']
    const teacherUsers = []

    for (let i = 0; i < seedTeacherRegs.length; i++) {
        const newReg = `teacher${i + 1}`
        const newEmail = `teacher${i + 1}@caportal.edu`

        // Try by old reg first; if already renamed, find by new reg
        let user = await prisma.user.findFirst({
            where: { OR: [{ registrationNumber: seedTeacherRegs[i] }, { registrationNumber: newReg }] },
        })

        if (!user) {
            console.log(`  ⚠  Could not find teacher with reg ${seedTeacherRegs[i]} — skipping`)
            continue
        }

        user = await prisma.user.update({
            where: { id: user.id },
            data: {
                registrationNumber: newReg,
                email: newEmail,
                passwordHash: makeHash('demo123', newReg),
            },
        })
        teacherUsers.push(user)
        console.log(`  ✓ ${user.fullName} → ${newReg}`)
    }

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 2: Rename seeded students → student1…student100
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n🎓  Renaming students to student1…student100...')

    // Grab all students NOT in the demo accounts (not STUD001/STUD002)
    const allStudents = await prisma.user.findMany({
        where: {
            role: 'STUDENT',
            registrationNumber: { notIn: ['STUD001', 'STUD002'] },
        },
        orderBy: { createdAt: 'asc' },
    })

    const studentUsers = []
    for (let i = 0; i < allStudents.length && i < 100; i++) {
        const newReg = `student${i + 1}`
        const newEmail = `student${i + 1}@caportal.edu`

        const user = await prisma.user.update({
            where: { id: allStudents[i].id },
            data: {
                registrationNumber: newReg,
                email: newEmail,
                passwordHash: makeHash('demo123', newReg),
            },
        })
        studentUsers.push(user)
    }
    console.log(`  ✓ Renamed ${studentUsers.length} students`)

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 3: Fetch batches & attach teachers properly
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n📦  Fetching batches...')
    const batches = await prisma.batch.findMany({
        orderBy: { createdAt: 'asc' },
        include: { enrollments: true },
    })
    console.log(`  ✓ ${batches.length} batches found`)

    // Map teacherUser → batch (same index)
    const teacherBatchMap: Record<string, typeof batches[0]> = {}
    for (let i = 0; i < Math.min(teacherUsers.length, batches.length); i++) {
        teacherBatchMap[teacherUsers[i].id] = batches[i]
        // Update batch to confirm teacher ownership (in case it drifted)
        await prisma.batch.update({
            where: { id: batches[i].id },
            data: { teacherId: teacherUsers[i].id },
        })
    }

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 4: Ensure every student is enrolled in their teacher's batch
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n🔗  Ensuring enrollments...')
    let enrollCount = 0
    for (let ti = 0; ti < teacherUsers.length; ti++) {
        const batch = batches[ti]
        const batchStudents = studentUsers.slice(ti * 10, ti * 10 + 10)

        for (const student of batchStudents) {
            try {
                await prisma.enrollment.upsert({
                    where: { studentId_batchId: { studentId: student.id, batchId: batch.id } },
                    update: {},
                    create: { studentId: student.id, batchId: batch.id, joinedAt: daysAgo(rnd(10, 80)) },
                })
                enrollCount++
            } catch { /* already exists */ }
        }
    }
    console.log(`  ✓ ${enrollCount} enrollments confirmed`)

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 5: Fetch all PUBLISHED exams and link them properly to batches/students
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n📝  Linking exams → batches → students...')

    const publishedExams = await prisma.exam.findMany({
        where: { status: 'PUBLISHED' },
        include: { questions: { include: { question: { include: { options: true } } } } },
        orderBy: { createdAt: 'asc' },
    })

    // Attach each exam to its teacher's batch (if not already)
    for (const exam of publishedExams) {
        const teacherIdx = teacherUsers.findIndex(t => t.id === exam.teacherId)
        if (teacherIdx >= 0 && teacherIdx < batches.length) {
            if (exam.batchId !== batches[teacherIdx].id) {
                await prisma.exam.update({
                    where: { id: exam.id },
                    data: { batchId: batches[teacherIdx].id },
                })
            }
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 6: Generate exam attempts for each student (delete old ones first)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n📊  Generating exam attempts for all 100 students...')

    // Wipe old attempts that may be orphaned
    await prisma.studentAnswer.deleteMany({})
    await prisma.examAttempt.deleteMany({})

    let totalAttempts = 0

    for (let ti = 0; ti < teacherUsers.length; ti++) {
        const batch = batches[ti]
        const batchStudents = studentUsers.slice(ti * 10, ti * 10 + 10)

        // The published exams for this batch
        const batchExams = await prisma.exam.findMany({
            where: { batchId: batch.id, status: 'PUBLISHED' },
            include: { questions: { include: { question: { include: { options: true } } } } },
        })

        if (batchExams.length === 0) continue

        for (const student of batchStudents) {
            // Each student attempts 1–ALL available exams in their batch
            const examCount = rnd(1, batchExams.length)
            const shuffled = [...batchExams].sort(() => Math.random() - 0.5)
            const toAttempt = shuffled.slice(0, examCount)

            for (const exam of toAttempt) {
                const qCount = exam.questions.length
                if (qCount === 0) continue
                const accuracyPct = rnd(35, 98) / 100
                const correctCount = Math.round(qCount * accuracyPct)
                const score = correctCount * 4
                const startedAt = daysAgo(rnd(1, 55))
                const endedAt = new Date(startedAt.getTime() + rnd(1800, exam.duration * 60) * 1000)

                const attempt = await prisma.examAttempt.create({
                    data: {
                        studentId: student.id,
                        examId: exam.id,
                        score,
                        status: 'SUBMITTED',
                        startTime: startedAt,
                        endTime: endedAt,
                    },
                })

                // Pick which question indices the student gets correct
                const correctSet = new Set<number>()
                while (correctSet.size < correctCount) correctSet.add(rnd(0, qCount - 1))

                for (let qi = 0; qi < exam.questions.length; qi++) {
                    const { question } = exam.questions[qi]
                    const isCorrect = correctSet.has(qi)
                    const correctOpt = question.options.find(o => o.isCorrect)
                    const wrongOpts = question.options.filter(o => !o.isCorrect)
                    const chosen = isCorrect ? correctOpt : (wrongOpts.length > 0 ? pick(wrongOpts) : correctOpt)

                    try {
                        await prisma.studentAnswer.create({
                            data: {
                                attemptId: attempt.id,
                                questionId: question.id,
                                selectedOptionId: chosen?.id ?? null,
                                isCorrect,
                                timeSpent: rnd(15, 200),
                            },
                        })
                    } catch { /* skip dup */ }
                }
                totalAttempts++
            }
        }
        console.log(`  ✓ Batch "${batch.name}" — ${batchStudents.length} students × ${batchExams.length} exams`)
    }
    console.log(`  ✓ ${totalAttempts} total attempts created`)

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 7: Rich announcements for each batch (wipe + recreate)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n📢  Creating rich announcements...')
    await prisma.announcement.deleteMany({})
    let annCount = 0
    for (let bi = 0; bi < Math.min(teacherUsers.length, batches.length); bi++) {
        const count = rnd(4, 8)
        for (let ai = 0; ai < count; ai++) {
            await prisma.announcement.create({
                data: {
                    content: pick(ANNOUNCEMENTS),
                    batchId: batches[bi].id,
                    teacherId: teacherUsers[bi].id,
                    createdAt: daysAgo(rnd(0, 50)),
                },
            })
            annCount++
        }
    }
    console.log(`  ✓ ${annCount} announcements`)

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 8: Update learning profiles for every student based on real attempts
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n🧠  Rebuilding learning profiles from real attempt data...')
    await prisma.xPEvent.deleteMany({})
    await prisma.topicProgress.deleteMany({})
    await prisma.studentLearningProfile.deleteMany({})

    let profileCount = 0

    for (const student of studentUsers) {
        const attempts = await prisma.examAttempt.findMany({
            where: { studentId: student.id, status: 'SUBMITTED' },
            include: { answers: true },
        })

        const totalAttemptCount = attempts.length
        const totalCorrect = attempts.reduce((s, a) => s + a.answers.filter(ans => ans.isCorrect).length, 0)
        const totalAnswered = attempts.reduce((s, a) => s + a.answers.length, 0)
        const avgAccuracy = totalAnswered > 0 ? totalCorrect / totalAnswered : 0
        const xp = totalCorrect * rnd(8, 15) + totalAttemptCount * 20
        const level = Math.max(1, Math.floor(xp / 300))
        const streak = rnd(0, 25)

        const badges: string[] = []
        if (totalAttemptCount >= 1) badges.push('first_exam')
        if (streak >= 7) badges.push('streak_7')
        if (avgAccuracy >= 0.8) badges.push('accuracy_80')
        if (level >= 5) badges.push('scholar')

        const profile = await prisma.studentLearningProfile.create({
            data: {
                studentId: student.id,
                totalXP: xp,
                level,
                streak,
                longestStreak: Math.max(streak, rnd(0, 35)),
                totalAttempts: totalAttemptCount,
                totalCorrect,
                avgAccuracy,
                weakTopicsJson: JSON.stringify([pick(CA_TOPICS), pick(CA_TOPICS)]),
                badgesJson: JSON.stringify(badges),
                lastAttemptAt: attempts.length > 0 ? attempts[attempts.length - 1].endTime : null,
            },
        })

        // Topic progress (3–5 topics)
        const topicCount = rnd(3, 5)
        const usedTopics = new Set<string>()
        while (usedTopics.size < topicCount) usedTopics.add(pick(CA_TOPICS))

        for (const topic of usedTopics) {
            const ta = rnd(5, 40)
            const tc = Math.floor(ta * (rnd(30, 95) / 100))
            try {
                await prisma.topicProgress.create({
                    data: {
                        studentId: student.id,
                        profileId: profile.id,
                        subject: pick(CA_SUBJECTS),
                        topic,
                        totalAttempted: ta,
                        totalCorrect: tc,
                        accuracy: ta > 0 ? tc / ta : 0,
                        avgTimeSpent: rnd(30, 150),
                        difficulty: pick(['EASY', 'MEDIUM', 'HARD']),
                        lastSeenAt: daysAgo(rnd(0, 30)),
                        nextReviewAt: daysAgo(rnd(-7, 7)),
                    },
                })
            } catch { /* dup guard */ }
        }

        // XP events (4–8 entries)
        for (let xi = 0; xi < rnd(4, 8); xi++) {
            await prisma.xPEvent.create({
                data: {
                    studentId: student.id,
                    profileId: profile.id,
                    xpDelta: rnd(10, 120),
                    reason: pick(REASONS),
                    meta: JSON.stringify({ ts: daysAgo(rnd(0, 40)).toISOString() }),
                    createdAt: daysAgo(rnd(0, 40)),
                },
            })
        }
        profileCount++
    }
    console.log(`  ✓ ${profileCount} learning profiles rebuilt`)

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 9: Grant material access to every student in their batch folder
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n📚  Granting material access to all students...')
    await prisma.materialAccess.deleteMany({})
    let accessCount = 0

    for (let ti = 0; ti < teacherUsers.length; ti++) {
        const teacher = teacherUsers[ti]
        const batchStudents = studentUsers.slice(ti * 10, ti * 10 + 10)

        const materials = await prisma.studyMaterial.findMany({
            where: { uploadedById: teacher.id },
        })

        for (const material of materials) {
            for (const student of batchStudents) {
                try {
                    await prisma.materialAccess.create({
                        data: {
                            studentId: student.id,
                            materialId: material.id,
                            accessType: 'FREE_BATCH_MATERIAL',
                        },
                    })
                    accessCount++
                } catch { /* dup guard */ }
            }
        }
    }
    console.log(`  ✓ ${accessCount} material access grants`)

    // ──────────────────────────────────────────────────────────────────────────
    // Done
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n✅  All done! Summary:')
    console.log(`   Teachers renamed   : ${teacherUsers.length}  (teacher1–teacher${teacherUsers.length})`)
    console.log(`   Students renamed   : ${studentUsers.length}  (student1–student${studentUsers.length})`)
    console.log(`   Enrollments ensured: ${enrollCount}`)
    console.log(`   Exam attempts      : ${totalAttempts}`)
    console.log(`   Announcements      : ${annCount}`)
    console.log(`   Learning profiles  : ${profileCount}`)
    console.log(`   Material accesses  : ${accessCount}`)
    console.log('\n🔑  Login: use reg number (teacher1/student1 etc.) + password: demo123')
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(async () => { await prisma.$disconnect() })
