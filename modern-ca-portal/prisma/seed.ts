import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const prisma = new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: 'file:./dev.db' }),
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rnd(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

function daysAgo(n: number): Date {
    const d = new Date()
    d.setDate(d.getDate() - n)
    return d
}

// ─── Static data ──────────────────────────────────────────────────────────────

const TEACHERS = [
    { name: 'Dr. Anjali Sharma', email: 'anjali.sharma@caportal.edu', reg: 'T1001', dept: 'Accounting', expertise: 'Financial Reporting, Ind AS' },
    { name: 'Prof. Rohit Mehta', email: 'rohit.mehta@caportal.edu', reg: 'T1002', dept: 'Audit', expertise: 'Statutory Audit, Risk Assessment' },
    { name: 'CA Priya Nair', email: 'priya.nair@caportal.edu', reg: 'T1003', dept: 'Taxation', expertise: 'GST, Income Tax' },
    { name: 'Dr. Suresh Verma', email: 'suresh.verma@caportal.edu', reg: 'T1004', dept: 'Law', expertise: 'Company Law, FEMA' },
    { name: 'CA Kavitha Reddy', email: 'kavitha.reddy@caportal.edu', reg: 'T1005', dept: 'Finance', expertise: 'SFM, Derivatives' },
    { name: 'Prof. Amitabh Joshi', email: 'amitabh.joshi@caportal.edu', reg: 'T1006', dept: 'Costing', expertise: 'Standard Costing, Variance Analysis' },
    { name: 'CA Meena Pillai', email: 'meena.pillai@caportal.edu', reg: 'T1007', dept: 'Accounts', expertise: 'Partnership Accounts, AS' },
    { name: 'Dr. Vikram Singh', email: 'vikram.singh@caportal.edu', reg: 'T1008', dept: 'Economics', expertise: 'Business Economics, Statistics' },
    { name: 'CA Sunita Agarwal', email: 'sunita.agarwal@caportal.edu', reg: 'T1009', dept: 'Ethics', expertise: 'Professional Ethics, ICAI Standards' },
    { name: 'Prof. Rajesh Kumar', email: 'rajesh.kumar@caportal.edu', reg: 'T1010', dept: 'IT/SM', expertise: 'Information Systems, Strategic Mgmt' },
]

const STUDENT_FIRST = ['Aarav', 'Aditya', 'Ananya', 'Arjun', 'Ayesha', 'Bhavna', 'Chirag', 'Deepa', 'Divya', 'Farhan', 'Gaurav', 'Harini', 'Ishan', 'Jyoti', 'Karan', 'Kavya', 'Lakshmi', 'Manish', 'Meera', 'Nikhil', 'Nisha', 'Om', 'Pallavi', 'Prateek', 'Priya', 'Rachna', 'Rajat', 'Ravi', 'Ritika', 'Rohan', 'Sahil', 'Sanaya', 'Sanjay', 'Shreya', 'Siddharth', 'Sneha', 'Suraj', 'Tanvi', 'Uday', 'Varun', 'Vidya', 'Yashaswi', 'Zara', 'Abhinav', 'Akash', 'Alisha', 'Amrita', 'Ankit', 'Archana', 'Aryan']
const STUDENT_LAST = ['Agarwal', 'Bhat', 'Choudhary', 'Desai', 'Gandhi', 'Gupta', 'Iyer', 'Jain', 'Kapoor', 'Khan', 'Kumar', 'Mehta', 'Mishra', 'Nair', 'Pandey', 'Patel', 'Pillai', 'Rao', 'Reddy', 'Saxena', 'Shah', 'Sharma', 'Singh', 'Sinha', 'Tiwari', 'Varma', 'Verma', 'Yadav', 'Bose', 'Das']

const BATCH_NAMES = [
    'CA Foundation Batch A',
    'CA Foundation Batch B',
    'CA Inter - Group I',
    'CA Inter - Group II',
    'CA Final - SFM Intensive',
    'CA Final - FR Intensive',
    'GST Masterclass',
    'Audit & Ethics Batch',
    'Direct Tax Special',
    'Costing Crash Course',
]

const JOIN_CODES = [
    'CAFND-A01', 'CAFND-B02', 'CAINT-G103', 'CAINT-G204', 'CAFIN-SFM5',
    'CAFIN-FR06', 'GST-MSTR07', 'AUD-ETH08', 'DT-SPCL09', 'COST-CC10',
]

const CA_SUBJECTS = ['Financial Reporting', 'Auditing', 'Direct Taxation', 'Cost Accounting', 'Business Law', 'Strategic Finance', 'Economics', 'Information Technology']
const CA_TOPICS = ['Partnership', 'Depreciation', 'GST Basics', 'Internal Audit', 'Tax Planning', 'Standard Costing', 'Companies Act', 'Capital Budgeting', 'Ratio Analysis', 'Marginal Costing']

const EXAM_TITLES = [
    'CA Foundation Mock Test 1', 'CA Foundation Mock Test 2',
    'CA Inter Accounting Quiz', 'CA Inter Law Test',
    'CA Final SFM Practice', 'CA Final FR Mock',
    'GST Objective Test', 'Audit Standards Quiz',
    'Income Tax Practice Set', 'Costing Weekly Test',
    'Economics Unit Test', 'Business Law MCQ',
    'FULL SYLLABUS Mock Exam', 'ICAI Pattern Practice',
    'Mid-term Review Test', 'Speed Test - Accounts',
    'Conceptual Clarity Quiz', 'Advanced Problems Set',
    'Revision Test Alpha', 'Revision Test Beta',
]

const MCQ_BANK = [
    { text: 'Which Accounting Standard deals with Revenue Recognition?', opts: ['AS-2', 'AS-7', 'AS-9', 'AS-15'], ans: 2 },
    { text: 'A Company with paid-up capital above what limit requires audit?', opts: ['₹5 Lakh', '₹10 Lakh', '₹25 Lakh', 'Any'], ans: 3 },
    { text: 'GST was implemented in India from which date?', opts: ['1 Apr 2016', '1 Jul 2017', '1 Jan 2018', '1 Apr 2019'], ans: 1 },
    { text: 'ICAI was established in which year?', opts: ['1942', '1947', '1949', '1956'], ans: 2 },
    { text: 'Which method values closing stock at market value or cost?', opts: ['FIFO', 'LIFO', 'Weighted Avg', 'Lower of cost or NRV'], ans: 3 },
    { text: 'Debenture holders are considered as:', opts: ['Owners', 'Creditors', 'Partners', 'Promoters'], ans: 1 },
    { text: 'Working capital = ?', opts: ['CA - CL', 'FA - CL', 'CA + CL', 'FA + CA'], ans: 0 },
    { text: 'Break-even point means:', opts: ['Max Profit', 'Zero Profit', 'Max Sales', 'Min Cost'], ans: 1 },
    { text: 'A bill of exchange has minimum ___ parties.', opts: ['1', '2', '3', '4'], ans: 2 },
    { text: 'Internal rate of return ignores:', opts: ['Cash Flows', 'Time Value', 'Scale of Investment', 'All'], ans: 2 },
    { text: 'Standard costing helps in:', opts: ['Tax Filing', 'Variance Analysis', 'Balance Sheet', 'None'], ans: 1 },
    { text: 'Indirect tax means tax on:', opts: ['Income', 'Wealth', 'Goods & Services', 'Property'], ans: 2 },
    { text: 'Capital gearing ratio measures:', opts: ['Profitability', 'Liquidity', 'Leverage', 'Efficiency'], ans: 2 },
    { text: 'An auditor\'s primary duty is to:', opts: ['Detect fraud', 'Express an opinion', 'Prepare accounts', 'Calculate tax'], ans: 1 },
    { text: 'Ratio of Net Profit to Net Sales is called:', opts: ['Gross Profit Ratio', 'Net Profit Ratio', 'Current Ratio', 'Quick Ratio'], ans: 1 },
    { text: 'Deferred Revenue Expenditure is shown in:', opts: ['P&L A/c', 'Balance Sheet', 'Cash Flow', 'None'], ans: 1 },
    { text: 'SEBI stands for:', opts: ['Securities Exchange Board of India', 'Stock Exchange Bureau of India', 'Securities Evaluation Board of India', 'None'], ans: 0 },
    { text: 'Net Present Value method discounts cash flows at:', opts: ['Required rate of return', 'Inflation rate', 'Bank rate', 'None'], ans: 0 },
    { text: 'Which of the following is a non-cash expense?', opts: ['Salary', 'Rent', 'Depreciation', 'Interest'], ans: 2 },
    { text: 'Goodwill is a:', opts: ['Current Asset', 'Fixed Asset', 'Fictitious Asset', 'Intangible Asset'], ans: 3 },
]

const ANNOUNCEMENT_TEMPLATES = [
    'Class rescheduled to tomorrow 6 PM. Please be punctual.',
    'Mock test next Saturday — syllabus: full Chapters 1–5.',
    'Study material for Chapter 6 has been uploaded. Check your batch folder.',
    'Congratulations to all students who scored above 80% in last week\'s quiz! 🎉',
    'Important: ICAI has released new practice manual. Link shared in resources.',
    'Doubt session this Friday at 7 PM. Bring your question lists!',
    'Reminder: Submit assignment by end of this week.',
    'New video lecture on Partnership Accounts now available.',
    'Office hours extended — you can reach me till 9 PM on weekdays.',
    'Next batch of rank-holders will be announced after Sunday\'s test.',
    'Syllabus revision schedule has been updated. Check the announcement board.',
    'Students who missed yesterday\'s class: recording posted in materials.',
]

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log('🌱  Starting comprehensive seed...\n')

    // 1. Create 10 Teachers
    console.log('👩‍🏫  Creating 10 teachers...')
    const teachers = []
    for (const t of TEACHERS) {
        const user = await prisma.user.upsert({
            where: { email: t.email },
            update: {},
            create: {
                email: t.email,
                fullName: t.name,
                role: 'TEACHER',
                registrationNumber: t.reg,
                department: t.dept,
                designation: 'Faculty',
                expertise: t.expertise,
                phone: `+91 98${rnd(10, 99)}${rnd(100000, 999999)}`,
                bio: `${t.name} is an experienced CA faculty specialising in ${t.expertise}.`,
                plan: 'PRO',
                storageUsed: rnd(5_000_000, 40_000_000),
                storageLimit: 104_857_600, // 100 MB
                createdAt: daysAgo(rnd(180, 365)),
            },
        })
        teachers.push(user)
        console.log(`  ✓ ${user.fullName}`)
    }

    // 2. Create 10 Batches (1 per teacher)
    console.log('\n📦  Creating 10 batches...')
    const batches: any[] = []
    for (let i = 0; i < 10; i++) {
        const batch = await prisma.batch.upsert({
            where: { uniqueJoinCode: JOIN_CODES[i] },
            update: {},
            create: {
                name: BATCH_NAMES[i],
                uniqueJoinCode: JOIN_CODES[i],
                teacherId: teachers[i].id,
                createdAt: daysAgo(rnd(60, 150)),
            },
        })
        batches.push(batch)
        console.log(`  ✓ ${batch.name}`)
    }

    // 3. Create 100 Students & enroll them (10 per teacher's batch)
    console.log('\n🎓  Creating 100 students...')
    const students = []
    const usedEmails = new Set<string>()
    const usedRegs = new Set<string>()

    for (let ti = 0; ti < 10; ti++) {
        for (let si = 0; si < 10; si++) {
            const fn = STUDENT_FIRST[(ti * 10 + si) % STUDENT_FIRST.length]
            const ln = STUDENT_LAST[(ti * 10 + si) % STUDENT_LAST.length]
            let email = `${fn.toLowerCase()}.${ln.toLowerCase()}${ti}${si}@student.ca`
            const reg = `S${2000 + ti * 10 + si}`

            while (usedEmails.has(email)) email = email.replace('@', `_${rnd(1, 99)}@`)
            usedEmails.add(email)

            const level = pick(['CA_FOUNDATION', 'CA_INTER', 'CA_FINAL'])
            const student = await prisma.user.upsert({
                where: { email },
                update: {},
                create: {
                    email,
                    fullName: `${fn} ${ln}`,
                    role: 'STUDENT',
                    registrationNumber: usedRegs.has(reg) ? `${reg}X` : reg,
                    department: pick(['Commerce', 'Science', 'Arts']),
                    examTarget: level,
                    phone: `+91 70${rnd(10, 99)}${rnd(100000, 999999)}`,
                    plan: pick(['FREE', 'FREE', 'BASIC', 'PRO']),
                    storageUsed: rnd(0, 20_000_000),
                    createdAt: daysAgo(rnd(10, 120)),
                },
            })
            usedRegs.add(reg)
            students.push({ student, batchIndex: ti })

            // Enroll in primary batch
            await prisma.enrollment.upsert({
                where: { studentId_batchId: { studentId: student.id, batchId: batches[ti].id } },
                update: {},
                create: {
                    studentId: student.id,
                    batchId: batches[ti].id,
                    joinedAt: daysAgo(rnd(5, 90)),
                },
            })

            // 20% of students are in a second batch as well
            if (Math.random() < 0.2) {
                const secondBatchIdx = (ti + rnd(1, 9)) % 10
                try {
                    await prisma.enrollment.create({
                        data: {
                            studentId: student.id,
                            batchId: batches[secondBatchIdx].id,
                            joinedAt: daysAgo(rnd(1, 30)),
                        },
                    })
                } catch {
                    // ignore duplicate
                }
            }
        }
        console.log(`  ✓ 10 students for ${teachers[ti].fullName}`)
    }

    // 4. Create 20 Exams (roughly 2 per teacher) with questions
    console.log('\n📝  Creating exams & questions...')
    const allExams = []
    for (let ei = 0; ei < 20; ei++) {
        const ti = ei % 10
        const qCount = rnd(10, 20)
        const marksEach = 4
        const exam = await prisma.exam.create({
            data: {
                title: EXAM_TITLES[ei],
                description: `Practice exam by ${teachers[ti].fullName} covering ${pick(CA_SUBJECTS)}.`,
                duration: pick([60, 90, 120, 180]),
                totalMarks: qCount * marksEach,
                passingMarks: Math.floor(qCount * marksEach * 0.5),
                category: pick(['CA Foundation', 'CA Inter', 'CA Final', 'General']),
                status: pick(['PUBLISHED', 'PUBLISHED', 'PUBLISHED', 'DRAFT', 'ARCHIVED']),
                teacherId: teachers[ti].id,
                batchId: batches[ti].id,
                createdAt: daysAgo(rnd(10, 80)),
            },
        })
        allExams.push({ exam, teacherIdx: ti, qCount })

        // Create questions for this exam
        for (let qi = 0; qi < qCount; qi++) {
            const qData = MCQ_BANK[qi % MCQ_BANK.length]
            const question = await prisma.question.create({
                data: {
                    text: qData.text,
                    type: 'MCQ',
                    difficulty: pick(['EASY', 'MEDIUM', 'HARD']),
                    subject: pick(CA_SUBJECTS),
                    topic: pick(CA_TOPICS),
                    explanation: `This tests conceptual understanding of ${pick(CA_TOPICS)}.`,
                    options: {
                        create: qData.opts.map((o, idx) => ({
                            text: o,
                            isCorrect: idx === qData.ans,
                        })),
                    },
                },
            })
            await prisma.examQuestion.create({
                data: {
                    examId: exam.id,
                    questionId: question.id,
                    order: qi + 1,
                    marks: marksEach,
                },
            })
        }
    }
    console.log('  ✓ 20 exams with questions')

    // 5. Generate Exam Attempts (students attempt published exams in their batch)
    console.log('\n📊  Generating exam attempts...')
    let attemptCount = 0

    for (const { student, batchIndex } of students) {
        // Student attempts 2–4 of the published exams available in their batch
        const relevantExams = allExams.filter(e =>
            e.exam.batchId === batches[batchIndex].id &&
            e.exam.status === 'PUBLISHED'
        )

        const sampled = relevantExams.slice(0, rnd(1, Math.min(3, relevantExams.length)))
        for (const { exam, qCount } of sampled) {
            // Simulate exam attempt
            const accuracyPct = rnd(30, 100) / 100
            const correctCount = Math.round(qCount * accuracyPct)
            const score = correctCount * 4
            const startedAt = daysAgo(rnd(1, 60))
            const endedAt = new Date(startedAt.getTime() + rnd(1800, 7200) * 1000)

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

            // Fetch this exam's questions & options to generate student answers
            const examQs = await prisma.examQuestion.findMany({
                where: { examId: exam.id },
                include: { question: { include: { options: true } } },
            })

            const correctOnes = new Set(
                Array.from({ length: correctCount }, () => Math.floor(Math.random() * qCount))
            )

            for (let qi = 0; qi < examQs.length; qi++) {
                const { question } = examQs[qi]
                const isCorrect = correctOnes.has(qi)
                const correctOpt = question.options.find(o => o.isCorrect)
                const wrongOpts = question.options.filter(o => !o.isCorrect)
                const chosen = isCorrect ? correctOpt : pick(wrongOpts)

                try {
                    await prisma.studentAnswer.create({
                        data: {
                            attemptId: attempt.id,
                            questionId: question.id,
                            selectedOptionId: chosen?.id ?? null,
                            isCorrect,
                            timeSpent: rnd(20, 180),
                        },
                    })
                } catch {
                    // skip duplicate
                }
            }
            attemptCount++
        }
    }
    console.log(`  ✓ ${attemptCount} exam attempts`)

    // 6. Create Announcements (3–6 per batch)
    console.log('\n📢  Creating announcements...')
    let annCount = 0
    for (let bi = 0; bi < 10; bi++) {
        const count = rnd(3, 6)
        for (let ai = 0; ai < count; ai++) {
            await prisma.announcement.create({
                data: {
                    content: pick(ANNOUNCEMENT_TEMPLATES),
                    batchId: batches[bi].id,
                    teacherId: teachers[bi].id,
                    createdAt: daysAgo(rnd(0, 45)),
                },
            })
            annCount++
        }
    }
    console.log(`  ✓ ${annCount} announcements`)

    // 7. Create Study Materials (2–4 per teacher / folder) + Public Resources
    console.log('\n📚  Creating study materials & public resources...')
    const FILE_TYPES = ['PDF', 'PPT', 'DOCX', 'MP4', 'PDF', 'PDF']
    const MAT_TITLES = ['Chapter Notes', 'Practice Questions', 'Formula Sheet', 'Video Lecture', 'Past Year Papers', 'Summary Sheet', 'Quick Revision PDF', 'MCQ Bank']
    let matCount = 0

    const RESOURCE_CATEGORIES = ["CA Final", "CA Inter", "CA Foundation", "Case Studies", "Amendments"];
    const SUB_TYPES = ["PDF", "VIDEO", "RTP", "MTP", "PYQ"];

    for (let ti = 0; ti < 10; ti++) {
        // Create a folder for each teacher
        const folder = await prisma.folder.create({
            data: {
                name: `${BATCH_NAMES[ti]} - Resources`,
                ownerId: teachers[ti].id,
            },
        })

        const count = rnd(2, 4)
        for (let mi = 0; mi < count; mi++) {
            const fileName = pick(MAT_TITLES)
            const isPublic = Math.random() < 0.5;
            
            const material = await prisma.studyMaterial.create({
                data: {
                    title: `${fileName} - ${pick(CA_SUBJECTS)}`,
                    description: `Prepared by ${teachers[ti].fullName}. Comprehensive coverage of concepts for ${pick(RESOURCE_CATEGORIES)}.`,
                    fileUrl: `/uploads/${teachers[ti].registrationNumber}/file_${mi}.${pick(FILE_TYPES).toLowerCase()}`,
                    fileType: pick(FILE_TYPES),
                    sizeInBytes: rnd(200_000, 15_000_000),
                    isPublic: isPublic,
                    category: pick(RESOURCE_CATEGORIES),
                    subType: isPublic ? (fileName.includes("Past Year") ? "PYQ" : pick(SUB_TYPES)) : "PDF",
                    downloads: rnd(100, 25000),
                    rating: 4.0 + (Math.random() * 1.0),
                    isTrending: Math.random() < 0.3,
                    uploadedById: teachers[ti].id,
                    folderId: folder.id,
                    createdAt: daysAgo(rnd(5, 60)),
                },
            })

            // Grant access to the 10 students in this batch (for private ones)
            if (!isPublic) {
                const batchStudents = students
                    .filter(s => s.batchIndex === ti)
                    .slice(0, 10)

                for (const { student } of batchStudents) {
                    try {
                        await prisma.materialAccess.create({
                            data: {
                                studentId: student.id,
                                materialId: material.id,
                                accessType: 'FREE_BATCH_MATERIAL',
                            },
                        })
                    } catch {
                        // ignore if already exists
                    }
                }
            }
            matCount++
        }
    }
    console.log(`  ✓ ${matCount} study materials`)

    // 8. Create StudentLearningProfile + TopicProgress + XPEvents for every student
    console.log('\n🧠  Building learning profiles & XP...')
    let profileCount = 0

    for (const { student } of students) {
        const totalAttempts = rnd(5, 80)
        const totalCorrect = Math.floor(totalAttempts * (rnd(30, 95) / 100))
        const avgAccuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0
        const xp = totalCorrect * rnd(5, 15)
        const level = Math.max(1, Math.floor(xp / 200))
        const streak = rnd(0, 21)

        let profile
        try {
            profile = await prisma.studentLearningProfile.create({
                data: {
                    studentId: student.id,
                    totalXP: xp,
                    level,
                    streak,
                    longestStreak: Math.max(streak, rnd(0, 30)),
                    totalAttempts,
                    totalCorrect,
                    avgAccuracy,
                    weakTopicsJson: JSON.stringify([pick(CA_TOPICS), pick(CA_TOPICS)]),
                    badgesJson: JSON.stringify(
                        level >= 3 ? ['first_exam', 'streak_7', 'accuracy_80'] :
                            level >= 2 ? ['first_exam'] : []
                    ),
                    lastAttemptAt: daysAgo(rnd(0, 15)),
                },
            })
        } catch {
            profile = await prisma.studentLearningProfile.findUnique({
                where: { studentId: student.id },
            })
        }

        if (!profile) continue

        // 2–4 topic progress entries
        const topics = new Set<string>()
        const topicCount = rnd(2, 4)
        while (topics.size < topicCount) topics.add(pick(CA_TOPICS))

        for (const topic of topics) {
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
                        avgTimeSpent: rnd(30, 120),
                        difficulty: pick(['EASY', 'MEDIUM', 'HARD']),
                        lastSeenAt: daysAgo(rnd(0, 30)),
                        nextReviewAt: daysAgo(rnd(-7, 7)),
                    },
                })
            } catch {
                // duplicate guard
            }
        }

        // 3–6 XP events
        const reasons = ['exam_completed', 'perfect_score', 'streak_bonus', 'first_attempt', 'accuracy_bonus']
        for (let xi = 0; xi < rnd(3, 6); xi++) {
            await prisma.xPEvent.create({
                data: {
                    studentId: student.id,
                    profileId: profile.id,
                    xpDelta: rnd(10, 100),
                    reason: pick(reasons),
                    meta: JSON.stringify({ date: daysAgo(rnd(0, 30)).toISOString() }),
                    createdAt: daysAgo(rnd(0, 30)),
                },
            })
        }
        profileCount++
    }
    console.log(`  ✓ ${profileCount} learning profiles with XP events`)

    // 9. Draft MCQs for each teacher (5 each)
    console.log('\n📋  Creating draft MCQs for teachers...')
    for (const teacher of teachers) {
        for (let di = 0; di < 5; di++) {
            const q = MCQ_BANK[di % MCQ_BANK.length]
            await prisma.draftMCQ.create({
                data: {
                    teacherId: teacher.id,
                    question: q.text,
                    options: JSON.stringify(q.opts),
                    answer: q.opts[q.ans],
                },
            })
        }
    }
    console.log('  ✓ 50 draft MCQs')

    console.log('\n✅  Seed complete!')
    console.log(`   Teachers   : 10`)
    console.log(`   Students   : 100`)
    console.log(`   Batches    : 10`)
    console.log(`   Exams      : 20`)
    console.log(`   Attempts   : ${attemptCount}`)
    console.log(`   Announcements: ${annCount}`)
    console.log(`   Materials  : ${matCount}`)
    console.log(`   Profiles   : ${profileCount}`)
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(async () => { await prisma.$disconnect() })
