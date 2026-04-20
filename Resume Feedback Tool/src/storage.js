const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "submissions.json");

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch (error) {
    await fs.writeFile(DATA_FILE, JSON.stringify({ submissions: [] }, null, 2));
  }
}

async function readStore() {
  await ensureStore();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  const parsed = JSON.parse(raw);
  parsed.submissions = Array.isArray(parsed.submissions) ? parsed.submissions : [];
  return parsed;
}

async function writeStore(store) {
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2));
}

function toSummary(record) {
  return {
    id: record.id,
    version: record.version || 1,
    reviewerName: record.reviewerName || "",
    ownerEmail: record.userEmail || "legacy-unowned",
    ownerRole: record.userRole || "legacy",
    candidateName: record.submission.candidateName,
    targetRole: record.submission.targetRole,
    experienceLevel: record.submission.experienceLevel,
    overallScore: record.analysis.overallScore,
    fitBand: record.analysis.fitBand,
    createdAt: record.createdAt,
    summary: record.analysis.summary,
    jdMatchScore: record.analysis.metrics?.jdMatchScore ?? record.analysis.jdMatch?.score ?? 0,
    topGap: record.analysis.priorityFixes?.[0]?.area || record.analysis.keywordGaps?.[0] || "None"
  };
}

function canAccessRecord(record, viewer) {
  if (!viewer) {
    return false;
  }

  if (viewer.role === "developer") {
    return true;
  }

  return record.userId === viewer.id;
}

function filterVisibleRecords(records, viewer) {
  return records.filter((record) => canAccessRecord(record, viewer));
}

async function listSubmissions(viewer) {
  const store = await readStore();
  return filterVisibleRecords(store.submissions, viewer)
    .slice()
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .map(toSummary);
}

async function getSubmission(id, viewer) {
  if (!id) {
    return null;
  }

  const store = await readStore();
  const record = store.submissions.find((submission) => submission.id === id) || null;
  return record && canAccessRecord(record, viewer) ? record : null;
}

async function createSubmission({ submission, analysis, user }) {
  const store = await readStore();
  const candidateName = String(submission.candidateName).trim();
  const targetRole = String(submission.targetRole).trim();
  const version =
    store.submissions.filter(
      (record) =>
        record.userId === user.id &&
        record.submission?.candidateName?.toLowerCase() === candidateName.toLowerCase() &&
        record.submission?.targetRole?.toLowerCase() === targetRole.toLowerCase()
    ).length + 1;

  const record = {
    id: crypto.randomUUID(),
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    version,
    reviewerName: String(submission.reviewerName || "").trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    submission: {
      candidateName,
      email: String(submission.email || "").trim(),
      targetRole,
      experienceLevel: String(submission.experienceLevel).trim(),
      resumeFileName: String(submission.resumeFileName || "").trim(),
      portfolioUrl: String(submission.portfolioUrl || "").trim(),
      githubUrl: String(submission.githubUrl || "").trim(),
      jobDescription: String(submission.jobDescription || "").trim(),
      resumeText: String(submission.resumeText).trim()
    },
    analysis
  };

  store.submissions.unshift(record);
  await writeStore(store);
  return record;
}

async function updateSubmission(id, { submission, analysis, user }) {
  const store = await readStore();
  const index = store.submissions.findIndex((record) => record.id === id);

  if (index === -1 || !canAccessRecord(store.submissions[index], user)) {
    return null;
  }

  const previous = store.submissions[index];
  const updated = {
    ...previous,
    updatedAt: new Date().toISOString(),
    reviewerName: String(submission.reviewerName || previous.reviewerName || "").trim(),
    submission: {
      candidateName: String(submission.candidateName || previous.submission.candidateName).trim(),
      email: String(submission.email || "").trim(),
      targetRole: String(submission.targetRole || previous.submission.targetRole).trim(),
      experienceLevel: String(submission.experienceLevel || previous.submission.experienceLevel).trim(),
      resumeFileName: String(submission.resumeFileName || "").trim(),
      portfolioUrl: String(submission.portfolioUrl || "").trim(),
      githubUrl: String(submission.githubUrl || "").trim(),
      jobDescription: String(submission.jobDescription || "").trim(),
      resumeText: String(submission.resumeText || "").trim()
    },
    analysis
  };

  store.submissions[index] = updated;
  await writeStore(store);
  return updated;
}

async function deleteSubmission(id) {
  throw new Error("deleteSubmission requires a viewer. Use deleteSubmissionForUser instead.");
}

async function deleteSubmissionForUser(id, viewer) {
  const store = await readStore();
  const initialCount = store.submissions.length;
  store.submissions = store.submissions.filter((record) => record.id !== id || !canAccessRecord(record, viewer));

  if (store.submissions.length === initialCount) {
    return false;
  }

  await writeStore(store);
  return true;
}

async function listProfiles(viewer) {
  const store = await readStore();
  const visibleSubmissions = filterVisibleRecords(store.submissions, viewer);
  const profileMap = new Map();

  visibleSubmissions.forEach((record) => {
    const key = record.submission.candidateName.toLowerCase();
    const current = profileMap.get(key) || {
      candidateName: record.submission.candidateName,
      roles: new Set(),
      reviews: 0,
      bestScore: 0,
      latestReview: record.createdAt
    };

    current.roles.add(record.submission.targetRole);
    current.reviews += 1;
    current.bestScore = Math.max(current.bestScore, record.analysis.overallScore || 0);
    current.latestReview =
      new Date(record.createdAt) > new Date(current.latestReview) ? record.createdAt : current.latestReview;
    profileMap.set(key, current);
  });

  return [...profileMap.values()]
    .map((profile) => ({
      ...profile,
      roles: [...profile.roles]
    }))
    .sort((left, right) => new Date(right.latestReview) - new Date(left.latestReview));
}

async function getAnalytics(viewer) {
  const store = await readStore();
  const submissions = filterVisibleRecords(store.submissions, viewer);
  const scores = submissions.map((record) => record.analysis.overallScore || 0);
  const averageScore = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
  const bestRecord = submissions.slice().sort((left, right) => (right.analysis.overallScore || 0) - (left.analysis.overallScore || 0))[0];
  const issueCounts = {};
  const categoryTotals = {};

  submissions.forEach((record) => {
    (record.analysis.priorityFixes || []).forEach((fix) => {
      issueCounts[fix.area] = (issueCounts[fix.area] || 0) + 1;
    });
    (record.analysis.categoryScores || []).forEach((category) => {
      categoryTotals[category.label] = categoryTotals[category.label] || { total: 0, count: 0 };
      categoryTotals[category.label].total += category.score || 0;
      categoryTotals[category.label].count += 1;
    });
  });

  const commonIssues = Object.entries(issueCounts)
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 6);
  const categoryAverages = Object.entries(categoryTotals).map(([label, value]) => ({
    label,
    score: Math.round(value.total / value.count)
  }));

  return {
    totalReviews: submissions.length,
    averageScore,
    highestScore: bestRecord?.analysis.overallScore || 0,
    bestCandidate: bestRecord?.submission.candidateName || "No data",
    bestCandidateRole: bestRecord?.submission.targetRole || "",
    commonIssues,
    categoryAverages,
    profiles: await listProfiles(viewer)
  };
}

module.exports = {
  createSubmission,
  deleteSubmission: deleteSubmissionForUser,
  getAnalytics,
  getSubmission,
  listProfiles,
  listSubmissions,
  updateSubmission
};
