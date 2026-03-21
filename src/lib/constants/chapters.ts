
export type LevelContent = {
    subjects: {
        name: string;
        dbMatch: string;
        chapters: string[];
    }[];
};

export const CA_FOUNDATION_CONTENT: LevelContent = {
    subjects: [
        {
            name: "Accounting",
            dbMatch: "Accounting",
            chapters: [
                "Theoretical Framework",
                "Accounting Process",
                "Bank Reconciliation Statement",
                "Inventories",
                "Depreciation and Amortisation",
                "Bills of Exchange and Promissory Notes",
                "Preparation of Final Accounts",
                "Financial Statements of NPOs",
                "Accounts from Incomplete Records",
                "Partnership and LLP Accounts",
                "Company Accounts"
            ]
        },
        {
            name: "Business Laws",
            dbMatch: "Legal",
            chapters: [
                "Indian Regulatory Framework",
                "Nature of Contracts",
                "Consideration",
                "Other Essential Elements",
                "Performance of Contract",
                "Breach of Contract",
                "Contingent and Quasi Contracts",
                "Contract of Indemnity and Guarantee",
                "Bailment and Pledge",
                "Agency",
                "Formation of the Contract of Sale",
                "Conditions & Warranties",
                "Transfer of Ownership",
                "Unpaid Seller",
                "General Nature of Partnership",
                "Relations of Partners",
                "Registration & Dissolution",
                "The LLP Act, 2008",
                "The Companies Act, 2013",
                "Negotiable Instruments Act, 1881"
            ]
        },
        {
            name: "Quantitative Aptitude",
            dbMatch: "Quantitative",
            chapters: [
                "Ratio, Proportion, Indices, Logarithms",
                "Equations",
                "Linear Inequalities",
                "Mathematics of Finance",
                "Permutations and Combinations",
                "Sequence and Series",
                "Sets, Relations and Functions",
                "Differential & Integral Calculus",
                "Number Series, Coding-Decoding",
                "Direction Sense Tests",
                "Seating Arrangements",
                "Blood Relations",
                "Statistical Description of Data",
                "Measures of Central Tendency",
                "Probability",
                "Theoretical Distributions",
                "Correlation and Regression",
                "Index Numbers"
            ]
        },
        {
            name: "Business Economics",
            dbMatch: "Economics",
            chapters: [
                "Nature & Scope of Economics",
                "Theory of Demand and Supply",
                "Theory of Production and Cost",
                "Price Determination in Markets",
                "Business Cycles",
                "Determination of National Income",
                "Public Finance",
                "Money Market",
                "International Trade",
                "Indian Economy"
            ]
        }
    ]
};

export const CA_INTER_CONTENT: LevelContent = {
    subjects: [
        { name: "Advanced Accounting", dbMatch: "Advanced Accounting", chapters: ["Accounting Standards", "Consolidated Financial Statements", "Partnership Accounts", "Buyback of Shares"] },
        { name: "Corporate and Other Laws", dbMatch: "Law", chapters: ["Companies Act", "Negotiable Instruments", "General Clauses", "Interpretation of Statutes"] },
        { name: "Taxation", dbMatch: "Tax", chapters: ["Income Tax", "GST", "Heads of Income", "Exemptions"] },
        { name: "Cost and Management Accounting", dbMatch: "Costing", chapters: ["Material Cost", "Labor Cost", "Overheads", "Standard Costing"] },
        { name: "Auditing and Ethics", dbMatch: "Auditing", chapters: ["Audit Process", "Audit Report", "Ethics", "Company Audit"] },
        { name: "Financial Management and Strategic Management", dbMatch: "FM SM", chapters: ["Capital Budgeting", "Cost of Capital", "Strategic Analysis", "Strategic Implementation"] }
    ]
};

export const CA_FINAL_CONTENT: LevelContent = {
    subjects: [
        { name: "Financial Reporting", dbMatch: "Financial Reporting", chapters: ["Ind AS 115", "Ind AS 116", "Business Combinations", "Consolidated Financial Statements"] },
        { name: "Advanced Financial Management", dbMatch: "AFM", chapters: ["Foreign Exchange Risk", "Derivatives", "Portfolio Management", "Mergers and Acquisitions"] },
        { name: "Advanced Auditing, Assurance and Professional Ethics", dbMatch: "Auditing", chapters: ["Professional Ethics", "Audit of Banking Companies", "Audit of Non-Banking Financial Companies", "Specialized Audits"] },
        { name: "Direct Tax Laws & International Taxation", dbMatch: "Direct Tax", chapters: ["Transfer Pricing", "Double Taxation Avoidance", "Assessment Procedure", "Trusts"] },
        { name: "Indirect Tax Laws", dbMatch: "Indirect Tax", chapters: ["GST Supply", "Input Tax Credit", "Customs Duty", "Export and Import under GST"] },
        { name: "Integrated Business Solutions", dbMatch: "IBS", chapters: ["Case Study Analysis", "Multi-disciplinary Issues", "Strategic Decision Making"] }
    ]
};
