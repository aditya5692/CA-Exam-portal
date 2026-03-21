
import * as dotenv from 'dotenv';
import { createRuntimePrismaClient } from '../src/lib/prisma/runtime';
dotenv.config()

const { prisma } = createRuntimePrismaClient(process.env)

const CA_FINAL_SUBJECTS = [
    "Financial Reporting",
    "Advanced Financial Management",
    "Advanced Auditing, Assurance and Professional Ethics",
    "Direct Tax Laws & International Taxation",
    "Indirect Tax Laws",
    "Integrated Business Solutions"
];

const MCQ_BANK: Record<string, { text: string, opts: string[], ans: number, explanation: string }[]> = {
    "Financial Reporting": [
        { text: 'Under Ind AS 115, revenue is recognized when:', opts: ['Cash is received', 'Invoices are generated', 'The customer obtains control of goods', 'Risks and rewards are transferred'], ans: 2, explanation: 'Revenue is recognized when control is transferred to the customer.' },
        { text: 'Ind AS 116 "Leases" requires a lessee to recognize:', opts: ['Only Finance Leases', 'Only Operating Leases', 'Right-of-Use asset and Lease Liability', 'Rent expense on SLM basis'], ans: 2, explanation: 'Lessees must recognize ROU assets and lease liabilities for almost all leases.' },
        { text: 'In a Business Combination (Ind AS 103), bargain purchase gain is recognized in:', opts: ['Profit & Loss', 'Other Comprehensive Income', 'Capital Reserve', 'Retained Earnings'], ans: 2, explanation: 'Bargain purchase gains are credited to Capital Reserve after reassessment.' },
        { text: 'Ind AS 32 deals with:', opts: ['Financial Instruments: Presentation', 'Financial Instruments: Recognition', 'Financial Instruments: Disclosures', 'Operating Segments'], ans: 0, explanation: 'Ind AS 32 focuses on the presentation of financial instruments.' },
        { text: 'Consolidated Financial Statements are prepared under:', opts: ['Ind AS 27', 'Ind AS 110', 'Ind AS 28', 'Ind AS 111'], ans: 1, explanation: 'Ind AS 110 sets out the requirements for consolidated statements.' }
    ],
    "Advanced Financial Management": [
        { text: 'In Capital Budgeting, if NPV is zero, the IRR is:', opts: ['Zero', 'Equal to cost of capital', 'Less than cost of capital', 'Undefined'], ans: 1, explanation: 'IRR is the discount rate that makes NPV equal to zero.' },
        { text: 'Beta measures:', opts: ['Unsystematic risk', 'Systematic risk', 'Total risk', 'Credit risk'], ans: 1, explanation: 'Beta represents the volatility of a security relative to the market.' },
        { text: 'A call option is "in the money" when:', opts: ['Strike > Spot', 'Spot > Strike', 'Spot = Strike', 'Never'], ans: 1, explanation: 'A call option is ITM if the spot price exceeds the strike price.' },
        { text: 'Foreign exchange risk arising from future transactions is called:', opts: ['Translation risk', 'Transaction risk', 'Economic risk', 'Business risk'], ans: 1, explanation: 'Transaction risk relates to the effect of FX changes on actual cash flows.' },
        { text: 'The Capital Asset Pricing Model (CAPM) relates:', opts: ['Risk to Return', 'Cost to Price', 'Dividend to Growth', 'Supply to Demand'], ans: 0, explanation: 'CAPM describes the relationship between systematic risk and expected return.' }
    ],
    "Advanced Auditing, Assurance and Professional Ethics": [
        { text: 'SQC 1 deals with:', opts: ['Audit Documentation', 'Quality Control for Firms', 'Fraud in Audit', 'Materiality'], ans: 1, explanation: 'SQC 1 provides standards for quality control within the firm.' },
        { text: 'Key Audit Matters (KAM) are reported under:', opts: ['SA 700', 'SA 701', 'SA 705', 'SA 706'], ans: 1, explanation: 'SA 701 governs the communication of KAM in the auditors report.' },
        { text: 'A Chartered Accountant in practice can specify his name on:', opts: ['Greetings cards', 'Educational brochures', 'Visiting cards', 'All of the above'], ans: 3, explanation: 'CAs can include their names on these items as per ethical guidelines.' },
        { text: 'Audit of NBFCs is governed by directions issued by:', opts: ['ICAI', 'SEBI', 'RBI', 'Ministry of Finance'], ans: 2, explanation: 'The Reserve Bank of India (RBI) issues directions for NBFC audits.' },
        { text: 'Under SA 600, the Principal Auditor has a right to:', opts: ['Review Branch auditor workpapers', 'Visit the branch', 'Request information from branch auditor', 'Both 2 and 3'], ans: 3, explanation: 'Principal auditors can visit branches and request information but cannot mandate review of workpapers unless required.' }
    ],
    "Direct Tax Laws & International Taxation": [
        { text: 'Significant Economic Presence (SEP) threshold for digital transactions is:', opts: ['₹1 Crore', '₹2 Crore', '₹5 Crore', '₹50 Lakh'], ans: 1, explanation: 'The SEP threshold is generally ₹2 Crores for aggregate payments.' },
        { text: 'Standard deduction for salaried employees under the new tax regime (2024) is:', opts: ['₹40,000', '₹50,000', '₹75,000', '₹2,50,000'], ans: 2, explanation: 'The standard deduction was increased to ₹75,000 in the 2024 budget.' },
        { text: 'The time limit for filing an updated return (Section 139(8A)) is:', opts: ['12 months', '24 months', '36 months', '9 months'], ans: 1, explanation: 'Updated returns can be filed within 24 months from the end of the relevant assessment year.' },
        { text: 'TDS on lottery winnings is at:', opts: ['10%', '20%', '30%', '5%'], ans: 2, explanation: 'Lottery winnings are subject to 30% TDS under Section 194B.' },
        { text: 'Base Erosion and Profit Shifting (BEPS) Action 13 relates to:', opts: ['Digital Economy', 'Hybrid Mismatch', 'Country-by-Country Reporting', 'Transfer Pricing'], ans: 2, explanation: 'Action 13 focuses on standardized transfer pricing documentation (CbCR).' }
    ],
    "Indirect Tax Laws": [
        { text: 'Under GST, Time of Supply for goods is generally:', opts: ['Date of invoice', 'Date of payment', 'Date of delivery', 'Date of invoice or last date of issue'], ans: 3, explanation: 'TOS is determined by the date of invoice or the due date of invoice.' },
        { text: 'Place of Supply for service of admission to an event is:', opts: ['Location of supplier', 'Location of recipient', 'Where the event is held', 'Location of contract'], ans: 2, explanation: 'The location where the event is actually held is the POS.' },
        { text: 'Input Tax Credit (ITC) is blocked for:', opts: ['Office equipment', 'Personal food & beverages', 'Factory machines', 'Raw materials'], ans: 1, explanation: 'Section 17(5) blocks ITC for personal consumption items like food.' },
        { text: 'Composition scheme threshold for manufacturers is:', opts: ['₹1 Crore', '₹1.5 Crore', '₹2 Crore', '₹50 Lakh'], ans: 1, explanation: 'The limit is ₹1.5 Crores for most states.' },
        { text: 'IGST is levied on:', opts: ['Intra-state supplies', 'Inter-state supplies', 'Exempt supplies', 'None'], ans: 1, explanation: 'Integrated GST applies to interstate and import transactions.' }
    ],
    "Integrated Business Solutions": [
        { text: 'Integrated Business Solutions (Paper 6) is an:', opts: ['Closed book exam', 'Open book exam', 'Oral viva', 'Practical project'], ans: 1, explanation: 'Paper 6 is a multi-disciplinary case study based open-book exam.' },
        { text: 'Michael Porter\'s "Five Forces" model is used for:', opts: ['Risk assessment', 'Industry analysis', 'Cost accounting', 'Audit planning'], ans: 1, explanation: 'Its a framework to analyze competitive forces in an industry.' },
        { text: 'ESG reporting stands for:', opts: ['Economic, Social, Goods', 'Environmental, Social, Governance', 'Energy, Safety, Growth', 'Equity, Stability, Gains'], ans: 1, explanation: 'ESG focuses on Environmental, Social, and Governance factors.' },
        { text: 'A "Turnaround Strategy" is most appropriate when:', opts: ['Entering new markets', 'Company faces continuous losses', 'Acquiring a competitor', 'Issuing IPO'], ans: 1, explanation: 'Turnaround strategies aim to reverse decline in failing businesses.' },
        { text: 'Risk mitigation strategy of "Transfer" usually involves:', opts: ['Avoiding the project', 'Buying Insurance', 'Cost cutting', 'Accepting risk'], ans: 1, explanation: 'Transferring risk often involves shifting it to a third party like an insurer.' }
    ]
};

async function main() {
    console.log('🌱 Adding new ICAI MCQ tests...');

    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) {
        console.error('No ADMIN user found to associate exams with.');
        return;
    }

    for (const subject of CA_FINAL_SUBJECTS) {
        const questions = MCQ_BANK[subject] || [];
        if (questions.length === 0) continue;

        // Create 2 exams for each subject
        for (let i = 1; i <= 2; i++) {
            const exam = await prisma.exam.create({
                data: {
                    title: `${subject} - Practice Test 0${i}`,
                    description: `Standard MCQ practice test for ${subject} as per new ICAI scheme.`,
                    duration: 60,
                    totalMarks: questions.length,
                    passingMarks: Math.ceil(questions.length * 0.4),
                    category: "CA Final",
                    status: "PUBLISHED",
                    teacherId: admin.id,
                    createdAt: new Date(),
                }
            });

            for (let j = 0; j < questions.length; j++) {
                const q = questions[j];
                const question = await prisma.question.create({
                    data: {
                        text: q.text,
                        subject: subject,
                        type: "MCQ",
                        difficulty: j % 2 === 0 ? "MEDIUM" : "HARD",
                        explanation: q.explanation,
                        options: {
                            create: q.opts.map((opt, idx) => ({
                                text: opt,
                                isCorrect: idx === q.ans
                            }))
                        }
                    }
                });

                await prisma.examQuestion.create({
                    data: {
                        examId: exam.id,
                        questionId: question.id,
                        order: j + 1,
                        marks: 1
                    }
                });
            }
            console.log(`  ✓ Created: ${exam.title}`);
        }
    }

    console.log('✅ Seed complete!');
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
