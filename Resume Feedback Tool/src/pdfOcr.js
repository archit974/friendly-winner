const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const util = require("util");
const { execFile } = require("child_process");

const execFileAsync = util.promisify(execFile);
const TEMP_DIR = path.join(__dirname, "..", "data", "tmp");
const OCR_SCRIPT_PATH = path.join(__dirname, "..", "scripts", "ocr-pdf.ps1");

function parseScriptOutput(stdout) {
  const lines = String(stdout || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    throw new Error("OCR script did not return any output.");
  }

  return JSON.parse(lines[lines.length - 1]);
}

async function ocrPdfBuffer(pdfBuffer, options = {}) {
  const maxPages = Number.isFinite(options.maxPages) ? Math.max(1, options.maxPages) : 3;
  await fs.mkdir(TEMP_DIR, { recursive: true });

  const tempFilePath = path.join(TEMP_DIR, `${crypto.randomUUID()}.pdf`);
  await fs.writeFile(tempFilePath, pdfBuffer);

  try {
    const { stdout, stderr } = await execFileAsync(
      "powershell",
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        OCR_SCRIPT_PATH,
        "-PdfPath",
        tempFilePath,
        "-MaxPages",
        String(maxPages)
      ],
      {
        windowsHide: true,
        maxBuffer: 12 * 1024 * 1024
      }
    );

    if (stderr && stderr.trim()) {
      throw new Error(stderr.trim());
    }

    return parseScriptOutput(stdout);
  } catch (error) {
    const message = error.stderr?.trim() || error.stdout?.trim() || error.message;
    throw new Error(`OCR extraction failed. ${message}`);
  } finally {
    await fs.unlink(tempFilePath).catch(() => {});
  }
}

module.exports = {
  ocrPdfBuffer
};
