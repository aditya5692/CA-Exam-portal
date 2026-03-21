import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPublicResourceCatalog,
  calculatePublicResourceRank,
  inferPublicResourceMetadata,
} from "../../src/lib/server/resource-intelligence";

const baseResource = {
  id: "res-1",
  title: "CA Final Ind AS 116 Revision Pack",
  description: "Focused revision notes for lease accounting.",
  fileUrl: "/demo.pdf",
  fileType: "PDF",
  category: "CA Final",
  subType: "RTP",
  providerType: "ICAI",
  downloads: 120,
  shareCount: 18,
  rating: 4.9,
  isTrending: true,
  createdAt: new Date("2026-03-01T00:00:00.000Z"),
  uploadedBy: {
    id: "teacher-1",
    fullName: "Faculty One",
    designation: "CA",
    expertise: "Financial Reporting",
  },
};

test("inferPublicResourceMetadata detects level, subject, and chapter matches", () => {
  const metadata = inferPublicResourceMetadata(baseResource);

  assert.equal(metadata.level, "CA Final");
  assert.equal(metadata.subject, "Financial Reporting");
  assert.equal(metadata.chapter, "Ind AS 116");
});

test("calculatePublicResourceRank rewards exact title and metadata matches", () => {
  const rank = calculatePublicResourceRank(
    baseResource,
    { search: "Ind AS 116", category: "CA Final" },
    inferPublicResourceMetadata(baseResource),
    new Date("2026-03-10T00:00:00.000Z"),
  );

  assert.equal(rank.matchesSearch, true);
  assert.ok(rank.score > 70);
});

test("buildPublicResourceCatalog sorts higher-value matches first", () => {
  const results = buildPublicResourceCatalog(
    [
      {
        ...baseResource,
        id: "res-2",
        title: "Generic Accounting Notes",
        isTrending: false,
        downloads: 4,
        shareCount: 0,
        rating: 4.1,
      },
      baseResource,
    ],
    { search: "Ind AS 116" },
    new Date("2026-03-10T00:00:00.000Z"),
  );

  assert.equal(results[0]?.id, "res-1");
});
