export type AdminMetrics = {
    students: number;
    teachers: number;
    batches: number;
    exams: number;
    mcqs: number;
    resources: number;
    downloads: number;
    attempts: number;
};

export type AdminMetricsData = {
    metrics: AdminMetrics;
    recentUsers: {
        id: string;
        fullName: string | null;
        email: string | null;
        createdAt: Date;
        role: string;
    }[];
    recentSubscriptions?: any[];
    timestamp: string;
};
