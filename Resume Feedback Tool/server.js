const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const { analyzeResume, compareResumeVersions, validateSubmission } = require("./src/analysis");
const { getUserFromRequest, loginUser, logoutUser, signupUser } = require("./src/auth");
const { extractPdfText, isExtractedTextUsable } = require("./src/pdfExtractor");
const { ocrPdfBuffer } = require("./src/pdfOcr");
const {
  createSubmission,
  deleteSubmission,
  getAnalytics,
  getSubmission,
  listProfiles,
  listSubmissions,
  updateSubmission
} = require("./src/storage");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon"
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload, null, 2));
}

function sendText(response, statusCode, text) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8"
  });
  response.end(text);
}

function sendHtml(response, statusCode, html) {
  response.writeHead(statusCode, {
    "Content-Type": "text/html; charset=utf-8"
  });
  response.end(html);
}

function sendCsv(response, filename, csv) {
  response.writeHead(200, {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`
  });
  response.end(csv);
}

async function readRequestBody(request, maxBytes = 1024 * 1024) {
  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    totalBytes += chunk.length;
    if (totalBytes > maxBytes) {
      const error = new Error(`Request body exceeds ${Math.round(maxBytes / (1024 * 1024))}MB.`);
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const rawBody = Buffer.concat(chunks).toString("utf-8");
  try {
    return JSON.parse(rawBody);
  } catch (error) {
    error.statusCode = 400;
    error.message = "Invalid JSON payload.";
    throw error;
  }
}

async function serveStaticFile(requestPath, response) {
  const requestedPath = requestPath === "/" ? "/index.html" : requestPath;
  const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendText(response, 403, "Forbidden");
    return;
  }

  try {
    const file = await fs.readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[extension] || "application/octet-stream";

    response.writeHead(200, { "Content-Type": contentType });
    response.end(file);
  } catch (error) {
    if (error.code === "ENOENT") {
      sendText(response, 404, "Not found");
      return;
    }

    console.error("Static file error:", error);
    sendText(response, 500, "Unable to load file");
  }
}

function getIdFromPath(urlPath) {
  const parts = urlPath.split("/").filter(Boolean);
  return parts.length === 3 ? parts[2] : null;
}

async function requireUser(request, response) {
  const user = await getUserFromRequest(request);

  if (!user) {
    sendJson(response, 401, {
      message: "Authentication required. Please log in again."
    });
    return null;
  }

  return user;
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toCsvValue(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function buildFeedbackCsv(feedbacks) {
  const headers = ["Candidate", "Role", "Experience", "Score", "JD Match", "Fit Band", "Top Gap", "Created"];
  const rows = feedbacks.map((item) => [
    item.candidateName,
    item.targetRole,
    item.experienceLevel,
    item.overallScore,
    item.jdMatchScore,
    item.fitBand,
    item.topGap,
    item.createdAt
  ]);

  return [headers, ...rows].map((row) => row.map(toCsvValue).join(",")).join("\n");
}

function buildReportHtml(feedback) {
  const { submission, analysis, createdAt } = feedback;
  const list = (items = []) => items.map((item) => `<li>${escapeHtml(item.action || item.detail || item)}</li>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(submission.candidateName)} Resume Feedback Report</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 40px; color: #241c17; line-height: 1.55; }
      .hero { border: 1px solid #ead9ca; border-radius: 24px; padding: 28px; background: #fff8f2; }
      h1, h2 { margin: 0 0 12px; }
      .score { font-size: 56px; font-weight: 800; color: #ca5337; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; margin-top: 22px; }
      .card { border: 1px solid #ead9ca; border-radius: 18px; padding: 18px; background: #fff; }
      .chip { display: inline-block; margin: 4px; padding: 7px 10px; border-radius: 999px; background: #eef2ff; color: #2456c7; font-weight: 700; }
      @media print { body { margin: 20px; } .no-print { display: none; } }
    </style>
  </head>
  <body>
    <button class="no-print" onclick="window.print()">Save as PDF / Print</button>
    <section class="hero">
      <p>${escapeHtml(new Date(createdAt).toLocaleString("en-IN"))}</p>
      <h1>${escapeHtml(submission.candidateName)} | ${escapeHtml(submission.targetRole)}</h1>
      <div class="score">${escapeHtml(analysis.overallScore)}/100</div>
      <p>${escapeHtml(analysis.summary)}</p>
      <p><strong>JD Match:</strong> ${escapeHtml(analysis.jdMatch?.score ?? 0)}%</p>
    </section>
    <div class="grid">
      <section class="card">
        <h2>Priority Fixes</h2>
        <ul>${list(analysis.priorityFixes)}</ul>
      </section>
      <section class="card">
        <h2>ATS Scanner</h2>
        <ul>${list(analysis.atsWarnings)}</ul>
      </section>
      <section class="card">
        <h2>Keyword Gaps</h2>
        ${(analysis.keywordGaps || []).map((item) => `<span class="chip">${escapeHtml(item)}</span>`).join("")}
      </section>
      <section class="card">
        <h2>Rewrite Suggestions</h2>
        <ul>${(analysis.beforeAfterRewrites || analysis.rewriteSuggestions || [])
          .map((item) => `<li><strong>${escapeHtml(item.area || item.title)}:</strong> ${escapeHtml(item.after || item.example)}</li>`)
          .join("")}</ul>
      </section>
    </div>
  </body>
</html>`;
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const { pathname } = url;

  try {
    if (request.method === "GET" && pathname === "/api/health") {
      sendJson(response, 200, {
        status: "ok",
        service: "resume-feedback-tool",
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/auth/signup") {
      const payload = await readRequestBody(request);
      const session = await signupUser(payload);
      sendJson(response, 201, {
        message: "Account created successfully.",
        ...session
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/auth/login") {
      const payload = await readRequestBody(request);
      const session = await loginUser(payload);
      sendJson(response, 200, {
        message: "Logged in successfully.",
        ...session
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/auth/logout") {
      await logoutUser(request);
      sendJson(response, 200, {
        message: "Logged out successfully."
      });
      return;
    }

    if (request.method === "GET" && pathname === "/api/auth/me") {
      const user = await requireUser(request, response);

      if (!user) {
        return;
      }

      sendJson(response, 200, { user });
      return;
    }

    if (request.method === "GET" && pathname === "/api/analytics") {
      const user = await requireUser(request, response);
      if (!user) {
        return;
      }

      const analytics = await getAnalytics(user);
      sendJson(response, 200, { analytics });
      return;
    }

    if (request.method === "GET" && pathname === "/api/profiles") {
      const user = await requireUser(request, response);
      if (!user) {
        return;
      }

      const profiles = await listProfiles(user);
      sendJson(response, 200, { profiles });
      return;
    }

    if (request.method === "GET" && pathname === "/api/feedbacks") {
      const user = await requireUser(request, response);
      if (!user) {
        return;
      }

      const feedbacks = await listSubmissions(user);
      sendJson(response, 200, { feedbacks });
      return;
    }

    if (request.method === "GET" && pathname === "/api/feedbacks/export.csv") {
      const user = await requireUser(request, response);
      if (!user) {
        return;
      }

      const feedbacks = await listSubmissions(user);
      sendCsv(response, "resume-feedback-vault.csv", buildFeedbackCsv(feedbacks));
      return;
    }

    if (request.method === "POST" && pathname === "/api/extract-pdf") {
      const user = await requireUser(request, response);
      if (!user) {
        return;
      }

      const payload = await readRequestBody(request, 12 * 1024 * 1024);

      if (!payload.base64Pdf || typeof payload.base64Pdf !== "string") {
        sendJson(response, 400, { message: "A PDF payload is required." });
        return;
      }

      const pdfBuffer = Buffer.from(payload.base64Pdf, "base64");
      if (!pdfBuffer.toString("latin1", 0, 5).startsWith("%PDF-")) {
        sendJson(response, 400, { message: "Only valid PDF files are supported." });
        return;
      }

      let text = extractPdfText(pdfBuffer);
      let extractionMethod = "embedded-text";
      let ocrPageCount = 0;

      if (!isExtractedTextUsable(text)) {
        try {
          const ocrResult = await ocrPdfBuffer(pdfBuffer, { maxPages: 3 });
          text = String(ocrResult.text || "").trim();
          extractionMethod = "ocr";
          ocrPageCount = Number(ocrResult.pageCount || 0);
        } catch (error) {
          sendJson(response, 422, {
            message: error.message || "OCR fallback was unable to read this PDF."
          });
          return;
        }
      }

      if (!isExtractedTextUsable(text)) {
        sendJson(response, 422, {
          message: "This PDF does not contain enough readable text even after OCR."
        });
        return;
      }

      sendJson(response, 200, {
        message: "PDF text extracted successfully.",
        fileName: String(payload.fileName || "resume.pdf"),
        text,
        textLength: text.length,
        extractionMethod,
        ocrPageCount
      });
      return;
    }

    if (request.method === "GET" && pathname.startsWith("/api/feedbacks/") && pathname.endsWith("/report")) {
      const user = await requireUser(request, response);
      if (!user) {
        return;
      }

      const parts = pathname.split("/").filter(Boolean);
      const feedback = await getSubmission(parts[2], user);

      if (!feedback) {
        sendJson(response, 404, { message: "Feedback record not found." });
        return;
      }

      sendHtml(response, 200, buildReportHtml(feedback));
      return;
    }

    if (request.method === "GET" && pathname.startsWith("/api/feedbacks/")) {
      const user = await requireUser(request, response);
      if (!user) {
        return;
      }

      const id = getIdFromPath(pathname);
      const feedback = await getSubmission(id, user);

      if (!feedback) {
        sendJson(response, 404, { message: "Feedback record not found." });
        return;
      }

      sendJson(response, 200, { feedback });
      return;
    }

    if (request.method === "PATCH" && pathname.startsWith("/api/feedbacks/")) {
      const user = await requireUser(request, response);
      if (!user) {
        return;
      }

      const id = getIdFromPath(pathname);
      const submission = await readRequestBody(request);
      const validation = validateSubmission(submission);

      if (!validation.valid) {
        sendJson(response, 400, {
          message: "Submission validation failed.",
          errors: validation.errors
        });
        return;
      }

      const analysis = analyzeResume(submission);
      const updatedFeedback = await updateSubmission(id, {
        submission,
        analysis,
        user
      });

      if (!updatedFeedback) {
        sendJson(response, 404, { message: "Feedback record not found." });
        return;
      }

      sendJson(response, 200, {
        message: "Feedback updated successfully.",
        feedback: updatedFeedback
      });
      return;
    }

    if (request.method === "DELETE" && pathname.startsWith("/api/feedbacks/")) {
      const user = await requireUser(request, response);
      if (!user) {
        return;
      }

      const id = getIdFromPath(pathname);
      const deleted = await deleteSubmission(id, user);

      if (!deleted) {
        sendJson(response, 404, { message: "Feedback record not found." });
        return;
      }

      sendJson(response, 200, {
        message: "Feedback deleted successfully."
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/feedbacks") {
      const user = await requireUser(request, response);
      if (!user) {
        return;
      }

      const submission = await readRequestBody(request);
      const validation = validateSubmission(submission);

      if (!validation.valid) {
        sendJson(response, 400, {
          message: "Submission validation failed.",
          errors: validation.errors
        });
        return;
      }

      const analysis = analyzeResume(submission);
      const savedFeedback = await createSubmission({
        submission,
        analysis,
        user
      });

      sendJson(response, 201, {
        message: "Feedback generated successfully.",
        feedback: savedFeedback
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/compare") {
      const user = await requireUser(request, response);
      if (!user) {
        return;
      }

      const payload = await readRequestBody(request);

      if (!payload.oldResumeText || !payload.newResumeText) {
        sendJson(response, 400, {
          message: "Both oldResumeText and newResumeText are required for comparison."
        });
        return;
      }

      const comparison = compareResumeVersions(payload);
      sendJson(response, 200, { comparison });
      return;
    }

    if (pathname.startsWith("/api/")) {
      sendJson(response, 404, { message: "API route not found." });
      return;
    }

    await serveStaticFile(pathname, response);
  } catch (error) {
    console.error("Server error:", error);
    const statusCode = error.statusCode || 500;
    sendJson(response, statusCode, {
      message: error.message || "Unexpected server error."
    });
  }
});

server.listen(PORT, () => {
  console.log(`Resume Feedback Tool running on http://localhost:${PORT}`);
});
