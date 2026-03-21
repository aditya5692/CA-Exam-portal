import * as dotenv from 'dotenv'
dotenv.config()
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

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
    { name: 'CA Ramesh FR Specialist', email: 'ramesh.fr@caportal.edu', reg: 'T1001', dept: 'Accounting', expertise: 'Financial Reporting (Paper 1)' },
    { name: 'Dr. Neha AFM Expert', email: 'neha.afm@caportal.edu', reg: 'T1002', dept: 'Finance', expertise: 'Advanced Financial Management (Paper 2)' },
    { name: 'CA Vivek Audit Guru', email: 'vivek.audit@caportal.edu', reg: 'T1003', dept: 'Audit', expertise: 'Advanced Auditing & Ethics (Paper 3)' },
    { name: 'CA Sahil Tax Wizard', email: 'sahil.dt@caportal.edu', reg: 'T1004', dept: 'Direct Tax', expertise: 'Direct Tax & International Taxation (Paper 4)' },
    { name: 'CA Anjali IDT Specialist', email: 'anjali.idt@caportal.edu', reg: 'T1005', dept: 'Indirect Tax', expertise: 'Indirect Tax Laws (Paper 5)' },
    { name: 'Prof. Manish IBS Mentor', email: 'manish.ibs@caportal.edu', reg: 'T1006', dept: 'Integrated', expertise: 'Integrated Business Solutions (Paper 6)' }
]

const STUDENT_FIRST = ['Aarav', 'Aditya', 'Ananya', 'Arjun', 'Ayesha', 'Bhavna', 'Chirag', 'Deepa', 'Divya', 'Farhan', 'Gaurav', 'Harini', 'Ishan', 'Jyoti', 'Karan', 'Kavya', 'Lakshmi', 'Manish', 'Meera', 'Nikhil', 'Nisha', 'Om', 'Pallavi', 'Prateek', 'Priya', 'Rachna', 'Rajat', 'Ravi', 'Ritika', 'Rohan', 'Sahil', 'Sanaya', 'Sanjay', 'Shreya', 'Siddharth', 'Sneha', 'Suraj', 'Tanvi', 'Uday', 'Varun', 'Vidya', 'Yashaswi', 'Zara', 'Abhinav', 'Akash', 'Alisha', 'Amrita', 'Ankit', 'Archana', 'Aryan']
const STUDENT_LAST = ['Agarwal', 'Bhat', 'Choudhary', 'Desai', 'Gandhi', 'Gupta', 'Iyer', 'Jain', 'Kapoor', 'Khan', 'Kumar', 'Mehta', 'Mishra', 'Nair', 'Pandey', 'Patel', 'Pillai', 'Rao', 'Reddy', 'Saxena', 'Shah', 'Sharma', 'Singh', 'Sinha', 'Tiwari', 'Varma', 'Verma', 'Yadav', 'Bose', 'Das']

const BATCH_NAMES = [
    'CA Final - Financial Reporting (May 24)',
    'CA Final - AFM Intensive (Nov 24)',
    'CA Final - Advanced Auditing',
    'CA Final - Direct Tax & International Tax',
    'CA Final - Indirect Tax Laws (IDT)',
    'CA Final - Integrated Business Solutions (IBS)'
]

const JOIN_CODES = [
    'FR-MAY24', 'AFM-NOV24', 'AUDIT-P3', 'DT-TAX-P4', 'IDT-P5', 'IBS-P6'
]

const CA_SUBJECTS = [
    'Financial Reporting (Paper 1)', 
    'Advanced Financial Management (Paper 2)', 
    'Advanced Auditing, Assurance & Professional Ethics (Paper 3)', 
    'Direct Tax Laws & International Taxation (Paper 4)', 
    'Indirect Tax Laws (Paper 5)',
    'Integrated Business Solutions (Paper 6)'
]

const CA_TOPICS = [
    'Ind AS 115 - Revenue', 'Leases Ind AS 116', 'Corporate Valuation', 'Foreign Exchange Risk',
    'Professional Ethics', 'Audit of NBFCs', 'Transfer Pricing', 'Assessment of Trusts',
    'Place of Supply - GST', 'Input Tax Credit', 'Case Study Integration', 'Strategic Management'
]

const EXAM_TITLES = [
    'FR Mock Test - Financial Instruments',
    'AFM Practice Test - Derivatives',
    'Auditing Standards Masterclass',
    'Direct Tax Practice - Assessment',
    'IDT Weekly Test - GST Compliance',
    'IBS Case Study 01',
    'FULL SYLLABUS MOCK - Group 1',
    'FULL SYLLABUS MOCK - Group 2'
]

const MCQ_BANK = [
    // Paper 1: Financial Reporting (FR)
    { text: 'Under Ind AS 115, revenue is recognized when:', opts: ['Cash is received', 'Invoices are generated', 'The customer obtains control of goods', 'Risks and rewards are transferred'], ans: 2, sub: 'Financial Reporting (Paper 1)' },
    { text: 'Ind AS 116 "Leases" requires a lessee to recognize:', opts: ['Only Finance Leases', 'Only Operating Leases', 'Right-of-Use asset and Lease Liability', 'Rent expense on SLM basis'], ans: 2, sub: 'Financial Reporting (Paper 1)' },
    { text: 'In a Business Combination (Ind AS 103), bargain purchase gain is recognized in:', opts: ['Profit & Loss', 'Other Comprehensive Income', 'Capital Reserve', 'Retained Earnings'], ans: 2, sub: 'Financial Reporting (Paper 1)' },
    { text: 'Ind AS 32 deals with:', opts: ['Financial Instruments: Presentation', 'Financial Instruments: Recognition', 'Financial Instruments: Disclosures', 'Operating Segments'], ans: 0, sub: 'Financial Reporting (Paper 1)' },
    { text: 'Consolidated Financial Statements are prepared under:', opts: ['Ind AS 27', 'Ind AS 110', 'Ind AS 28', 'Ind AS 111'], ans: 1, sub: 'Financial Reporting (Paper 1)' },

    // Paper 2: Advanced Financial Management (AFM)
    { text: 'In Capital Budgeting, if NPV is zero, the IRR is:', opts: ['Zero', 'Equal to cost of capital', 'Less than cost of capital', 'Undefined'], ans: 1, sub: 'Advanced Financial Management (Paper 2)' },
    { text: 'Beta measures:', opts: ['Unsystematic risk', 'Systematic risk', 'Total risk', 'Credit risk'], ans: 1, sub: 'Advanced Financial Management (Paper 2)' },
    { text: 'A call option is "in the money" when:', opts: ['Strike > Spot', 'Spot > Strike', 'Spot = Strike', 'Never'], ans: 1, sub: 'Advanced Financial Management (Paper 2)' },
    { text: 'Foreign exchange risk arising from future transactions is called:', opts: ['Translation risk', 'Transaction risk', 'Economic risk', 'Business risk'], ans: 1, sub: 'Advanced Financial Management (Paper 2)' },
    { text: 'The Capital Asset Pricing Model (CAPM) relates:', opts: ['Risk to Return', 'Cost to Price', 'Dividend to Growth', 'Supply to Demand'], ans: 0, sub: 'Advanced Financial Management (Paper 2)' },

    // Paper 3: Advanced Auditing, Assurance & Professional Ethics
    { text: 'SQC 1 deals with:', opts: ['Audit Documentation', 'Quality Control for Firms', 'Fraud in Audit', 'Materiality'], ans: 1, sub: 'Advanced Auditing, Assurance & Professional Ethics (Paper 3)' },
    { text: 'Key Audit Matters (KAM) are reported under:', opts: ['SA 700', 'SA 701', 'SA 705', 'SA 706'], ans: 1, sub: 'Advanced Auditing, Assurance & Professional Ethics (Paper 3)' },
    { text: 'A Chartered Accountant in practice can specify his name on:', opts: ['Greetings cards', 'Educational brochures', 'Visiting cards', 'All of the above'], ans: 3, sub: 'Advanced Auditing, Assurance & Professional Ethics (Paper 3)' },
    { text: 'Audit of NBFCs is governed by directions issued by:', opts: ['ICAI', 'SEBI', 'RBI', 'Ministry of Finance'], ans: 2, sub: 'Advanced Auditing, Assurance & Professional Ethics (Paper 3)' },
    { text: 'Under SA 600, the Principal Auditor has a right to:', opts: ['Review Branch auditor workpapers', 'Visit the branch', 'Request information from branch auditor', 'Both 2 and 3'], ans: 3, sub: 'Advanced Auditing, Assurance & Professional Ethics (Paper 3)' },

    // Paper 4: Direct Tax Laws & International Taxation
    { text: 'Significant Economic Presence (SEP) threshold for digital transactions is:', opts: ['₹1 Crore', '₹2 Crore', '₹5 Crore', '₹50 Lakh'], ans: 1, sub: 'Direct Tax Laws & International Taxation (Paper 4)' },
    { text: 'Standard deduction for salaried employees under the new tax regime (2024) is:', opts: ['₹40,000', '₹50,000', '₹75,000', '₹2,50,000'], ans: 2, sub: 'Direct Tax Laws & International Taxation (Paper 4)' },
    { text: 'The time limit for filing an updated return (Section 139(8A)) is:', opts: ['12 months', '24 months', '36 months', '9 months'], ans: 1, sub: 'Direct Tax Laws & International Taxation (Paper 4)' },
    { text: 'TDS on lottery winnings is at:', opts: ['10%', '20%', '30%', '5%'], ans: 2, sub: 'Direct Tax Laws & International Taxation (Paper 4)' },
    { text: 'Base Erosion and Profit Shifting (BEPS) Action 13 relates to:', opts: ['Digital Economy', 'Hybrid Mismatch', 'Country-by-Country Reporting', 'Transfer Pricing'], ans: 2, sub: 'Direct Tax Laws & International Taxation (Paper 4)' },

    // Paper 5: Indirect Tax Laws (IDT)
    { text: 'Under GST, Time of Supply for goods is generally:', opts: ['Date of invoice', 'Date of payment', 'Date of delivery', 'Date of invoice or last date of issue'], ans: 3, sub: 'Indirect Tax Laws (Paper 5)' },
    { text: 'Place of Supply for service of admission to an event is:', opts: ['Location of supplier', 'Location of recipient', 'Where the event is held', 'Location of contract'], ans: 2, sub: 'Indirect Tax Laws (Paper 5)' },
    { text: 'Input Tax Credit (ITC) is blocked for:', opts: ['Office equipment', 'Personal food & beverages', 'Factory machines', 'Raw materials'], ans: 1, sub: 'Indirect Tax Laws (Paper 5)' },
    { text: 'Composition scheme threshold for manufacturers is:', opts: ['₹1 Crore', '₹1.5 Crore', '₹2 Crore', '₹50 Lakh'], ans: 1, sub: 'Indirect Tax Laws (Paper 5)' },
    { text: 'IGST is levied on:', opts: ['Intra-state supplies', 'Inter-state supplies', 'Exempt supplies', 'None'], ans: 1, sub: 'Indirect Tax Laws (Paper 5)' },

    // Paper 6: Integrated Business Solutions (IBS)
    { text: 'Integrated Business Solutions (Paper 6) is an:', opts: ['Closed book exam', 'Open book exam', 'Oral viva', 'Practical project'], ans: 1, sub: 'Integrated Business Solutions (Paper 6)' },
    { text: 'Michael Porter\'s "Five Forces" model is used for:', opts: ['Risk assessment', 'Industry analysis', 'Cost accounting', 'Audit planning'], ans: 1, sub: 'Integrated Business Solutions (Paper 6)' },
    { text: 'ESG reporting stands for:', opts: ['Economic, Social, Goods', 'Environmental, Social, Governance', 'Energy, Safety, Growth', 'Equity, Stability, Gains'], ans: 1, sub: 'Integrated Business Solutions (Paper 6)' },
    { text: 'A "Turnaround Strategy" is most appropriate when:', opts: ['Entering new markets', 'Company faces continuous losses', 'Acquiring a competitor', 'Issuing IPO'], ans: 1, sub: 'Integrated Business Solutions (Paper 6)' },
    { text: 'Risk mitigation strategy of "Transfer" usually involves:', opts: ['Avoiding the project', 'Buying Insurance', 'Cost cutting', 'Accepting risk'], ans: 1, sub: 'Integrated Business Solutions (Paper 6)' },

    // Full Syllabus Multidisciplinary MCQs
    { text: 'The impact of Ind AS on Tax liability is bridged by:', opts: ['Deferred Tax (Ind AS 12)', 'Cash Flow', 'Audit Report', 'Board Report'], ans: 0, sub: 'FULL SYLLABUS' },
    { text: 'Professional Ethics applies to CA in:', opts: ['Practice ONLY', 'Employment ONLY', 'Both Practice and Employment', 'Teaching ONLY'], ans: 2, sub: 'FULL SYLLABUS' },
    { text: 'Foreign branch integration involves:', opts: ['Ind AS 21', 'FEMA regulations', 'International Taxation', 'All of the above'], ans: 3, sub: 'FULL SYLLABUS' },
    { text: 'Valuation of a startup for funding involves:', opts: ['AFM concepts', 'Asset valuation', 'Direct tax implications', 'All of the above'], ans: 3, sub: 'FULL SYLLABUS' },
    { text: 'Audit of a group entity requires:', opts: ['SA 600', 'Ind AS 110', 'Compliance with Companies Act', 'All of the above'], ans: 3, sub: 'FULL SYLLABUS' }
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

    // 0. Cleanup existing data
    console.log('🧹  Cleaning up database...')
    await prisma.studentAnswer.deleteMany({})
    await prisma.examAttempt.deleteMany({})
    await prisma.examQuestion.deleteMany({})
    await prisma.question.deleteMany({})
    await prisma.option.deleteMany({})
    await prisma.exam.deleteMany({})
    await prisma.announcement.deleteMany({})
    await prisma.enrollment.deleteMany({})
    await prisma.batch.deleteMany({})
    await prisma.materialAccess.deleteMany({})
    await prisma.studyMaterial.deleteMany({})
    await prisma.folder.deleteMany({})
    await prisma.xPEvent.deleteMany({})
    await prisma.topicProgress.deleteMany({})
    await prisma.studentLearningProfile.deleteMany({})
    await prisma.draftMCQ.deleteMany({})
    await prisma.user.deleteMany({ where: { role: { in: ['STUDENT', 'TEACHER'] } } })
    console.log('  ✓ Cleanup complete\n')

    // 1. Create 6 Teachers
    console.log('👩‍🏫  Creating 6 teachers...')
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

    // 2. Create 6 Batches (1 per teacher)
    console.log('\n📦  Creating 6 batches...')
    const batches: any[] = []
    for (let i = 0; i < 6; i++) {
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

    for (let ti = 0; ti < 6; ti++) {
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
                const secondBatchIdx = (ti + rnd(1, 4)) % 6
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
        const ti = ei % 6
        const qCount = rnd(10, 20)
        const marksEach = 4
        const exam = await prisma.exam.create({
            data: {
                title: EXAM_TITLES[ei % EXAM_TITLES.length],
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
    for (let bi = 0; bi < 6; bi++) {
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

    const ICAI_PDFS = [
        { title: 'Revision Test Paper (RTP) - May 2025', url: 'https://resource.cdn.icai.org/82155bos66380-p1.pdf', type: 'RTP' },
        { title: 'Mock Test Paper (MTP) - Series 1', url: 'https://resource.cdn.icai.org/81944bos65809-p1.pdf', type: 'MTP' },
        { title: 'Suggested Answers - Jan 2024', url: 'https://resource.cdn.icai.org/79261bos63731.pdf', type: 'PYQ' },
        { title: 'Quick Revision Notes - Ind AS', url: 'https://resource.cdn.icai.org/62325bos50435.pdf', type: 'PDF' }
    ];

    for (let ti = 0; ti < 6; ti++) {
        // Create a folder for each teacher
        const folder = await prisma.folder.create({
            data: {
                name: `${BATCH_NAMES[ti]} - Resources`,
                ownerId: teachers[ti].id,
            },
        })

        const count = rnd(3, 5)
        for (let mi = 0; mi < count; mi++) {
            const pdfInfo = ICAI_PDFS[mi % ICAI_PDFS.length]
            const isPublic = true; // Making all seeded papers public as requested
            
            const material = await prisma.studyMaterial.create({
                data: {
                    title: `${CA_SUBJECTS[ti]} - ${pdfInfo.title}`,
                    description: `Official ${pdfInfo.type} release for ${CA_SUBJECTS[ti]}. Verified by ${teachers[ti].fullName}.`,
                    fileUrl: pdfInfo.url,
                    fileType: 'PDF',
                    sizeInBytes: rnd(1_000_000, 5_000_000),
                    isPublic: isPublic,
                    category: 'CA Final',
                    subType: pdfInfo.type,
                    downloads: rnd(1000, 50000),
                    rating: 4.5 + (Math.random() * 0.5),
                    isTrending: Math.random() < 0.4,
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
                    weakTopicsJson: JSON.stringify([pick(CA_TOPICS), pick(CA_TOPICS)]) as any,
                    badgesJson: JSON.stringify(
                        level >= 3 ? ['first_exam', 'streak_7', 'accuracy_80'] :
                            level >= 2 ? ['first_exam'] : []
                    ) as any,
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
    console.log(`   Teachers   : 6`)
    console.log(`   Students   : 60`)
    console.log(`   Batches    : 6`)
    console.log(`   Exams      : 20`)
    console.log(`   Attempts   : ${attemptCount}`)
    console.log(`   Announcements: ${annCount}`)
    console.log(`   Materials  : ${matCount}`)
    console.log(`   Profiles   : ${profileCount}`)
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(async () => { await prisma.$disconnect() })
