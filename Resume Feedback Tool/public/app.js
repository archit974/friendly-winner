const state = {
  feedbacks: [],
  selectedFeedback: null,
  analytics: null,
  authToken: localStorage.getItem("resumeFeedbackAuthToken") || "",
  currentUser: JSON.parse(localStorage.getItem("resumeFeedbackUser") || "null"),
  reviewerName: localStorage.getItem("resumeFeedbackReviewer") || "",
  vaultSearch: "",
  vaultScoreFilter: "all"
};

const screenIds = ["overview", "review", "vault"];

const sampleResume = {
  candidateName: "Aarav Sharma",
  email: "aarav.sharma@example.com",
  targetRole: "Full Stack Developer",
  experienceLevel: "Junior",
  portfolioUrl: "https://portfolio.example.com/aarav",
  githubUrl: "https://github.com/aarav-sharma",
  jobDescription:
    "Looking for a full stack developer with React, Node.js, REST APIs, SQL, AWS, testing, deployment, and collaboration experience.",
  resumeText: `Aarav Sharma
aarav.sharma@example.com | +91 98765 43210 | https://linkedin.com/in/aarav-sharma | https://github.com/aarav-sharma

Summary
Full stack developer with 2 years of experience building responsive web applications using React, Node.js, Express, and SQL. Strong interest in product delivery, API design, and performance optimization.

Skills
JavaScript, TypeScript, React, Node.js, Express, PostgreSQL, MongoDB, REST API, AWS, Git, Jest, CSS, HTML

Experience
- Built a student collaboration platform with React and Node.js that supported 3,000+ monthly users across 4 departments.
- Improved API response time by 32% by optimizing database queries and reducing redundant fetch operations.
- Implemented JWT authentication, protected routes, and role-based access control for admin dashboards.
- Collaborated with designers in Figma and shipped 12 responsive UI improvements that reduced support tickets by 18%.

Projects
- Developed a resume builder with React and local storage, increasing user completion rate by 27% after redesigning the form flow.
- Created a task management API with Express and PostgreSQL, including automated tests and deployment on AWS.

Education
B.Tech in Computer Science, K.R. Mangalam University

Certifications
AWS Cloud Practitioner`
};

const elements = {
  authScreen: document.getElementById("authScreen"),
  appShell: document.getElementById("appShell"),
  loginTabButton: document.getElementById("loginTabButton"),
  signupTabButton: document.getElementById("signupTabButton"),
  loginForm: document.getElementById("loginForm"),
  signupForm: document.getElementById("signupForm"),
  authMessage: document.getElementById("authMessage"),
  navButtons: [...document.querySelectorAll(".nav-button")],
  screens: Object.fromEntries(screenIds.map((id) => [id, document.getElementById(`screen-${id}`)])),
  feedbackForm: document.getElementById("feedbackForm"),
  formMessage: document.getElementById("formMessage"),
  submitButton: document.getElementById("submitButton"),
  updateButton: document.getElementById("updateButton"),
  sampleButton: document.getElementById("sampleButton"),
  clearButton: document.getElementById("clearButton"),
  reviewerNameInput: document.getElementById("reviewerNameInput"),
  saveReviewerButton: document.getElementById("saveReviewerButton"),
  logoutButton: document.getElementById("logoutButton"),
  reviewerStatus: document.getElementById("reviewerStatus"),
  signedInUser: document.getElementById("signedInUser"),
  signedInRole: document.getElementById("signedInRole"),
  pdfFileInput: document.getElementById("pdfFileInput"),
  pdfDropzone: document.getElementById("pdfDropzone"),
  extractPdfButton: document.getElementById("extractPdfButton"),
  pdfStatus: document.getElementById("pdfStatus"),
  downloadButton: document.getElementById("downloadButton"),
  reportButton: document.getElementById("reportButton"),
  csvButton: document.getElementById("csvButton"),
  vaultCsvButton: document.getElementById("vaultCsvButton"),
  refreshButton: document.getElementById("refreshButton"),
  vaultSearchInput: document.getElementById("vaultSearchInput"),
  vaultScoreFilter: document.getElementById("vaultScoreFilter"),
  historyList: document.getElementById("historyList"),
  detailTitle: document.getElementById("detailTitle"),
  detailContent: document.getElementById("detailContent"),
  analyticsPanel: document.getElementById("analyticsPanel"),
  resultTitle: document.getElementById("resultTitle"),
  resultBand: document.getElementById("resultBand"),
  resultScore: document.getElementById("resultScore"),
  resultSummary: document.getElementById("resultSummary"),
  resultMetadata: document.getElementById("resultMetadata"),
  categoryList: document.getElementById("categoryList"),
  strengthList: document.getElementById("strengthList"),
  improvementList: document.getElementById("improvementList"),
  keywordGapList: document.getElementById("keywordGapList"),
  nextStepList: document.getElementById("nextStepList"),
  priorityFixList: document.getElementById("priorityFixList"),
  atsWarningList: document.getElementById("atsWarningList"),
  sectionReviewList: document.getElementById("sectionReviewList"),
  checklistList: document.getElementById("checklistList"),
  rewriteSuggestionList: document.getElementById("rewriteSuggestionList"),
  roadmapList: document.getElementById("roadmapList"),
  successBadgeList: document.getElementById("successBadgeList"),
  beforeAfterList: document.getElementById("beforeAfterList"),
  jdMatchPanel: document.getElementById("jdMatchPanel"),
  skillHeatmapList: document.getElementById("skillHeatmapList"),
  keywordHighlightList: document.getElementById("keywordHighlightList"),
  interviewPrepList: document.getElementById("interviewPrepList"),
  resultTabButtons: [...document.querySelectorAll("[data-result-tab]")],
  resultTabPanels: [...document.querySelectorAll("[data-result-panel]")],
  builderSummary: document.getElementById("builderSummary"),
  builderSkills: document.getElementById("builderSkills"),
  builderExperience: document.getElementById("builderExperience"),
  builderProjects: document.getElementById("builderProjects"),
  buildResumeButton: document.getElementById("buildResumeButton"),
  oldResumeText: document.getElementById("oldResumeText"),
  newResumeText: document.getElementById("newResumeText"),
  compareButton: document.getElementById("compareButton"),
  compareResult: document.getElementById("compareResult"),
  storedCount: document.getElementById("storedCount"),
  averageScore: document.getElementById("averageScore"),
  latestReview: document.getElementById("latestReview"),
  heroScore: document.getElementById("heroScore"),
  overviewMetrics: document.getElementById("overviewMetrics")
};

function setScreen(screen) {
  elements.navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.screen === screen);
  });

  screenIds.forEach((id) => {
    elements.screens[id].classList.toggle("active", id === screen);
  });
}

function setResultTab(tab) {
  elements.resultTabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.resultTab === tab);
  });

  elements.resultTabPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.resultPanel === tab);
  });
}

function sanitize(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function setAuthMode(mode) {
  const isLogin = mode === "login";
  elements.loginTabButton.classList.toggle("active", isLogin);
  elements.signupTabButton.classList.toggle("active", !isLogin);
  elements.loginForm.classList.toggle("active", isLogin);
  elements.signupForm.classList.toggle("active", !isLogin);
  elements.authMessage.textContent = "";
}

function setAuthenticatedSession({ token, user }) {
  state.authToken = token;
  state.currentUser = user;
  localStorage.setItem("resumeFeedbackAuthToken", token);
  localStorage.setItem("resumeFeedbackUser", JSON.stringify(user));
  if (!state.reviewerName) {
    state.reviewerName = user.name;
    localStorage.setItem("resumeFeedbackReviewer", user.name);
  }
  updateAuthUi();
}

function clearAuthenticatedSession() {
  state.authToken = "";
  state.currentUser = null;
  state.feedbacks = [];
  state.selectedFeedback = null;
  state.analytics = null;
  localStorage.removeItem("resumeFeedbackAuthToken");
  localStorage.removeItem("resumeFeedbackUser");
  updateAuthUi();
}

function updateAuthUi() {
  const isLoggedIn = Boolean(state.authToken && state.currentUser);
  elements.authScreen.classList.toggle("hidden", isLoggedIn);
  elements.appShell.classList.toggle("locked", !isLoggedIn);
  elements.signedInUser.textContent = state.currentUser?.name || "No user";
  elements.signedInRole.textContent = state.currentUser?.role || "-";
  elements.reviewerNameInput.value = state.reviewerName || state.currentUser?.name || "";
  elements.feedbackForm.elements.namedItem("reviewerName").value = state.reviewerName || state.currentUser?.name || "";
}

async function apiFetch(url, options = {}) {
  const headers = {
    ...(options.headers || {})
  };

  if (state.authToken) {
    headers.Authorization = `Bearer ${state.authToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    clearAuthenticatedSession();
    elements.authMessage.textContent = "Please log in to continue.";
  }

  return response;
}

function formatDate(value) {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function formToPayload(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function fillForm(values) {
  Object.entries(values).forEach(([key, value]) => {
    const field = elements.feedbackForm.elements.namedItem(key);
    if (field) {
      field.value = value;
    }
  });
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let index = 0; index < bytes.length; index += 0x8000) {
    const chunk = bytes.subarray(index, index + 0x8000);
    binary += Array.from(chunk, (value) => String.fromCharCode(value)).join("");
  }

  return btoa(binary);
}

function resetResultPanel() {
  elements.resultTitle.textContent = "No review selected yet";
  elements.resultBand.textContent = "Waiting";
  elements.resultScore.textContent = "--";
  elements.resultSummary.textContent =
    "Submit a resume to generate structured feedback, scoring, and keyword analysis.";
  elements.resultMetadata.innerHTML = "<span>Metrics will appear here</span>";
  elements.categoryList.innerHTML = "";
  elements.strengthList.innerHTML = "";
  elements.improvementList.innerHTML = "";
  elements.keywordGapList.innerHTML = "";
  elements.nextStepList.innerHTML = "";
  elements.priorityFixList.innerHTML = "";
  elements.atsWarningList.innerHTML = "";
  elements.sectionReviewList.innerHTML = "";
  elements.checklistList.innerHTML = "";
  elements.rewriteSuggestionList.innerHTML = "";
  elements.roadmapList.innerHTML = "";
  elements.successBadgeList.innerHTML = "";
  elements.beforeAfterList.innerHTML = "";
  elements.jdMatchPanel.textContent = "Paste a job description to unlock match scoring.";
  elements.skillHeatmapList.innerHTML = "";
  elements.keywordHighlightList.innerHTML = "";
  elements.interviewPrepList.innerHTML = "";
  elements.downloadButton.disabled = true;
  elements.reportButton.disabled = true;
  elements.updateButton.disabled = true;
}

function renderList(container, items, emptyText) {
  container.innerHTML = "";

  if (!items || items.length === 0) {
    const li = document.createElement("li");
    li.textContent = emptyText;
    container.appendChild(li);
    return;
  }

  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    container.appendChild(li);
  });
}

function renderChips(container, items, emptyText) {
  container.innerHTML = "";

  if (!items || items.length === 0) {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = emptyText;
    container.appendChild(chip);
    return;
  }

  items.forEach((item) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = item;
    container.appendChild(chip);
  });
}

function renderIssueCards(container, items, emptyText) {
  container.innerHTML = "";

  if (!items || items.length === 0) {
    container.innerHTML = `<div class="issue-card empty-card"><p>${sanitize(emptyText)}</p></div>`;
    return;
  }

  container.innerHTML = items
    .map(
      (item) => `
        <article class="issue-card severity-${sanitize(item.severity || "low")}">
          <div class="issue-card-top">
            <strong>${sanitize(item.title || item.issue || "Improvement note")}</strong>
            <span class="severity-pill severity-${sanitize(item.severity || "low")}">${sanitize(
              item.severityLabel || item.severity || "low"
            )}</span>
          </div>
          ${item.where ? `<p><strong>Where:</strong> ${sanitize(item.where)}</p>` : ""}
          ${item.why ? `<p><strong>Why:</strong> ${sanitize(item.why)}</p>` : ""}
          ${item.action ? `<p><strong>Fix:</strong> ${sanitize(item.action)}</p>` : ""}
          ${item.detail ? `<p>${sanitize(item.detail)}</p>` : ""}
          ${item.example ? `<p><strong>Example:</strong> ${sanitize(item.example)}</p>` : ""}
          ${
            item.action
              ? `<button class="ghost-button fix-button" type="button" data-fix="${sanitize(item.action)}" data-area="${sanitize(
                  item.area || item.title || "Fix"
                )}">Fix This</button>`
              : ""
          }
        </article>
      `
    )
    .join("");
}

function renderSectionReviews(items) {
  elements.sectionReviewList.innerHTML = "";

  if (!items || items.length === 0) {
    elements.sectionReviewList.innerHTML = `<div class="section-card empty-card"><p>No section review available yet.</p></div>`;
    return;
  }

  elements.sectionReviewList.innerHTML = items
    .map(
      (section) => `
        <article class="section-card">
          <div class="section-card-top">
            <div>
              <strong>${sanitize(section.label)}</strong>
              <p>${sanitize(section.summary)}</p>
            </div>
            <div class="section-score-wrap">
              <span class="section-status status-${sanitize(section.status || "needs-work")}">${sanitize(
                (section.status || "needs-work").replace("-", " ")
              )}</span>
              <span class="score-pill">${sanitize(section.score ?? 0)}/100</span>
            </div>
          </div>
          <p><strong>Where to improve:</strong> ${sanitize(section.whereToImprove || section.label)}</p>
          ${
            section.checks?.length
              ? `<div class="mini-chip-row">${section.checks.map((item) => `<span class="mini-chip">${sanitize(item)}</span>`).join("")}</div>`
              : ""
          }
          ${
            section.suggestions?.length
              ? `<ul class="feedback-list compact-list">${section.suggestions.map((item) => `<li>${sanitize(item)}</li>`).join("")}</ul>`
              : "<p>No additional suggestions for this section.</p>"
          }
        </article>
      `
    )
    .join("");
}

function renderChecklist(items) {
  elements.checklistList.innerHTML = "";

  if (!items || items.length === 0) {
    elements.checklistList.innerHTML = `<div class="check-item empty-card"><p>No checklist data available yet.</p></div>`;
    return;
  }

  elements.checklistList.innerHTML = items
    .map(
      (item) => `
        <article class="check-item status-${sanitize(item.status || "warn")}">
          <div class="check-item-top">
            <strong>${sanitize(item.label)}</strong>
            <span class="check-state status-${sanitize(item.status || "warn")}">${sanitize(item.status || "warn")}</span>
          </div>
          <p>${sanitize(item.detail || "")}</p>
        </article>
      `
    )
    .join("");
}

function renderRewriteSuggestions(items) {
  elements.rewriteSuggestionList.innerHTML = "";

  if (!items || items.length === 0) {
    elements.rewriteSuggestionList.innerHTML = `<div class="rewrite-card empty-card"><p>No rewrite guidance available yet.</p></div>`;
    return;
  }

  elements.rewriteSuggestionList.innerHTML = items
    .map(
      (item) => `
        <article class="rewrite-card">
          <div class="rewrite-card-top">
            <strong>${sanitize(item.title || item.area || "Rewrite guidance")}</strong>
            <span class="chip">${sanitize(item.area || "Suggestion")}</span>
          </div>
          <p><strong>How:</strong> ${sanitize(item.guidance || "")}</p>
          <p><strong>Example:</strong> ${sanitize(item.example || "")}</p>
        </article>
      `
    )
    .join("");
}

function renderRoadmap(items) {
  elements.roadmapList.innerHTML = "";

  if (!items || items.length === 0) {
    elements.roadmapList.innerHTML = `<div class="roadmap-card empty-card"><p>No roadmap available yet.</p></div>`;
    return;
  }

  elements.roadmapList.innerHTML = items
    .map(
      (item) => `
        <article class="roadmap-card">
          <span class="roadmap-step">${sanitize(item.step)}</span>
          <div>
            <strong>${sanitize(item.title)}</strong>
            <p>${sanitize(item.action)}</p>
            <span class="mini-chip">${sanitize(item.impact)} | ${sanitize(item.target)}</span>
          </div>
        </article>
      `
    )
    .join("");
}

function renderSuccessBadges(items) {
  elements.successBadgeList.innerHTML = "";

  if (!items || items.length === 0) {
    elements.successBadgeList.innerHTML = `<div class="badge-card empty-card"><p>No badges available yet.</p></div>`;
    return;
  }

  elements.successBadgeList.innerHTML = items
    .map(
      (item) => `
        <article class="badge-card badge-${sanitize(item.status)}">
          <strong>${sanitize(item.label)}</strong>
          <span>${sanitize(item.status === "earned" ? "Earned" : "Needs work")}</span>
          <p>${sanitize(item.detail)}</p>
        </article>
      `
    )
    .join("");
}

function renderBeforeAfter(items) {
  elements.beforeAfterList.innerHTML = "";

  if (!items || items.length === 0) {
    elements.beforeAfterList.innerHTML = `<div class="rewrite-card empty-card"><p>No before/after rewrites available yet.</p></div>`;
    return;
  }

  elements.beforeAfterList.innerHTML = items
    .map(
      (item) => `
        <article class="rewrite-card before-after-card">
          <div class="rewrite-card-top">
            <strong>${sanitize(item.area)}</strong>
            <button class="ghost-button fix-button" type="button" data-fix="${sanitize(item.after)}" data-area="${sanitize(item.area)}">Use Rewrite</button>
          </div>
          <p><strong>Before:</strong> ${sanitize(item.before)}</p>
          <p><strong>After:</strong> ${sanitize(item.after)}</p>
          <p><strong>Why:</strong> ${sanitize(item.why)}</p>
        </article>
      `
    )
    .join("");
}

function renderJdMatch(match) {
  if (!match) {
    elements.jdMatchPanel.textContent = "Paste a job description to unlock match scoring.";
    return;
  }

  elements.jdMatchPanel.innerHTML = `
    <div class="match-score">${sanitize(match.score)}%</div>
    <strong>${sanitize(match.status)}</strong>
    <p>${sanitize(match.advice)}</p>
    <div class="chip-wrap">
      ${(match.matchedKeywords || []).slice(0, 8).map((item) => `<span class="chip">${sanitize(item)}</span>`).join("") || '<span class="chip">No matched JD keywords yet</span>'}
    </div>
  `;
}

function renderHeatmap(items) {
  elements.skillHeatmapList.innerHTML = "";

  if (!items || items.length === 0) {
    elements.skillHeatmapList.innerHTML = `<div class="heatmap-cell empty-card">No skill heatmap available yet.</div>`;
    return;
  }

  elements.skillHeatmapList.innerHTML = items
    .map(
      (item) => `
        <article class="heatmap-cell heatmap-${sanitize(item.status)}" style="--heat:${sanitize(item.score)}%">
          <strong>${sanitize(item.skill)}</strong>
          <span>${sanitize(item.score)}%</span>
          <p>${sanitize(item.guidance)}</p>
        </article>
      `
    )
    .join("");
}

function renderInterviewPrep(items) {
  elements.interviewPrepList.innerHTML = "";

  if (!items || items.length === 0) {
    elements.interviewPrepList.innerHTML = `<div class="interview-card empty-card"><p>No interview questions available yet.</p></div>`;
    return;
  }

  elements.interviewPrepList.innerHTML = items
    .map(
      (item, index) => `
        <article class="interview-card">
          <span class="roadmap-step">${sanitize(index + 1)}</span>
          <p>${sanitize(item)}</p>
        </article>
      `
    )
    .join("");
}

function renderAnalytics() {
  const analytics = state.analytics;

  if (!analytics) {
    elements.analyticsPanel.textContent = "Analytics will appear after reviews load.";
    return;
  }

  elements.analyticsPanel.innerHTML = `
    <div class="analytics-grid">
      <div class="insight-item"><span>Total Reviews</span><strong>${sanitize(analytics.totalReviews)}</strong></div>
      <div class="insight-item"><span>Average Score</span><strong>${sanitize(analytics.averageScore)}</strong></div>
      <div class="insight-item"><span>Highest Score</span><strong>${sanitize(analytics.highestScore)}</strong></div>
      <div class="insight-item"><span>Best Candidate</span><strong>${sanitize(analytics.bestCandidate)}</strong></div>
    </div>
    <div class="feedback-columns">
      <div>
        <p class="mini-heading">Common Mistakes</p>
        <div class="chart-list">
          ${(analytics.commonIssues || [])
            .map(
              (item) => `
                <div class="chart-row">
                  <span>${sanitize(item.label)}</span>
                  <div class="progress-track"><div class="progress-fill" style="width:${Math.min(item.count * 24, 100)}%"></div></div>
                  <strong>${sanitize(item.count)}</strong>
                </div>
              `
            )
            .join("") || "<p>No recurring issues yet.</p>"}
        </div>
      </div>
      <div>
        <p class="mini-heading">Category Averages</p>
        <div class="chart-list">
          ${(analytics.categoryAverages || [])
            .map(
              (item) => `
                <div class="chart-row">
                  <span>${sanitize(item.label)}</span>
                  <div class="progress-track"><div class="progress-fill" style="width:${Math.min(item.score, 100)}%"></div></div>
                  <strong>${sanitize(item.score)}</strong>
                </div>
              `
            )
            .join("") || "<p>No category averages yet.</p>"}
        </div>
      </div>
    </div>
  `;
}

function fillBuilderSuggestions(builderSections) {
  if (!builderSections) {
    return;
  }

  elements.builderSummary.value = builderSections.summary || elements.builderSummary.value;
  elements.builderSkills.value = builderSections.skills || elements.builderSkills.value;
  elements.builderExperience.value = builderSections.experienceBullet || elements.builderExperience.value;
  elements.builderProjects.value = builderSections.projectBullet || elements.builderProjects.value;
}

function renderOverview(feedback) {
  const metrics = feedback?.analysis?.metrics;
  const average =
    state.feedbacks.length > 0
      ? Math.round(state.feedbacks.reduce((sum, item) => sum + item.overallScore, 0) / state.feedbacks.length)
      : 0;

  elements.heroScore.textContent = feedback ? feedback.analysis.overallScore : "--";
  elements.storedCount.textContent = String(state.feedbacks.length);
  elements.averageScore.textContent = String(average);
  elements.latestReview.textContent = feedback
    ? `${feedback.submission.candidateName} | ${feedback.submission.targetRole}`
    : "No data";

  const metricItems = [
    { label: "Words", value: metrics?.wordCount ?? 0 },
    { label: "JD Match", value: `${metrics?.jdMatchScore ?? 0}%` },
    { label: "Quantified Bullets", value: metrics?.quantifiedBullets ?? 0 },
    { label: "Priority Fixes", value: metrics?.criticalIssues ?? 0 }
  ];

  elements.overviewMetrics.innerHTML = metricItems
    .map(
      (item) => `
        <div class="insight-item">
          <span>${sanitize(item.label)}</span>
          <strong>${sanitize(item.value)}</strong>
        </div>
      `
    )
    .join("");
}

function renderResult(feedback) {
  if (!feedback) {
    resetResultPanel();
    return;
  }

  state.selectedFeedback = feedback;
  const { analysis, submission } = feedback;

  elements.resultTitle.textContent = `${submission.candidateName} | ${submission.targetRole}`;
  elements.resultBand.textContent = analysis.fitBand;
  elements.resultScore.textContent = analysis.overallScore;
  elements.resultSummary.textContent = analysis.summary;
  elements.downloadButton.disabled = false;
  elements.reportButton.disabled = false;
  elements.updateButton.disabled = false;

  elements.resultMetadata.innerHTML = [
    submission.experienceLevel,
    `${analysis.metrics?.wordCount ?? 0} words`,
    `${analysis.metrics?.jdMatchScore ?? analysis.jdMatch?.score ?? 0}% JD match`,
    `${analysis.metrics?.measurableAchievements ?? 0} achievements`,
    `${analysis.metrics?.criticalIssues ?? 0} high-priority fixes`
  ]
    .map((item) => `<span>${sanitize(item)}</span>`)
    .join("");

  elements.categoryList.innerHTML = (analysis.categoryScores || [])
    .map(
      (category) => `
        <div class="category-row">
          <strong><span>${sanitize(category.label)}</span><span>${sanitize(category.score)}</span></strong>
          <div class="progress-track">
            <div class="progress-fill" style="width:${Math.min(category.score, 100)}%"></div>
          </div>
          <p>${sanitize(category.summary)}</p>
        </div>
      `
    )
    .join("");

  renderList(elements.strengthList, analysis.strengths || [], "No strengths available yet.");
  renderList(elements.improvementList, analysis.improvements || [], "No improvement notes available yet.");
  renderChips(elements.keywordGapList, analysis.keywordGaps || [], "No keyword gaps detected");
  renderChips(elements.keywordHighlightList, analysis.keywordHighlights || [], "No keyword highlights detected");
  renderList(elements.nextStepList, analysis.nextSteps || [], "No next steps available yet.");
  renderIssueCards(elements.priorityFixList, analysis.priorityFixes || [], "No priority fixes detected.");
  renderIssueCards(elements.atsWarningList, analysis.atsWarnings || [], "No ATS warnings detected.");
  renderSectionReviews(analysis.sectionFeedback || []);
  renderChecklist(analysis.checklist || []);
  renderRewriteSuggestions(analysis.rewriteSuggestions || []);
  renderRoadmap(analysis.improvementRoadmap || []);
  renderSuccessBadges(analysis.successBadges || []);
  renderBeforeAfter(analysis.beforeAfterRewrites || []);
  renderJdMatch(analysis.jdMatch);
  renderHeatmap(analysis.skillHeatmap || []);
  renderInterviewPrep(analysis.interviewPrep || []);
  fillBuilderSuggestions(analysis.builderSections);

  renderOverview(feedback);
  renderDetail(feedback);
}

function renderDetail(feedback) {
  if (!feedback) {
    elements.detailTitle.textContent = "Select a saved review";
    elements.detailContent.textContent =
      "Stored feedback details, candidate input, and analytics will appear here.";
    return;
  }

  const { submission, analysis, createdAt } = feedback;

  elements.detailTitle.textContent = `${submission.candidateName} review`;
  elements.detailContent.innerHTML = `
    <div class="detail-block">
      <div class="detail-grid">
        <div>
          <h4>${sanitize(submission.targetRole)}</h4>
          <div class="detail-meta">${sanitize(submission.experienceLevel)} | ${sanitize(formatDate(createdAt))}</div>
        </div>
        <div class="score-pill">${sanitize(analysis.overallScore)}/100</div>
      </div>
      <p>${sanitize(analysis.recommendations?.headline || analysis.summary)}</p>
      <p>${sanitize(analysis.recommendations?.recruiterLens || "Recruiter lens is available for new reviews.")}</p>
      <p>${sanitize(analysis.recommendations?.atsLens || "ATS lens is available for new reviews.")}</p>
      <p><strong>Top focus:</strong> ${sanitize(analysis.recommendations?.focusArea || "No focus area saved.")}</p>
      <div class="button-row">
        <button class="secondary-button" type="button" data-load-review="${sanitize(feedback.id)}">Load Into Editor</button>
        <button class="ghost-button" type="button" data-open-report="${sanitize(feedback.id)}">Open Report</button>
        <button class="ghost-button danger-button" type="button" data-delete-review="${sanitize(feedback.id)}">Delete Review</button>
      </div>
    </div>
    <div class="detail-block">
      <h4>Candidate Input</h4>
      <p><strong>Email:</strong> ${sanitize(submission.email || "Not provided")}</p>
      <p><strong>Job Target:</strong> ${sanitize(submission.targetRole)}</p>
      <p><strong>Experience:</strong> ${sanitize(submission.experienceLevel)}</p>
      <p><strong>Resume Source:</strong> ${sanitize(submission.resumeFileName || "Manual paste")}</p>
      <div class="detail-links">
        ${submission.portfolioUrl ? `<a href="${sanitize(submission.portfolioUrl)}" target="_blank" rel="noreferrer">Portfolio</a>` : ""}
        ${submission.githubUrl ? `<a href="${sanitize(submission.githubUrl)}" target="_blank" rel="noreferrer">GitHub</a>` : ""}
      </div>
    </div>
    <div class="detail-block">
      <h4>Keyword Highlights</h4>
      <div class="chip-wrap">
        ${(analysis.keywordHighlights || []).map((item) => `<span class="chip">${sanitize(item)}</span>`).join("") || '<span class="chip">No highlights yet</span>'}
      </div>
    </div>
    <div class="detail-block">
      <h4>Priority Fix Snapshot</h4>
      <ul class="feedback-list compact-list">
        ${(analysis.priorityFixes || [])
          .slice(0, 3)
          .map((item) => `<li><strong>${sanitize(item.area)}:</strong> ${sanitize(item.action)}</li>`)
          .join("") || "<li>No priority fixes stored for this review.</li>"}
      </ul>
    </div>
    <div class="detail-block">
      <h4>Section Snapshot</h4>
      <div class="chip-wrap">
        ${(analysis.sectionFeedback || [])
          .map((item) => `<span class="chip">${sanitize(item.label)}: ${sanitize(item.status)}</span>`)
          .join("") || '<span class="chip">No section diagnostics available</span>'}
      </div>
    </div>
    <div class="detail-block">
      <h4>Resume Preview</h4>
      <p>${sanitize(submission.resumeText.slice(0, 900))}${submission.resumeText.length > 900 ? "..." : ""}</p>
    </div>
  `;
}

function renderHistory() {
  elements.historyList.innerHTML = "";

  const filteredFeedbacks = state.feedbacks.filter((item) => {
    const query = state.vaultSearch.toLowerCase();
    const matchesQuery =
      !query ||
      `${item.candidateName} ${item.targetRole} ${item.experienceLevel} ${item.summary} ${item.topGap}`
        .toLowerCase()
        .includes(query);
    const matchesScore =
      state.vaultScoreFilter === "all" ||
      (state.vaultScoreFilter === "strong" && item.overallScore >= 80) ||
      (state.vaultScoreFilter === "needs" && item.overallScore < 70);

    return matchesQuery && matchesScore;
  });

  if (filteredFeedbacks.length === 0) {
    const empty = document.createElement("div");
    empty.className = "history-item";
    empty.textContent = state.feedbacks.length
      ? "No reviews match the current search or filter."
      : "No feedback sessions saved yet. Create one from the Review Studio.";
    elements.historyList.appendChild(empty);
    return;
  }

  filteredFeedbacks.forEach((item) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `history-item${state.selectedFeedback?.id === item.id ? " active" : ""}`;
    card.innerHTML = `
      <div class="history-topline">
        <strong>${sanitize(item.candidateName)} <span class="version-pill">v${sanitize(item.version || 1)}</span></strong>
        <span class="score-pill">${sanitize(item.overallScore)}/100</span>
      </div>
      <div>${sanitize(item.targetRole)} | ${sanitize(item.experienceLevel)}</div>
      ${
        state.currentUser?.role === "developer"
          ? `<div class="history-summary">Owner: ${sanitize(item.ownerEmail || "legacy-unowned")}</div>`
          : ""
      }
      <div class="history-summary">JD Match: ${sanitize(item.jdMatchScore ?? 0)}% | Top gap: ${sanitize(item.topGap || "None")}</div>
      <div class="history-summary">${sanitize(item.summary)}</div>
      <div class="detail-meta">${sanitize(formatDate(item.createdAt))}</div>
      <div class="button-row history-actions">
        <span class="mini-chip">Select</span>
        <span class="mini-chip danger-chip" data-delete-review="${sanitize(item.id)}">Delete</span>
      </div>
    `;

    card.addEventListener("click", async (event) => {
      if (event.target.dataset.deleteReview) {
        event.stopPropagation();
        await deleteFeedback(item.id);
        return;
      }

      await selectFeedback(item.id);
      setScreen("vault");
    });

    elements.historyList.appendChild(card);
  });
}

async function selectFeedback(id) {
  const response = await apiFetch(`/api/feedbacks/${id}`);
  if (!response.ok) {
    throw new Error("Unable to load feedback details.");
  }

  const payload = await response.json();
  renderResult(payload.feedback);
  renderHistory();
}

async function fetchHistory() {
  const [historyResponse, analyticsResponse] = await Promise.all([apiFetch("/api/feedbacks"), apiFetch("/api/analytics")]);
  if (!historyResponse.ok) {
    throw new Error("Unable to load stored feedback.");
  }

  const payload = await historyResponse.json();
  state.feedbacks = payload.feedbacks;
  if (analyticsResponse.ok) {
    const analyticsPayload = await analyticsResponse.json();
    state.analytics = analyticsPayload.analytics;
  }
  renderHistory();
  renderAnalytics();

  if (!state.selectedFeedback && state.feedbacks.length > 0) {
    await selectFeedback(state.feedbacks[0].id);
  } else {
    renderOverview(state.selectedFeedback);
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  elements.formMessage.textContent = "Generating resume feedback...";
  elements.submitButton.disabled = true;

  try {
    elements.feedbackForm.elements.namedItem("reviewerName").value = state.reviewerName;
    const payload = formToPayload(elements.feedbackForm);
    const response = await apiFetch("/api/feedbacks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.errors?.join(" ") || data.message || "Unable to create feedback.");
    }

    elements.formMessage.textContent = "Feedback generated and stored successfully.";
    renderResult(data.feedback);
    await fetchHistory();
    setScreen("review");
  } catch (error) {
    elements.formMessage.textContent = error.message;
  } finally {
    elements.submitButton.disabled = false;
  }
}

async function updateSelectedFeedback() {
  if (!state.selectedFeedback) {
    elements.formMessage.textContent = "Select a saved review before updating.";
    return;
  }

  elements.updateButton.disabled = true;
  elements.formMessage.textContent = "Updating selected feedback...";

  try {
    elements.feedbackForm.elements.namedItem("reviewerName").value = state.reviewerName;
    const payload = formToPayload(elements.feedbackForm);
    const response = await apiFetch(`/api/feedbacks/${state.selectedFeedback.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errors?.join(" ") || data.message || "Unable to update feedback.");
    }

    elements.formMessage.textContent = "Selected feedback updated successfully.";
    renderResult(data.feedback);
    await fetchHistory();
  } catch (error) {
    elements.formMessage.textContent = error.message;
  } finally {
    elements.updateButton.disabled = false;
  }
}

async function extractPdf() {
  const file = elements.pdfFileInput.files[0];
  if (!file) {
    elements.pdfStatus.textContent = "Choose a PDF file first.";
    return;
  }

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    elements.pdfStatus.textContent = "Only PDF files are supported for upload.";
    return;
  }

  elements.extractPdfButton.disabled = true;
  elements.pdfStatus.textContent = "Extracting text from PDF...";

  try {
    const arrayBuffer = await file.arrayBuffer();
    const response = await apiFetch("/api/extract-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fileName: file.name,
        base64Pdf: arrayBufferToBase64(arrayBuffer)
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Unable to extract text from the PDF.");
    }

    elements.feedbackForm.elements.namedItem("resumeText").value = data.text;
    elements.feedbackForm.elements.namedItem("resumeFileName").value = data.fileName;
    elements.pdfStatus.textContent =
      data.extractionMethod === "ocr"
        ? `OCR loaded ${data.textLength} characters from ${data.fileName}.`
        : `Loaded ${data.textLength} characters from ${data.fileName}.`;
    elements.formMessage.textContent =
      data.extractionMethod === "ocr"
        ? "Resume text was filled from the uploaded PDF using OCR fallback."
        : "Resume text was filled from the uploaded PDF.";
  } catch (error) {
    elements.pdfStatus.textContent = error.message;
  } finally {
    elements.extractPdfButton.disabled = false;
  }
}

function downloadSelectedFeedback() {
  if (!state.selectedFeedback) {
    return;
  }

  const blob = new Blob([JSON.stringify(state.selectedFeedback, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${state.selectedFeedback.submission.candidateName.replace(/\s+/g, "-").toLowerCase()}-feedback.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function openSelectedReport() {
  if (!state.selectedFeedback) {
    return;
  }

  await openReportById(state.selectedFeedback.id);
}

async function openReportById(id) {
  const response = await apiFetch(`/api/feedbacks/${id}/report`);

  if (!response.ok) {
    elements.formMessage.textContent = "Unable to open report.";
    return;
  }

  const html = await response.text();
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

async function exportVaultCsv() {
  const response = await apiFetch("/api/feedbacks/export.csv");

  if (!response.ok) {
    elements.formMessage.textContent = "Unable to export CSV.";
    return;
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "resume-feedback-vault.csv";
  link.click();
  URL.revokeObjectURL(url);
}

async function deleteFeedback(id) {
  if (!id) {
    return;
  }

  const confirmed = window.confirm("Delete this feedback from the vault?");
  if (!confirmed) {
    return;
  }

  const response = await apiFetch(`/api/feedbacks/${id}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Unable to delete feedback.");
  }

  if (state.selectedFeedback?.id === id) {
    state.selectedFeedback = null;
    resetResultPanel();
    renderDetail(null);
  }

  await fetchHistory();
}

function loadFeedbackIntoEditor(feedback) {
  if (!feedback) {
    return;
  }

  fillForm({
    ...feedback.submission,
    reviewerName: feedback.reviewerName || state.reviewerName
  });
  elements.oldResumeText.value = feedback.submission.resumeText;
  setScreen("review");
  elements.formMessage.textContent = "Saved review loaded into the editor. Update it or compare against a new version.";
}

function buildResumeFromSections() {
  const candidateName = elements.feedbackForm.elements.namedItem("candidateName").value || "Candidate Name";
  const email = elements.feedbackForm.elements.namedItem("email").value || "";
  const portfolioUrl = elements.feedbackForm.elements.namedItem("portfolioUrl").value || "";
  const githubUrl = elements.feedbackForm.elements.namedItem("githubUrl").value || "";
  const resumeText = `${candidateName}
${[email, portfolioUrl, githubUrl].filter(Boolean).join(" | ")}

Summary
${elements.builderSummary.value.trim()}

Skills
${elements.builderSkills.value.trim()}

Experience
${elements.builderExperience.value.trim()}

Projects
${elements.builderProjects.value.trim()}`.trim();

  elements.feedbackForm.elements.namedItem("resumeText").value = resumeText;
  elements.formMessage.textContent = "Builder sections copied into the resume text field.";
}

async function compareVersions() {
  const oldResumeText = elements.oldResumeText.value.trim();
  const newResumeText = elements.newResumeText.value.trim();

  if (!oldResumeText || !newResumeText) {
    elements.compareResult.textContent = "Paste both old and improved resume versions first.";
    return;
  }

  elements.compareButton.disabled = true;
  elements.compareResult.textContent = "Comparing versions...";

  try {
    const payload = {
      ...formToPayload(elements.feedbackForm),
      oldResumeText,
      newResumeText
    };
    const response = await apiFetch("/api/compare", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to compare versions.");
    }

    const comparison = data.comparison;
    elements.compareResult.innerHTML = `
      <div class="compare-score-row">
        <div><span>Before</span><strong>${sanitize(comparison.beforeScore)}</strong></div>
        <div><span>After</span><strong>${sanitize(comparison.afterScore)}</strong></div>
        <div><span>Delta</span><strong>${sanitize(comparison.scoreDelta > 0 ? `+${comparison.scoreDelta}` : comparison.scoreDelta)}</strong></div>
      </div>
      <p><strong>${sanitize(comparison.verdict)}:</strong> ${sanitize(comparison.nextBestFix)}</p>
      <div class="chart-list">
        ${comparison.categoryDelta
          .map(
            (item) => `
              <div class="chart-row">
                <span>${sanitize(item.label)}</span>
                <div class="progress-track"><div class="progress-fill" style="width:${Math.min(item.after, 100)}%"></div></div>
                <strong>${sanitize(item.delta > 0 ? `+${item.delta}` : item.delta)}</strong>
              </div>
            `
          )
          .join("")}
      </div>
    `;
  } catch (error) {
    elements.compareResult.textContent = error.message;
  } finally {
    elements.compareButton.disabled = false;
  }
}

function saveReviewerProfile() {
  state.reviewerName = elements.reviewerNameInput.value.trim();
  localStorage.setItem("resumeFeedbackReviewer", state.reviewerName);
  elements.feedbackForm.elements.namedItem("reviewerName").value = state.reviewerName;
  elements.reviewerStatus.textContent = state.reviewerName
    ? `Saved local profile for ${state.reviewerName}.`
    : "Local profile cleared.";
}

async function handleAuthSubmit(event, mode) {
  event.preventDefault();
  elements.authMessage.textContent = mode === "login" ? "Logging in..." : "Creating account...";

  try {
    const payload = Object.fromEntries(new FormData(event.target).entries());
    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Authentication failed.");
    }

    setAuthenticatedSession(data);
    elements.authMessage.textContent = "";
    await fetchHistory();
  } catch (error) {
    elements.authMessage.textContent = error.message;
  }
}

async function logout() {
  if (state.authToken) {
    await apiFetch("/api/auth/logout", {
      method: "POST"
    });
  }

  clearAuthenticatedSession();
  resetResultPanel();
  renderDetail(null);
  renderHistory();
  renderAnalytics();
}

function clearForm() {
  elements.feedbackForm.reset();
  elements.feedbackForm.elements.namedItem("reviewerName").value = state.reviewerName;
  elements.builderSummary.value = "";
  elements.builderSkills.value = "";
  elements.builderExperience.value = "";
  elements.builderProjects.value = "";
  elements.oldResumeText.value = "";
  elements.newResumeText.value = "";
  elements.compareResult.textContent = "Comparison results will appear here.";
  elements.pdfFileInput.value = "";
  elements.pdfStatus.textContent = "Upload a PDF to auto-fill the resume field, including scanned PDFs with OCR fallback.";
  elements.formMessage.textContent = "Form cleared.";
}

function loadSample() {
  fillForm(sampleResume);
  elements.feedbackForm.elements.namedItem("reviewerName").value = state.reviewerName;
  elements.feedbackForm.elements.namedItem("resumeFileName").value = "";
  elements.oldResumeText.value = sampleResume.resumeText;
  elements.pdfFileInput.value = "";
  elements.pdfStatus.textContent = "Sample content loaded. PDF upload is optional.";
  elements.formMessage.textContent = "Sample resume loaded. You can submit it directly or edit it first.";
}

async function initialize() {
  updateAuthUi();

  elements.loginTabButton.addEventListener("click", () => setAuthMode("login"));
  elements.signupTabButton.addEventListener("click", () => setAuthMode("signup"));
  elements.loginForm.addEventListener("submit", (event) => handleAuthSubmit(event, "login"));
  elements.signupForm.addEventListener("submit", (event) => handleAuthSubmit(event, "signup"));
  elements.navButtons.forEach((button) => {
    button.addEventListener("click", () => setScreen(button.dataset.screen));
  });
  elements.resultTabButtons.forEach((button) => {
    button.addEventListener("click", () => setResultTab(button.dataset.resultTab));
  });

  elements.feedbackForm.addEventListener("submit", handleSubmit);
  elements.updateButton.addEventListener("click", updateSelectedFeedback);
  elements.sampleButton.addEventListener("click", loadSample);
  elements.clearButton.addEventListener("click", clearForm);
  elements.saveReviewerButton.addEventListener("click", saveReviewerProfile);
  elements.logoutButton.addEventListener("click", logout);
  elements.extractPdfButton.addEventListener("click", extractPdf);
  elements.pdfDropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    elements.pdfDropzone.classList.add("drag-active");
  });
  elements.pdfDropzone.addEventListener("dragleave", () => {
    elements.pdfDropzone.classList.remove("drag-active");
  });
  elements.pdfDropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    elements.pdfDropzone.classList.remove("drag-active");
    const file = event.dataTransfer.files[0];

    if (!file) {
      return;
    }

    const transfer = new DataTransfer();
    transfer.items.add(file);
    elements.pdfFileInput.files = transfer.files;
    elements.feedbackForm.elements.namedItem("resumeFileName").value = file.name;
    elements.pdfStatus.textContent = `${file.name} dropped. Click "Extract PDF Text" to fill the resume field.`;
  });
  elements.pdfFileInput.addEventListener("change", () => {
    const file = elements.pdfFileInput.files[0];
    elements.feedbackForm.elements.namedItem("resumeFileName").value = file ? file.name : "";
    elements.pdfStatus.textContent = file
      ? `${file.name} selected. Click "Extract PDF Text" to fill the resume field.`
      : "Upload a PDF to auto-fill the resume field, including scanned PDFs with OCR fallback.";
  });
  elements.downloadButton.addEventListener("click", downloadSelectedFeedback);
  elements.reportButton.addEventListener("click", openSelectedReport);
  elements.csvButton.addEventListener("click", exportVaultCsv);
  elements.vaultCsvButton.addEventListener("click", exportVaultCsv);
  elements.buildResumeButton.addEventListener("click", buildResumeFromSections);
  elements.compareButton.addEventListener("click", compareVersions);
  elements.vaultSearchInput.addEventListener("input", () => {
    state.vaultSearch = elements.vaultSearchInput.value;
    renderHistory();
  });
  elements.vaultScoreFilter.addEventListener("change", () => {
    state.vaultScoreFilter = elements.vaultScoreFilter.value;
    renderHistory();
  });
  document.addEventListener("click", async (event) => {
    const fixButton = event.target.closest("[data-fix]");
    const deleteButton = event.target.closest("[data-delete-review]");
    const loadButton = event.target.closest("[data-load-review]");
    const reportButton = event.target.closest("[data-open-report]");

    if (fixButton) {
      const fix = fixButton.dataset.fix;
      elements.builderExperience.value = `${elements.builderExperience.value.trim()}\n- ${fix}`.trim();
      elements.formMessage.textContent = `Added ${fixButton.dataset.area || "fix"} to Smart Resume Builder.`;
    }

    if (deleteButton) {
      await deleteFeedback(deleteButton.dataset.deleteReview);
    }

    if (loadButton) {
      loadFeedbackIntoEditor(state.selectedFeedback);
    }

    if (reportButton) {
      await openReportById(reportButton.dataset.openReport);
    }
  });
  elements.refreshButton.addEventListener("click", async () => {
    elements.refreshButton.disabled = true;
    try {
      await fetchHistory();
    } catch (error) {
      elements.detailContent.textContent = error.message;
    } finally {
      elements.refreshButton.disabled = false;
    }
  });

  resetResultPanel();
  renderDetail(null);

  if (state.authToken && state.currentUser) {
    try {
      await fetchHistory();
    } catch (error) {
      elements.formMessage.textContent = error.message;
    }
  }
}

initialize();
