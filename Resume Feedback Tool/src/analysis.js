const ROLE_KEYWORDS = {
  default: [
    "collaboration",
    "communication",
    "leadership",
    "problem solving",
    "stakeholder",
    "delivery",
    "ownership",
    "results"
  ],
  "full stack": [
    "javascript",
    "typescript",
    "react",
    "node",
    "api",
    "database",
    "testing",
    "deployment",
    "sql",
    "aws"
  ],
  frontend: [
    "react",
    "typescript",
    "javascript",
    "css",
    "responsive",
    "figma",
    "accessibility",
    "performance",
    "state management",
    "testing"
  ],
  backend: [
    "node",
    "api",
    "microservices",
    "sql",
    "database",
    "authentication",
    "performance",
    "redis",
    "aws",
    "testing"
  ],
  "data analyst": [
    "sql",
    "excel",
    "dashboard",
    "python",
    "power bi",
    "visualization",
    "forecasting",
    "insights",
    "stakeholder",
    "reporting"
  ],
  devops: [
    "ci/cd",
    "docker",
    "kubernetes",
    "aws",
    "monitoring",
    "infrastructure",
    "automation",
    "terraform",
    "linux",
    "security"
  ]
};

const ACTION_VERBS = [
  "built",
  "created",
  "designed",
  "developed",
  "delivered",
  "implemented",
  "improved",
  "launched",
  "led",
  "optimized",
  "reduced",
  "scaled",
  "shipped",
  "streamlined"
];

const SECTION_RULES = [
  { key: "summary", label: "Summary", patterns: ["summary", "profile", "objective"] },
  { key: "skills", label: "Skills", patterns: ["skills", "tech stack", "tools"] },
  { key: "experience", label: "Experience", patterns: ["experience", "work history", "employment"] },
  { key: "projects", label: "Projects", patterns: ["projects", "project experience"] },
  { key: "education", label: "Education", patterns: ["education", "academics", "qualification"] },
  { key: "certifications", label: "Certifications", patterns: ["certification", "certifications", "licenses"] }
];

const METRIC_PATTERN =
  /\b\d+(?:\.\d+)?%|\$\s?\d[\d,]*(?:\.\d+)?|\b\d+x\b|\b\d+\+?\s?(?:users|clients|days|weeks|months|hours|projects|features|engineers|students|customers|tickets|requests|deployments|screens|modules|teams)\b/gi;

const PRIORITY_WEIGHT = {
  high: 3,
  medium: 2,
  low: 1
};

const SKILL_BANK = [
  "javascript",
  "typescript",
  "react",
  "node",
  "express",
  "api",
  "rest api",
  "sql",
  "postgresql",
  "mongodb",
  "aws",
  "docker",
  "kubernetes",
  "testing",
  "jest",
  "figma",
  "accessibility",
  "performance",
  "authentication",
  "microservices",
  "redis",
  "python",
  "excel",
  "power bi",
  "dashboard",
  "visualization",
  "forecasting",
  "financial modelling",
  "business analytics",
  "stakeholder",
  "reporting",
  "risk analysis",
  "data analysis",
  "communication",
  "leadership",
  "collaboration",
  "problem solving"
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function round(value) {
  return Math.round(value);
}

function toSentenceCase(value) {
  if (!value) {
    return "";
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function normalizeWhitespace(value = "") {
  return value.replace(/\r/g, "").trim();
}

function normalizeLine(value = "") {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+#/.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countMatches(text, pattern) {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

function getWordCount(text = "") {
  return (text.match(/[A-Za-z0-9+#/.%-]+/g) || []).length;
}

function hasMetricContent(text = "") {
  METRIC_PATTERN.lastIndex = 0;
  return METRIC_PATTERN.test(text);
}

function isBulletLine(line = "") {
  return /^([*-]|\d+\.)\s+/.test(line);
}

function stripBulletPrefix(line = "") {
  return line.replace(/^([*-]|\d+\.)\s+/, "").trim();
}

function startsWithActionVerb(line = "") {
  const normalized = normalizeLine(stripBulletPrefix(line));
  return ACTION_VERBS.some((verb) => normalized.startsWith(verb));
}

function getSeverityLabel(severity) {
  if (severity === "high") {
    return "High priority";
  }
  if (severity === "medium") {
    return "Medium priority";
  }
  return "Low priority";
}

function isEarlyCareer(experienceLevel = "") {
  return ["student", "fresher", "junior"].includes(normalizeLine(experienceLevel));
}

function inferRoleKeywords(targetRole = "", jobDescription = "") {
  const combined = `${targetRole} ${jobDescription}`.toLowerCase();

  if (combined.includes("full stack") || combined.includes("full-stack")) {
    return ROLE_KEYWORDS["full stack"];
  }
  if (combined.includes("frontend") || combined.includes("front end")) {
    return ROLE_KEYWORDS.frontend;
  }
  if (combined.includes("backend") || combined.includes("back end")) {
    return ROLE_KEYWORDS.backend;
  }
  if (combined.includes("data analyst") || combined.includes("analyst")) {
    return ROLE_KEYWORDS["data analyst"];
  }
  if (combined.includes("devops")) {
    return ROLE_KEYWORDS.devops;
  }

  return ROLE_KEYWORDS.default;
}

function findSectionHeading(line) {
  const normalized = normalizeLine(line);
  if (!normalized || normalized.split(" ").length > 6 || normalized.length > 48) {
    return null;
  }

  return (
    SECTION_RULES.find((section) =>
      section.patterns.some(
        (pattern) =>
          normalized === pattern ||
          normalized.startsWith(`${pattern} `) ||
          normalized.endsWith(` ${pattern}`) ||
          normalized.includes(pattern)
      )
    ) || null
  );
}

function extractSectionBlocks(resumeText) {
  const lines = normalizeWhitespace(resumeText)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const resumeLower = resumeText.toLowerCase();
  const sectionsByKey = Object.fromEntries(
    SECTION_RULES.map((section) => [
      section.key,
      {
        key: section.key,
        label: section.label,
        present: false,
        lines: []
      }
    ])
  );
  let currentSection = null;

  lines.forEach((line) => {
    const matchedSection = findSectionHeading(line);
    if (matchedSection) {
      currentSection = matchedSection.key;
      sectionsByKey[currentSection].present = true;
      return;
    }

    if (currentSection) {
      sectionsByKey[currentSection].lines.push(line);
    }
  });

  return SECTION_RULES.map((section) => {
    const content = sectionsByKey[section.key].lines.join(" ");
    const fallbackPresent = section.patterns.some((pattern) => resumeLower.includes(pattern));

    return {
      key: section.key,
      label: section.label,
      present: sectionsByKey[section.key].present || fallbackPresent,
      lines: sectionsByKey[section.key].lines,
      content
    };
  });
}

function buildStrengths(metrics, sectionFeedback) {
  const strengths = [];
  const strongSections = sectionFeedback.filter((section) => section.status === "strong" || section.status === "good");

  if (metrics.sectionCount >= 4) {
    strengths.push("The resume covers the core sections recruiters expect, which improves scan quality.");
  }
  if (metrics.measurableAchievements >= 3) {
    strengths.push("There are measurable outcomes present, which makes the profile more credible.");
  }
  if (metrics.keywordCoverage >= 60) {
    strengths.push("The resume aligns well with the selected target role and should match better in ATS filters.");
  }
  if (metrics.actionVerbLines >= 4) {
    strengths.push("Several bullets already use action-led language, which makes the profile read more confidently.");
  }
  if (metrics.hasLinks) {
    strengths.push("Proof-of-work links are included, which strengthens validation for technical roles.");
  }
  if (strongSections.length >= 3) {
    strengths.push(`Sections like ${strongSections.slice(0, 3).map((section) => section.label).join(", ")} are already in solid shape.`);
  }

  if (strengths.length === 0) {
    strengths.push("The resume has a workable foundation and can improve quickly with a few focused edits.");
  }

  return strengths.slice(0, 5);
}

function buildImprovements(priorityFixes) {
  return priorityFixes.slice(0, 5).map((fix) => `${fix.area}: ${fix.action}`);
}

function buildNextSteps(priorityFixes, missingKeywords) {
  const nextSteps = priorityFixes.slice(0, 4).map((fix) => `${fix.severityLabel}: ${fix.action}`);

  if (nextSteps.length < 4 && missingKeywords.length > 0) {
    nextSteps.push(`Add missing but true keywords in the most relevant sections: ${missingKeywords.slice(0, 5).join(", ")}.`);
  }

  return nextSteps.slice(0, 4);
}

function createCategoryScores(metrics) {
  const structure = clamp(
    round(40 + metrics.sectionCount * 8 + (metrics.hasEmail ? 4 : 0) + (metrics.hasPhone ? 4 : 0)),
    0,
    100
  );

  const impact = clamp(
    round(25 + metrics.actionVerbLines * 8 + metrics.measurableAchievements * 10 + Math.min(metrics.bulletCount, 10) * 2),
    0,
    100
  );

  const skills = clamp(
    round(
      30 +
        (metrics.hasSkillsSection ? 20 : 0) +
        (metrics.hasProjectsSection ? 15 : 0) +
        (metrics.hasLinks ? 10 : 0) +
        metrics.keywordCoverage * 0.25
    ),
    0,
    100
  );

  const atsReadiness = clamp(
    round(
      70 +
        (metrics.hasEmail ? 8 : -12) +
        (metrics.hasPhone ? 6 : -10) +
        (metrics.hasTableCharacters ? -12 : 4) +
        (metrics.firstPersonMentions > 0 ? -6 : 6) +
        (metrics.wordCount < 220 || metrics.wordCount > 900 ? -10 : 6)
    ),
    0,
    100
  );

  const roleAlignment = clamp(round(20 + metrics.keywordCoverage * 0.8 + (metrics.jobDescriptionProvided ? 10 : 0)), 0, 100);

  return [
    {
      key: "structure",
      label: "Structure",
      score: structure,
      summary: "Section coverage, contact clarity, and scanning flow."
    },
    {
      key: "impact",
      label: "Impact",
      score: impact,
      summary: "Evidence of outcomes, action verbs, and quantified wins."
    },
    {
      key: "skills",
      label: "Skills",
      score: skills,
      summary: "Technical stack visibility, project proof, and supporting links."
    },
    {
      key: "ats",
      label: "ATS Readiness",
      score: atsReadiness,
      summary: "Formatting hygiene and machine-readable resume structure."
    },
    {
      key: "alignment",
      label: "Role Alignment",
      score: roleAlignment,
      summary: "How well the resume reflects the selected target role."
    }
  ];
}

function createSectionResult(section, score, summary, suggestions, checks, whereToImprove, optional = false) {
  let status = "needs-work";

  if (optional && !section.present) {
    status = "optional";
  } else if (!section.present) {
    status = "missing";
  } else if (score >= 80) {
    status = "strong";
  } else if (score >= 60) {
    status = "good";
  }

  return {
    key: section.key,
    label: section.label,
    present: section.present,
    score,
    status,
    summary,
    whereToImprove,
    checks,
    suggestions: suggestions.slice(0, 4)
  };
}

function analyzeSummarySection(section, metrics, submission, keywords, missingKeywords) {
  if (!section.present) {
    return createSectionResult(
      section,
      0,
      "A summary is missing, so the resume does not open with a clear value proposition.",
      [
        "Add a 2-4 line summary that combines target role, years of experience, strongest stack, and business impact.",
        "Open with the value you bring, not a generic career objective."
      ],
      ["No dedicated summary section detected."],
      "Top of the resume"
    );
  }

  const wordCount = getWordCount(section.content);
  const summaryLower = section.content.toLowerCase();
  const mentionedKeywords = keywords.filter((keyword) => summaryLower.includes(keyword.toLowerCase())).length;
  const suggestions = [];
  const checks = [];
  let score = 48;

  if (wordCount >= 28 && wordCount <= 80) {
    score += 18;
    checks.push("Length is in a recruiter-friendly range.");
  } else {
    score += 6;
    suggestions.push("Keep the summary between 2 and 4 lines so it stays skimmable.");
    checks.push("Length needs tightening.");
  }

  if (mentionedKeywords >= 2) {
    score += 18;
    checks.push("The summary already reflects role-relevant keywords.");
  } else {
    suggestions.push(
      `Mention the target role and 2-3 role signals such as ${missingKeywords.slice(0, 3).join(", ") || keywords.slice(0, 3).join(", ")}.`
    );
  }

  if (metrics.firstPersonMentions === 0) {
    score += 6;
  } else {
    suggestions.push("Avoid first-person language and keep the summary achievement-focused.");
  }

  if (!/year|experience|developer|engineer|analyst|specialist|building|delivering/i.test(section.content)) {
    suggestions.push("State your experience level and the kind of problems or systems you build.");
  }

  return createSectionResult(
    section,
    clamp(score, 0, 100),
    wordCount >= 28 && mentionedKeywords >= 2
      ? "The summary gives a clear opening snapshot of role fit and technical direction."
      : "The summary exists, but it could sell the candidate faster with stronger role positioning and clearer impact.",
    suggestions,
    checks,
    "Summary section"
  );
}

function analyzeSkillsSection(section, keywords, missingKeywords) {
  if (!section.present) {
    return createSectionResult(
      section,
      0,
      "A dedicated skills section is missing, which makes the technical stack harder to scan quickly.",
      [
        "Add a dedicated skills section grouped by languages, frontend, backend, databases, cloud, and testing tools.",
        `Include true role keywords such as ${missingKeywords.slice(0, 4).join(", ") || keywords.slice(0, 4).join(", ")} where appropriate.`
      ],
      ["No dedicated skills section detected."],
      "Skills section"
    );
  }

  const contentLower = section.content.toLowerCase();
  const matchedKeywords = keywords.filter((keyword) => contentLower.includes(keyword.toLowerCase())).length;
  const suggestions = [];
  const checks = [];
  let score = 42;

  if (matchedKeywords >= 4) {
    score += 28;
    checks.push("The skills section reflects the target stack well.");
  } else {
    score += matchedKeywords * 5;
    suggestions.push(
      `Expand the stack with role-relevant tools you can defend, especially ${missingKeywords.slice(0, 4).join(", ") || keywords.slice(0, 4).join(", ")}.`
    );
  }

  if (section.content.length >= 40) {
    score += 12;
  } else {
    suggestions.push("Separate skills into clearer groups instead of leaving them too short or vague.");
  }

  if (!/,|\/|\|/.test(section.content)) {
    suggestions.push("Use grouped lists or separators so the section is faster to scan.");
  }

  return createSectionResult(
    section,
    clamp(score, 0, 100),
    matchedKeywords >= 4
      ? "The skills section gives recruiters a strong view of the technical toolkit."
      : "The skills section is present, but it needs stronger role alignment and clearer grouping.",
    suggestions,
    checks,
    "Skills section"
  );
}

function analyzeExperienceSection(section) {
  if (!section.present) {
    return createSectionResult(
      section,
      0,
      "Experience is missing, which makes it difficult to assess ownership, delivery, and business impact.",
      [
        "Add a work experience section with role, company, dates, and 3-5 bullet points per role.",
        "Lead every bullet with an action verb and finish with a measurable outcome whenever possible."
      ],
      ["No experience section detected."],
      "Experience section"
    );
  }

  const bulletLines = section.lines.filter(isBulletLine);
  const actionVerbLines = bulletLines.filter(startsWithActionVerb);
  const measurableAchievements = countMatches(section.content, METRIC_PATTERN);
  const suggestions = [];
  const checks = [];
  let score = 42;

  if (bulletLines.length >= 4) {
    score += 18;
    checks.push("There are enough bullets to describe impact, ownership, and tools.");
  } else {
    suggestions.push("Add more outcome-focused bullets so each role feels complete.");
  }

  if (actionVerbLines.length >= 3) {
    score += 18;
    checks.push("Action-oriented bullet starts are helping the section read more decisively.");
  } else {
    suggestions.push("Start more bullets with strong action verbs such as built, improved, optimized, or launched.");
  }

  if (measurableAchievements >= 2) {
    score += 24;
    checks.push("Quantified wins make the impact more credible.");
  } else {
    suggestions.push("Add measurable outcomes like latency reduced, users served, revenue influenced, or time saved.");
  }

  if (!/react|node|sql|aws|api|python|testing|figma|docker|kubernetes/i.test(section.content)) {
    suggestions.push("Mention tools and systems directly inside experience bullets so the work feels concrete.");
  }

  return createSectionResult(
    section,
    clamp(score, 0, 100),
    measurableAchievements >= 2
      ? "The experience section shows direction and some proof of impact."
      : "The experience section exists, but it needs stronger evidence of outcomes and clearer technical detail.",
    suggestions,
    checks,
    "Work experience bullets"
  );
}

function analyzeProjectsSection(section, submission) {
  const earlyCareer = isEarlyCareer(submission.experienceLevel);

  if (!section.present) {
    return createSectionResult(
      section,
      earlyCareer ? 0 : 35,
      earlyCareer
        ? "Projects are missing, which matters more for early-career candidates who need proof of ownership."
        : "Projects are optional at this level, but strong projects can still improve technical proof.",
      [
        "Add 1-2 strong projects with the problem, stack, implementation scope, and measurable result.",
        "Include GitHub or live links if they strengthen credibility."
      ],
      [earlyCareer ? "No projects section detected for an early-career profile." : "Projects section is optional but currently absent."],
      "Projects section",
      !earlyCareer
    );
  }

  const projectBullets = section.lines.filter(isBulletLine);
  const measurableAchievements = countMatches(section.content, METRIC_PATTERN);
  const suggestions = [];
  const checks = [];
  let score = 44;

  if (section.lines.length >= 2) {
    score += 14;
    checks.push("The section has enough space to show more than one project detail.");
  } else {
    suggestions.push("Describe each project with a clearer scope, stack, and outcome.");
  }

  if (/react|node|express|sql|mongodb|aws|api|typescript|python|docker|figma/i.test(section.content)) {
    score += 18;
    checks.push("The project section already includes technical context.");
  } else {
    suggestions.push("Mention the stack used in each project so the technical depth is visible.");
  }

  if (projectBullets.length >= 2 || measurableAchievements >= 1) {
    score += 16;
  } else {
    suggestions.push("Add a result for each project such as users served, speed gains, accuracy gains, or delivery outcomes.");
  }

  return createSectionResult(
    section,
    clamp(score, 0, 100),
    measurableAchievements >= 1
      ? "Projects help show applied technical ownership beyond job titles."
      : "Projects are present, but they still read more like descriptions than proof of impact.",
    suggestions,
    checks,
    "Projects section"
  );
}

function analyzeEducationSection(section) {
  if (!section.present) {
    return createSectionResult(
      section,
      0,
      "Education is missing, so the resume does not show academic foundation or qualification context.",
      [
        "Add degree, institution, and graduation timeline.",
        "Include coursework, CGPA, or honors only if they strengthen the profile."
      ],
      ["No education section detected."],
      "Education section"
    );
  }

  const suggestions = [];
  const checks = [];
  let score = 56;

  if (getWordCount(section.content) >= 6) {
    score += 18;
    checks.push("Education details look substantial enough for a quick recruiter scan.");
  } else {
    suggestions.push("Add degree, institute, and expected or completed graduation year.");
  }

  if (/\b(b\.tech|btech|bachelor|master|m\.tech|mba|university|college)\b/i.test(section.content)) {
    score += 12;
  } else {
    suggestions.push("Clarify the qualification name so the academic background is immediately obvious.");
  }

  return createSectionResult(
    section,
    clamp(score, 0, 100),
    "Education is present and contributes to completeness, though it only needs essential detail.",
    suggestions,
    checks,
    "Education section"
  );
}

function analyzeCertificationsSection(section, submission, keywords) {
  const roleNeedsCertification = /aws|cloud|devops|data|security/.test(
    `${submission.targetRole} ${keywords.join(" ")}`.toLowerCase()
  );

  if (!section.present) {
    return createSectionResult(
      section,
      roleNeedsCertification ? 35 : 50,
      roleNeedsCertification
        ? "Relevant certifications could strengthen this target role, especially if they support cloud or data credibility."
        : "Certifications are optional for this profile and not a blocker.",
      [
        roleNeedsCertification
          ? "Add relevant certifications if you have them, especially ones that reinforce the target stack."
          : "Only add certifications if they are relevant and recent."
      ],
      [roleNeedsCertification ? "No certifications section detected for a certification-friendly role." : "Certifications section is optional."],
      "Certifications section",
      !roleNeedsCertification
    );
  }

  return createSectionResult(
    section,
    78,
    "Certifications add extra credibility and help show commitment to the domain.",
    ["Keep only certifications that are relevant to the target role and still current."],
    ["Certifications are visible."],
    "Certifications section"
  );
}

function createSectionFeedback(sections, metrics, submission, keywords, missingKeywords) {
  const sectionMap = Object.fromEntries(sections.map((section) => [section.key, section]));

  return [
    analyzeSummarySection(sectionMap.summary, metrics, submission, keywords, missingKeywords),
    analyzeSkillsSection(sectionMap.skills, keywords, missingKeywords),
    analyzeExperienceSection(sectionMap.experience),
    analyzeProjectsSection(sectionMap.projects, submission),
    analyzeEducationSection(sectionMap.education),
    analyzeCertificationsSection(sectionMap.certifications, submission, keywords)
  ];
}

function buildChecklist(metrics, sectionFeedback) {
  const summarySection = sectionFeedback.find((section) => section.key === "summary");

  return [
    {
      label: "Email is present",
      status: metrics.hasEmail ? "pass" : "fail",
      detail: metrics.hasEmail ? "Contact details are available." : "Add a professional email near the top of the resume."
    },
    {
      label: "Phone number is present",
      status: metrics.hasPhone ? "pass" : "fail",
      detail: metrics.hasPhone ? "Recruiters can contact the candidate directly." : "Add a phone number in the header."
    },
    {
      label: "Summary is opening with a value proposition",
      status: summarySection?.status === "strong" || summarySection?.status === "good" ? "pass" : summarySection?.present ? "warn" : "fail",
      detail:
        summarySection?.status === "strong" || summarySection?.status === "good"
          ? "The resume opens with a meaningful snapshot."
          : summarySection?.present
            ? "The summary exists but needs sharper positioning."
            : "Add a short summary to position the profile quickly."
    },
    {
      label: "Skills section is visible",
      status: metrics.hasSkillsSection ? "pass" : "fail",
      detail: metrics.hasSkillsSection ? "Core tools are easier to scan." : "Add a dedicated skills section."
    },
    {
      label: "At least 3 quantified achievements are included",
      status: metrics.measurableAchievements >= 3 ? "pass" : metrics.measurableAchievements >= 1 ? "warn" : "fail",
      detail:
        metrics.measurableAchievements >= 3
          ? "Impact is backed by numbers."
          : "Add more measurable outcomes to strengthen credibility."
    },
    {
      label: "Role keywords are aligned to the target role",
      status: metrics.keywordCoverage >= 65 ? "pass" : metrics.keywordCoverage >= 45 ? "warn" : "fail",
      detail:
        metrics.keywordCoverage >= 65
          ? "Role alignment is strong."
          : "Mirror more role keywords where they are genuinely true."
    },
    {
      label: "Resume length is in a recruiter-friendly range",
      status: metrics.wordCount >= 220 && metrics.wordCount <= 900 ? "pass" : "warn",
      detail:
        metrics.wordCount >= 220 && metrics.wordCount <= 900
          ? "Length should be easy to review quickly."
          : "Trim or expand the resume to keep it focused and scannable."
    },
    {
      label: "Proof-of-work links are included",
      status: metrics.hasLinks ? "pass" : "warn",
      detail: metrics.hasLinks ? "Portfolio, GitHub, or public links are available." : "Add GitHub, portfolio, or LinkedIn if relevant."
    }
  ];
}

function buildAtsWarnings(metrics, missingKeywords) {
  const warnings = [];

  if (!metrics.hasEmail || !metrics.hasPhone) {
    warnings.push({
      severity: "high",
      title: "Missing contact details",
      detail: "ATS and recruiters should see both email and phone number immediately in the header."
    });
  }

  if (metrics.keywordCoverage < 55) {
    warnings.push({
      severity: "high",
      title: "Low keyword alignment",
      detail: `The resume is missing important role signals such as ${missingKeywords.slice(0, 4).join(", ") || "role-specific terms"}.`
    });
  }

  if (metrics.hasTableCharacters) {
    warnings.push({
      severity: "medium",
      title: "Potential ATS formatting issue",
      detail: "Heavy table-like dividers or visual separators can reduce parsing quality in some systems."
    });
  }

  if (metrics.wordCount < 220 || metrics.wordCount > 900) {
    warnings.push({
      severity: "medium",
      title: "Resume length may hurt scan speed",
      detail: "Try to keep the resume concise enough for a fast review while preserving strong evidence."
    });
  }

  if (metrics.firstPersonMentions > 0) {
    warnings.push({
      severity: "low",
      title: "First-person language detected",
      detail: "Replace words like I or my with concise achievement statements."
    });
  }

  if (metrics.actionVerbLines < 4) {
    warnings.push({
      severity: "medium",
      title: "Too few action-led bullets",
      detail: "Start more bullets with action verbs so the resume sounds more decisive and outcome-driven."
    });
  }

  if (warnings.length === 0) {
    warnings.push({
      severity: "low",
      title: "ATS hygiene looks healthy",
      detail: "No major ATS red flags were detected in formatting or structure."
    });
  }

  return warnings
    .sort((left, right) => PRIORITY_WEIGHT[right.severity] - PRIORITY_WEIGHT[left.severity])
    .slice(0, 5);
}

function buildPriorityFixes(metrics, missingKeywords, sectionFeedback, submission) {
  const fixes = [];
  const experienceSection = sectionFeedback.find((section) => section.key === "experience");
  const summarySection = sectionFeedback.find((section) => section.key === "summary");
  const skillsSection = sectionFeedback.find((section) => section.key === "skills");
  const projectsSection = sectionFeedback.find((section) => section.key === "projects");

  if (!experienceSection?.present) {
    fixes.push({
      severity: "high",
      area: "Experience",
      issue: "The resume does not yet show work experience.",
      where: "Experience section",
      why: "Recruiters need proof of ownership, tools used, and business impact.",
      action: "Add a work experience section with role, company, dates, and 3-5 bullets per role.",
      example: "Built and maintained Node.js APIs that reduced response time by 32% for 3,000 monthly users."
    });
  } else if (metrics.measurableAchievements < 3) {
    fixes.push({
      severity: "high",
      area: "Impact",
      issue: "The resume has too few quantified achievements.",
      where: "Experience and projects bullets",
      why: "Measured results make the candidate easier to shortlist and compare.",
      action: "Rewrite at least 3 bullets using action + tool + result + metric.",
      example: "Optimized PostgreSQL queries in a Node.js service and cut API latency by 32%."
    });
  }

  if (!skillsSection?.present) {
    fixes.push({
      severity: "high",
      area: "Skills",
      issue: "The technical stack is not isolated in a dedicated skills section.",
      where: "Skills section",
      why: "Hiring teams often scan the stack before reading the full experience story.",
      action: "Add grouped skills for languages, frameworks, databases, cloud, and testing tools.",
      example: "Languages: JavaScript, TypeScript | Frontend: React | Backend: Node.js, Express | Database: PostgreSQL"
    });
  }

  if (metrics.keywordCoverage < 55) {
    fixes.push({
      severity: "high",
      area: "Role Alignment",
      issue: "The resume is not mirroring enough target-role language.",
      where: "Summary, skills, experience, and projects",
      why: "Low alignment reduces ATS matching and makes the resume feel less targeted.",
      action: `Add true role keywords such as ${missingKeywords.slice(0, 5).join(", ") || "role-specific keywords"} in places where the work actually supports them.`,
      example: `${toSentenceCase(submission.targetRole)} using ${missingKeywords.slice(0, 2).join(" and ") || "relevant tools"} to deliver measurable product outcomes.`
    });
  }

  if (!summarySection?.present || summarySection.status === "needs-work") {
    fixes.push({
      severity: "medium",
      area: "Positioning",
      issue: "The opening summary is missing or not persuasive enough.",
      where: "Top of the resume",
      why: "The top third of the resume should explain role fit within seconds.",
      action: "Write a 2-4 line summary with target role, experience level, strongest tools, and one impact statement.",
      example: "Full stack developer with 2 years of experience building React and Node.js products, improving API performance and shipping user-facing features."
    });
  }

  if (!projectsSection?.present && isEarlyCareer(submission.experienceLevel)) {
    fixes.push({
      severity: "high",
      area: "Projects",
      issue: "An early-career profile is missing portfolio-grade projects.",
      where: "Projects section",
      why: "Projects often carry the proof of skill when professional experience is still growing.",
      action: "Add 1-2 standout projects with stack, ownership, and measurable outcomes.",
      example: "Created a resume builder in React and local storage that improved completion rate by 27% after redesigning the flow."
    });
  }

  if (!metrics.hasLinks) {
    fixes.push({
      severity: "medium",
      area: "Proof of Work",
      issue: "The resume does not include supporting portfolio or GitHub links.",
      where: "Header or projects section",
      why: "Technical profiles get stronger when recruiters can verify shipped work quickly.",
      action: "Add GitHub, portfolio, LinkedIn, or live project links where relevant.",
      example: "github.com/username | portfolio.example.com"
    });
  }

  if (metrics.wordCount < 220 || metrics.wordCount > 900) {
    fixes.push({
      severity: "medium",
      area: "Length",
      issue: "The current resume length may reduce scan quality.",
      where: "Across the full resume",
      why: "Recruiters prefer concise resumes with high information density.",
      action: "Trim repetitive lines or expand weak sections until the resume is focused and complete.",
      example: "Convert responsibility-only bullets into fewer, stronger impact bullets."
    });
  }

  if (!metrics.hasEmail || !metrics.hasPhone) {
    fixes.push({
      severity: "high",
      area: "Contact",
      issue: "Contact information is incomplete.",
      where: "Resume header",
      why: "A strong resume still loses value if the recruiter cannot reach the candidate easily.",
      action: "Add both a professional email and phone number at the top of the resume.",
      example: "name@email.com | +91 98XXX XXXXX"
    });
  }

  return fixes
    .sort((left, right) => PRIORITY_WEIGHT[right.severity] - PRIORITY_WEIGHT[left.severity])
    .slice(0, 5)
    .map((fix) => ({
      ...fix,
      severityLabel: getSeverityLabel(fix.severity)
    }));
}

function buildRewriteSuggestions(metrics, missingKeywords, submission, sectionFeedback) {
  const suggestions = [
    {
      title: "Rewrite summary for stronger positioning",
      area: "Summary",
      guidance: "Use role + experience + strongest stack + value delivered.",
      example: `${toSentenceCase(submission.targetRole)} with ${submission.experienceLevel.toLowerCase()} experience building ${
        missingKeywords[0] || "user-facing"
      } solutions using ${missingKeywords[1] || "modern web"} tools and improving measurable product outcomes.`
    },
    {
      title: "Rewrite experience bullets with outcomes",
      area: "Experience",
      guidance: "Use action verb + technology + business result + metric.",
      example: "Built a React and Node.js workflow that reduced processing time by 32% and supported 3,000 monthly users."
    }
  ];

  if (metrics.keywordCoverage < 65) {
    suggestions.push({
      title: "Blend missing keywords naturally",
      area: "Skills and projects",
      guidance: "Add only keywords that are true, then place them in skills, project stack lines, and bullet points.",
      example: `Stack: React, Node.js, SQL, AWS, Testing${missingKeywords.length ? `, ${missingKeywords.slice(0, 2).join(", ")}` : ""}`
    });
  }

  if (sectionFeedback.find((section) => section.key === "projects")?.present === false) {
    suggestions.push({
      title: "Create a stronger project entry",
      area: "Projects",
      guidance: "Describe the problem, stack, ownership, and measurable result in 2-3 lines.",
      example: "Developed a task management API with Express and PostgreSQL, added automated tests, and reduced failed task updates by 24% after improving validation."
    });
  }

  if (metrics.measurableAchievements < 3) {
    suggestions.push({
      title: "Add measurable impact even when exact numbers are unavailable",
      area: "Experience and projects",
      guidance: "Use range-based estimates such as team size, features shipped, turnaround time, or adoption gains.",
      example: "Shipped 12 responsive UI improvements that reduced support tickets by 18%."
    });
  }

  return suggestions.slice(0, 4);
}

function uniqueValues(items) {
  return [...new Set(items.filter(Boolean).map((item) => String(item).trim()).filter(Boolean))];
}

function getJobKeywordSet(jobDescription, roleKeywords) {
  const normalizedJob = normalizeLine(jobDescription);
  const inferred = roleKeywords.filter((keyword) => normalizedJob.includes(normalizeLine(keyword)));
  const bankMatches = SKILL_BANK.filter((keyword) => normalizedJob.includes(normalizeLine(keyword)));
  const repeatedTerms = (normalizedJob.match(/\b[a-z][a-z+#/.]{2,}\b/g) || [])
    .filter((word) => !["and", "for", "with", "the", "this", "that", "are", "you", "our", "will", "from", "have", "has"].includes(word))
    .filter((word) => word.length >= 4)
    .slice(0, 18);

  return uniqueValues([...inferred, ...bankMatches, ...repeatedTerms, ...roleKeywords]).slice(0, 18);
}

function buildJobMatch(jobDescription, resumeLower, roleKeywords) {
  const jobKeywords = getJobKeywordSet(jobDescription, roleKeywords);
  const matched = jobKeywords.filter((keyword) => resumeLower.includes(keyword.toLowerCase()));
  const missing = jobKeywords.filter((keyword) => !resumeLower.includes(keyword.toLowerCase()));
  const score = jobKeywords.length ? round((matched.length / jobKeywords.length) * 100) : 0;

  return {
    score,
    status: score >= 75 ? "Strong JD match" : score >= 55 ? "Partial JD match" : "Needs JD targeting",
    matchedKeywords: matched.slice(0, 12),
    missingKeywords: missing.slice(0, 12),
    advice:
      jobDescription.length > 0
        ? `This resume matches ${score}% of the detected job-description signals. Add missing terms only where the experience genuinely supports them.`
        : "Paste a job description to unlock a more precise match score and targeted keyword guidance."
  };
}

function buildSkillHeatmap(roleKeywords, jdMatch, resumeLower) {
  const terms = uniqueValues([...roleKeywords, ...(jdMatch?.missingKeywords || []), ...(jdMatch?.matchedKeywords || [])]).slice(0, 14);

  return terms.map((term) => {
    const inResume = resumeLower.includes(term.toLowerCase());
    const inJob = (jdMatch?.matchedKeywords || []).includes(term) || (jdMatch?.missingKeywords || []).includes(term);
    const score = inResume ? 100 : inJob ? 35 : 55;

    return {
      skill: term,
      score,
      status: inResume ? "matched" : inJob ? "missing" : "weak",
      guidance: inResume
        ? "Visible in resume."
        : inJob
          ? "Detected in the job description but missing from the resume."
          : "Useful role signal to add if true."
    };
  });
}

function buildRoadmap(priorityFixes, jdMatch, metrics) {
  const roadmap = priorityFixes.slice(0, 4).map((fix, index) => ({
    step: index + 1,
    title: fix.area,
    impact: fix.severity === "high" ? "High impact" : fix.severity === "medium" ? "Medium impact" : "Nice to have",
    status: "todo",
    action: fix.action,
    target: fix.where
  }));

  if (jdMatch?.missingKeywords?.length) {
    roadmap.push({
      step: roadmap.length + 1,
      title: "JD Keyword Targeting",
      impact: "High impact",
      status: "todo",
      action: `Add true JD keywords such as ${jdMatch.missingKeywords.slice(0, 5).join(", ")}.`,
      target: "Summary, skills, projects, and experience"
    });
  }

  if (metrics.measurableAchievements < 3) {
    roadmap.push({
      step: roadmap.length + 1,
      title: "Impact Metrics",
      impact: "High impact",
      status: "todo",
      action: "Add at least 3 measurable outcomes using percentages, volume, speed, quality, or cost.",
      target: "Experience and projects"
    });
  }

  if (roadmap.length === 0) {
    roadmap.push({
      step: 1,
      title: "Polish Targeting",
      impact: "Medium impact",
      status: "done",
      action: "Resume is in good shape. Tailor the summary and top skills for each job application.",
      target: "Top third of resume"
    });
  }

  return roadmap.slice(0, 6);
}

function buildSuccessBadges(metrics, sectionFeedback, jdMatch) {
  const projects = sectionFeedback.find((section) => section.key === "projects");

  return [
    {
      label: "ATS Ready",
      status: metrics.hasEmail && metrics.hasPhone && !metrics.hasTableCharacters ? "earned" : "needs-work",
      detail: metrics.hasEmail && metrics.hasPhone ? "Core contact and formatting signals are present." : "Add clean contact details and avoid heavy separators."
    },
    {
      label: "Strong Projects",
      status: projects?.status === "strong" || projects?.status === "good" ? "earned" : "needs-work",
      detail: projects?.present ? "Projects are visible." : "Add project proof with stack and outcomes."
    },
    {
      label: "Needs Metrics",
      status: metrics.measurableAchievements >= 3 ? "earned" : "needs-work",
      detail: metrics.measurableAchievements >= 3 ? "Impact is quantified." : "Add more measurable achievements."
    },
    {
      label: "JD Aligned",
      status: jdMatch.score >= 70 ? "earned" : "needs-work",
      detail: jdMatch.score >= 70 ? "Job-description match is strong." : "Tailor keywords and examples to the pasted job description."
    }
  ];
}

function buildInterviewPrep(submission, jdMatch, missingKeywords, sectionFeedback) {
  const weakSections = sectionFeedback
    .filter((section) => ["missing", "needs-work"].includes(section.status))
    .map((section) => section.label)
    .slice(0, 3);
  const gapText = (jdMatch?.missingKeywords?.length ? jdMatch.missingKeywords : missingKeywords).slice(0, 4).join(", ");

  return [
    `Tell me about your strongest project for a ${submission.targetRole} role and the measurable result it created.`,
    `How have you used ${gapText || "the target role skills"} in a real assignment, internship, or project?`,
    `Walk me through one resume bullet where you improved speed, quality, cost, revenue, or user experience.`,
    weakSections.length
      ? `Your ${weakSections.join(", ")} section needs more proof. How would you explain that experience in an interview?`
      : "Which achievement on this resume best proves you are ready for this role?"
  ];
}

function buildBeforeAfterRewrites(metrics, missingKeywords, submission, lines) {
  const weakBullet = lines.find((line) => isBulletLine(line) && !hasMetricContent(line)) || "Responsible for building and improving application features.";
  const cleanedBullet = stripBulletPrefix(weakBullet);
  const roleKeyword = missingKeywords[0] || submission.targetRole;

  return [
    {
      area: "Experience Bullet",
      before: cleanedBullet,
      after: `Improved ${roleKeyword} workflow by shipping a measurable feature, reducing turnaround time by 25% for target users.`,
      why: "The improved version adds an action verb, role keyword, measurable outcome, and user impact."
    },
    {
      area: "Summary",
      before: `${submission.targetRole} seeking an opportunity to grow and learn.`,
      after: `${toSentenceCase(submission.targetRole)} with ${submission.experienceLevel.toLowerCase()} experience using ${uniqueValues([missingKeywords[0], missingKeywords[1]]).join(" and ") || "role-relevant tools"} to deliver measurable business outcomes.`,
      why: "The improved summary positions the candidate by role, experience level, skills, and value."
    },
    {
      area: "Skills",
      before: "Skills: communication, teamwork, tools.",
      after: `Skills: ${uniqueValues([roleKeyword, missingKeywords[1], "Excel", "SQL", "Reporting"]).slice(0, 5).join(", ")}.`,
      why: "The improved skills line is targeted, searchable, and easier for recruiters to scan."
    }
  ];
}

function buildBuilderSections(submission, missingKeywords, jdMatch) {
  const keywordLine = uniqueValues([...(jdMatch?.missingKeywords || []), ...missingKeywords]).slice(0, 5).join(", ");

  return {
    summary: `${toSentenceCase(submission.targetRole)} with ${submission.experienceLevel.toLowerCase()} experience in ${keywordLine || "role-relevant work"}, focused on measurable outcomes and reliable delivery.`,
    skills: `Core Skills: ${keywordLine || "role-specific tools"}, communication, collaboration, problem solving.`,
    experienceBullet: `- Delivered a ${submission.targetRole.toLowerCase()} initiative using ${keywordLine.split(", ")[0] || "relevant tools"} and improved a measurable business result by 25%.`,
    projectBullet: `- Built a role-focused project that demonstrated ${keywordLine || "technical and analytical skills"} with a clear outcome and proof of ownership.`
  };
}

function buildRecommendations(overallScore, metrics, priorityFixes) {
  const topFix = priorityFixes[0];

  return {
    headline:
      overallScore >= 78
        ? "This resume already has a competitive base and now needs sharper targeting."
        : "This resume can improve meaningfully with a small number of focused edits.",
    recruiterLens:
      metrics.measurableAchievements >= 3
        ? "The profile already shows some evidence of impact, which helps recruiters justify a shortlist decision faster."
        : "The biggest recruiter gap is proof of outcomes. Stronger metrics and result-led bullets will raise confidence quickly.",
    atsLens:
      metrics.keywordCoverage >= 60
        ? "Keyword alignment is healthy for the selected role."
        : "Keyword alignment is still thin, so ATS matching may be inconsistent against targeted jobs.",
    focusArea: topFix ? `${topFix.area}: ${topFix.issue}` : "No critical fix was detected."
  };
}

function analyzeResume(submission) {
  const resumeText = normalizeWhitespace(submission.resumeText);
  const jobDescription = normalizeWhitespace(submission.jobDescription || "");
  const resumeLower = resumeText.toLowerCase();
  const keywords = inferRoleKeywords(submission.targetRole, jobDescription);
  const lines = resumeText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const sections = extractSectionBlocks(resumeText);

  const words = resumeText.match(/[A-Za-z0-9+#/.%-]+/g) || [];
  const bulletLines = lines.filter(isBulletLine);
  const quantifiedBullets = bulletLines.filter((line) => hasMetricContent(line)).length;
  const measurableAchievements = countMatches(resumeText, METRIC_PATTERN);
  const actionVerbLines = bulletLines.filter(startsWithActionVerb).length;
  const presentKeywords = keywords.filter((keyword) => resumeLower.includes(keyword.toLowerCase()));
  const missingKeywords = keywords.filter((keyword) => !resumeLower.includes(keyword.toLowerCase()));

  const metrics = {
    wordCount: words.length,
    bulletCount: bulletLines.length,
    measurableAchievements,
    quantifiedBullets,
    weakBullets: Math.max(bulletLines.length - quantifiedBullets, 0),
    actionVerbLines,
    sectionCount: sections.filter((section) => section.present).length,
    hasSummarySection: sections.some((section) => section.key === "summary" && section.present),
    hasSkillsSection: sections.some((section) => section.key === "skills" && section.present),
    hasProjectsSection: sections.some((section) => section.key === "projects" && section.present),
    hasEmail:
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(resumeText) ||
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(submission.email || ""),
    hasPhone: /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/.test(resumeText),
    hasLinks: Boolean(submission.portfolioUrl || submission.githubUrl || /linkedin\.com|github\.com|https?:\/\//i.test(resumeText)),
    hasTableCharacters: /[|]{2,}|_{5,}/.test(resumeText),
    firstPersonMentions: countMatches(resumeText, /\b(I|my|me|mine)\b/g),
    keywordCoverage: round((presentKeywords.length / keywords.length) * 100),
    jobDescriptionProvided: jobDescription.length > 0
  };

  const categoryScores = createCategoryScores(metrics);
  const sectionFeedback = createSectionFeedback(sections, metrics, submission, keywords, missingKeywords);
  const priorityFixes = buildPriorityFixes(metrics, missingKeywords, sectionFeedback, submission);
  const atsWarnings = buildAtsWarnings(metrics, missingKeywords);
  const checklist = buildChecklist(metrics, sectionFeedback);
  const rewriteSuggestions = buildRewriteSuggestions(metrics, missingKeywords, submission, sectionFeedback);
  const jdMatch = buildJobMatch(jobDescription, resumeLower, keywords);
  const skillHeatmap = buildSkillHeatmap(keywords, jdMatch, resumeLower);
  const improvementRoadmap = buildRoadmap(priorityFixes, jdMatch, metrics);
  const successBadges = buildSuccessBadges(metrics, sectionFeedback, jdMatch);
  const interviewPrep = buildInterviewPrep(submission, jdMatch, missingKeywords, sectionFeedback);
  const beforeAfterRewrites = buildBeforeAfterRewrites(metrics, missingKeywords, submission, lines);
  const builderSections = buildBuilderSections(submission, missingKeywords, jdMatch);
  const overallScore = round(categoryScores.reduce((sum, category) => sum + category.score, 0) / categoryScores.length);
  const bestCategory = categoryScores.slice().sort((left, right) => right.score - left.score)[0];
  const weakestCategory = categoryScores.slice().sort((left, right) => left.score - right.score)[0];

  const fitBand =
    overallScore >= 85
      ? "Strong match"
      : overallScore >= 70
        ? "Good match"
        : overallScore >= 55
          ? "Needs refinement"
          : "High revision needed";

  const strengths = buildStrengths(metrics, sectionFeedback);
  const improvements = buildImprovements(priorityFixes);
  const nextSteps = buildNextSteps(priorityFixes, missingKeywords);
  const summary = `${toSentenceCase(submission.targetRole)} resume scored ${overallScore}/100. Strongest area: ${bestCategory.label}. Biggest gap: ${weakestCategory.label}. The next best improvement is ${priorityFixes[0]?.area?.toLowerCase() || "overall targeting"}.`;

  return {
    overallScore,
    fitBand,
    summary,
    categoryScores,
    strengths,
    improvements,
    nextSteps,
    priorityFixes,
    atsWarnings,
    checklist,
    rewriteSuggestions,
    jdMatch,
    skillHeatmap,
    improvementRoadmap,
    successBadges,
    interviewPrep,
    beforeAfterRewrites,
    builderSections,
    keywordHighlights: presentKeywords.slice(0, 8),
    keywordGaps: missingKeywords.slice(0, 8),
    metrics: {
      wordCount: metrics.wordCount,
      bulletCount: metrics.bulletCount,
      measurableAchievements: metrics.measurableAchievements,
      quantifiedBullets: metrics.quantifiedBullets,
      weakBullets: metrics.weakBullets,
      actionVerbLines: metrics.actionVerbLines,
      keywordCoverage: metrics.keywordCoverage,
      jdMatchScore: jdMatch.score,
      sectionCoverage: `${metrics.sectionCount}/${SECTION_RULES.length}`,
      criticalIssues: priorityFixes.filter((item) => item.severity === "high").length
    },
    sections: sections.map((section) => ({
      key: section.key,
      label: section.label,
      present: section.present
    })),
    sectionFeedback,
    recommendations: buildRecommendations(overallScore, metrics, priorityFixes)
  };
}

function compareResumeVersions(payload) {
  const baseSubmission = {
    candidateName: payload.candidateName || "Candidate",
    email: payload.email || "",
    targetRole: payload.targetRole || "Target Role",
    experienceLevel: payload.experienceLevel || "Candidate",
    portfolioUrl: payload.portfolioUrl || "",
    githubUrl: payload.githubUrl || "",
    jobDescription: payload.jobDescription || ""
  };
  const oldAnalysis = analyzeResume({
    ...baseSubmission,
    resumeText: payload.oldResumeText || ""
  });
  const newAnalysis = analyzeResume({
    ...baseSubmission,
    resumeText: payload.newResumeText || ""
  });
  const scoreDelta = newAnalysis.overallScore - oldAnalysis.overallScore;
  const categoryDelta = newAnalysis.categoryScores.map((category) => {
    const oldCategory = oldAnalysis.categoryScores.find((item) => item.key === category.key);

    return {
      key: category.key,
      label: category.label,
      before: oldCategory?.score ?? 0,
      after: category.score,
      delta: category.score - (oldCategory?.score ?? 0)
    };
  });

  return {
    beforeScore: oldAnalysis.overallScore,
    afterScore: newAnalysis.overallScore,
    scoreDelta,
    verdict:
      scoreDelta > 8
        ? "Strong improvement"
        : scoreDelta > 0
          ? "Improved"
          : scoreDelta === 0
            ? "No score change"
            : "Needs review",
    categoryDelta,
    gainedKeywords: newAnalysis.keywordHighlights.filter((keyword) => !oldAnalysis.keywordHighlights.includes(keyword)),
    remainingGaps: newAnalysis.keywordGaps,
    nextBestFix: newAnalysis.priorityFixes[0]?.action || "Keep tailoring the resume to the target job."
  };
}

function validateSubmission(submission) {
  const errors = [];

  if (!submission || typeof submission !== "object") {
    return {
      valid: false,
      errors: ["Request body must be a JSON object."]
    };
  }

  if (!submission.candidateName || String(submission.candidateName).trim().length < 2) {
    errors.push("Candidate name must be at least 2 characters.");
  }
  if (!submission.targetRole || String(submission.targetRole).trim().length < 2) {
    errors.push("Target role is required.");
  }
  if (!submission.experienceLevel || String(submission.experienceLevel).trim().length < 2) {
    errors.push("Experience level is required.");
  }
  if (!submission.resumeText || String(submission.resumeText).trim().length < 120) {
    errors.push("Resume text must contain at least 120 characters for analysis.");
  }
  if (submission.email && !/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(submission.email)) {
    errors.push("Email format looks invalid.");
  }

  ["portfolioUrl", "githubUrl"].forEach((field) => {
    if (submission[field] && !/^https?:\/\//i.test(String(submission[field]).trim())) {
      errors.push(`${field} must start with http:// or https://`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  analyzeResume,
  compareResumeVersions,
  validateSubmission
};
