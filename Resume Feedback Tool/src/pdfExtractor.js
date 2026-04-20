const zlib = require("zlib");

function decodePdfLiteral(value) {
  let output = "";

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];

    if (char !== "\\") {
      output += char;
      continue;
    }

    index += 1;
    const escaped = value[index];

    if (escaped === undefined) {
      break;
    }

    const escapeMap = {
      n: "\n",
      r: "\r",
      t: "\t",
      b: "\b",
      f: "\f",
      "(": "(",
      ")": ")",
      "\\": "\\"
    };

    if (escapeMap[escaped]) {
      output += escapeMap[escaped];
      continue;
    }

    if (escaped === "\n" || escaped === "\r") {
      if (escaped === "\r" && value[index + 1] === "\n") {
        index += 1;
      }
      continue;
    }

    if (/[0-7]/.test(escaped)) {
      let octal = escaped;
      while (octal.length < 3 && /[0-7]/.test(value[index + 1] || "")) {
        index += 1;
        octal += value[index];
      }
      output += String.fromCharCode(parseInt(octal, 8));
      continue;
    }

    output += escaped;
  }

  return output;
}

function decodeUtf16Be(buffer) {
  const swapped = Buffer.alloc(buffer.length);
  for (let index = 0; index < buffer.length; index += 2) {
    swapped[index] = buffer[index + 1];
    swapped[index + 1] = buffer[index];
  }
  return swapped.toString("utf16le");
}

function decodePdfHex(value) {
  const clean = value.replace(/\s+/g, "");
  if (!clean || clean.length % 2 !== 0) {
    return "";
  }

  const buffer = Buffer.from(clean, "hex");
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    return decodeUtf16Be(buffer.subarray(2));
  }

  return buffer.toString("utf8");
}

function cleanupExtractedText(text) {
  return text
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isExtractedTextUsable(text) {
  const cleaned = cleanupExtractedText(String(text || ""));
  if (cleaned.length < 40) {
    return false;
  }

  const nonPrintableCount = (cleaned.match(/[^\x09\x0A\x0D\x20-\x7E]/g) || []).length;
  if (nonPrintableCount / cleaned.length > 0.05) {
    return false;
  }

  const readableWordCount = (cleaned.match(/\b[A-Za-z][A-Za-z0-9+#./&'-]{1,}\b/g) || []).length;
  if (readableWordCount < 6) {
    return false;
  }

  const alphaCount = (cleaned.match(/[A-Za-z]/g) || []).length;
  return alphaCount / cleaned.length > 0.35;
}

function attemptInflate(buffer) {
  const candidates = [buffer];

  if (buffer.length > 2) {
    candidates.push(buffer.subarray(0, buffer.length - 1));
    candidates.push(buffer.subarray(0, buffer.length - 2));
  }

  for (const candidate of candidates) {
    try {
      return zlib.inflateSync(candidate);
    } catch (error) {
      continue;
    }
  }

  return null;
}

function getStreamHeader(rawPdf, streamIndex) {
  const headerStart = rawPdf.lastIndexOf("<<", streamIndex);
  if (headerStart === -1) {
    return "";
  }

  const headerEnd = rawPdf.indexOf(">>", headerStart);
  if (headerEnd === -1 || headerEnd > streamIndex) {
    return "";
  }

  return rawPdf.slice(headerStart, headerEnd + 2);
}

function extractStreams(rawPdf) {
  const streams = [];
  let cursor = 0;

  while (cursor < rawPdf.length) {
    const streamIndex = rawPdf.indexOf("stream", cursor);
    if (streamIndex === -1) {
      break;
    }

    let dataStart = streamIndex + 6;
    if (rawPdf[dataStart] === "\r" && rawPdf[dataStart + 1] === "\n") {
      dataStart += 2;
    } else if (rawPdf[dataStart] === "\n") {
      dataStart += 1;
    }

    const endStreamIndex = rawPdf.indexOf("endstream", dataStart);
    if (endStreamIndex === -1) {
      break;
    }

    streams.push({
      header: getStreamHeader(rawPdf, streamIndex),
      content: rawPdf.slice(dataStart, endStreamIndex)
    });

    cursor = endStreamIndex + "endstream".length;
  }

  return streams;
}

function extractTextTokens(content) {
  const blocks = content.match(/BT[\s\S]*?ET/g) || [];
  const sources = blocks.length > 0 ? blocks : [content];
  const tokens = [];

  for (const source of sources) {
    const matches = source.matchAll(/\((?:\\.|[^\\()])*\)|<([0-9A-Fa-f\s]+)>/g);
    for (const match of matches) {
      const token = match[0].startsWith("(")
        ? decodePdfLiteral(match[0].slice(1, -1))
        : decodePdfHex(match[1]);

      const cleanToken = token.replace(/\s+/g, " ").trim();
      if (cleanToken) {
        tokens.push(cleanToken);
      }
    }
  }

  return tokens;
}

function fallbackPrintableText(rawPdf) {
  const candidates = rawPdf.match(/[A-Za-z][A-Za-z0-9@:/,+%().\- ]{6,}/g) || [];
  const filtered = candidates.filter((item) => {
    const lower = item.toLowerCase();
    return !lower.startsWith("obj") &&
      !lower.startsWith("endobj") &&
      !lower.startsWith("stream") &&
      !lower.startsWith("endstream") &&
      !lower.startsWith("type /") &&
      !lower.startsWith("xref") &&
      !lower.startsWith("trailer");
  });

  return cleanupExtractedText(filtered.join("\n"));
}

function extractPdfText(pdfBuffer) {
  const rawPdf = pdfBuffer.toString("latin1");
  const streams = extractStreams(rawPdf);
  const textParts = [];

  for (const stream of streams) {
    const streamBuffer = Buffer.from(stream.content, "latin1");
    let decoded = stream.content;

    if (/FlateDecode/.test(stream.header)) {
      const inflated = attemptInflate(streamBuffer);
      if (inflated) {
        decoded = inflated.toString("latin1");
      }
    }

    const tokens = extractTextTokens(decoded);
    if (tokens.length > 0) {
      textParts.push(tokens.join("\n"));
    }
  }

  const extracted = cleanupExtractedText(textParts.join("\n\n"));
  if (extracted.length >= 40) {
    return extracted;
  }

  return fallbackPrintableText(rawPdf);
}

module.exports = {
  extractPdfText,
  isExtractedTextUsable
};
