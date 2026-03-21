export type PublicResource = {
    id: string;
    title: string;
    description: string | null;
    fileUrl: string;
    fileType: string;
    category: string;
    subType: string;
    providerType: string;
    downloads: number;
    shareCount: number;
    rating: number;
    isTrending: boolean;
    author: string;
    createdAt: Date;
    authorId: string | null;
    specialty: string;
    date: string;
};

export type PublicResourceFilters = {
    category?: string;
    subType?: string;
    isTrending?: boolean;
    search?: string;
};

export type PublicResourceCatalogInsight = {
    totalResources: number;
    trendingResources: number;
    categories: string[];
    topSubTypes: { name: string; count: number }[];
    topSubjects: string[];
    highlightedChapters: string[];
};
