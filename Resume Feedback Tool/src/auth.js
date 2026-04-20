const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "..", "data");
const AUTH_FILE = path.join(DATA_DIR, "users.json");
const SESSION_DAYS = 7;

async function ensureAuthStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(AUTH_FILE);
  } catch (error) {
    await fs.writeFile(AUTH_FILE, JSON.stringify({ users: [], sessions: [] }, null, 2));
  }
}

async function readAuthStore() {
  await ensureAuthStore();
  const raw = await fs.readFile(AUTH_FILE, "utf-8");
  const parsed = JSON.parse(raw);
  parsed.users = Array.isArray(parsed.users) ? parsed.users : [];
  parsed.sessions = Array.isArray(parsed.sessions) ? parsed.sessions : [];
  return parsed;
}

async function writeAuthStore(store) {
  await fs.writeFile(AUTH_FILE, JSON.stringify(store, null, 2));
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(String(password), salt, 120000, 64, "sha512").toString("hex");
  return { salt, hash };
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

function getTokenFromRequest(request) {
  const header = request.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : "";
}

function isExpired(session) {
  return new Date(session.expiresAt) <= new Date();
}

async function signupUser({ name, email, password }) {
  const store = await readAuthStore();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const displayName = String(name || "").trim();

  if (displayName.length < 2) {
    const error = new Error("Name must be at least 2 characters.");
    error.statusCode = 400;
    throw error;
  }
  if (!/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(normalizedEmail)) {
    const error = new Error("A valid email is required.");
    error.statusCode = 400;
    throw error;
  }
  if (String(password || "").length < 6) {
    const error = new Error("Password must be at least 6 characters.");
    error.statusCode = 400;
    throw error;
  }
  if (store.users.some((user) => user.email === normalizedEmail)) {
    const error = new Error("An account with this email already exists.");
    error.statusCode = 409;
    throw error;
  }

  const { salt, hash } = hashPassword(password);
  const developerEmail = String(process.env.DEVELOPER_EMAIL || "").trim().toLowerCase();
  const role = store.users.length === 0 || (developerEmail && normalizedEmail === developerEmail) ? "developer" : "user";
  const user = {
    id: crypto.randomUUID(),
    name: displayName,
    email: normalizedEmail,
    role,
    passwordSalt: salt,
    passwordHash: hash,
    createdAt: new Date().toISOString()
  };

  store.users.push(user);
  await writeAuthStore(store);
  return createSessionForUser(user.id);
}

async function createSessionForUser(userId) {
  const store = await readAuthStore();
  const user = store.users.find((item) => item.id === userId);

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  store.sessions = store.sessions.filter((session) => !isExpired(session));
  store.sessions.push({
    tokenHash,
    userId: user.id,
    createdAt: new Date().toISOString(),
    expiresAt
  });
  await writeAuthStore(store);

  return {
    token,
    expiresAt,
    user: publicUser(user)
  };
}

async function loginUser({ email, password }) {
  const store = await readAuthStore();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const user = store.users.find((item) => item.email === normalizedEmail);

  if (!user) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  const { hash } = hashPassword(password, user.passwordSalt);
  const stored = Buffer.from(user.passwordHash, "hex");
  const supplied = Buffer.from(hash, "hex");

  if (stored.length !== supplied.length || !crypto.timingSafeEqual(stored, supplied)) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  return createSessionForUser(user.id);
}

async function getUserFromRequest(request) {
  const token = getTokenFromRequest(request);

  if (!token) {
    return null;
  }

  const store = await readAuthStore();
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const session = store.sessions.find((item) => item.tokenHash === tokenHash);

  if (!session || isExpired(session)) {
    return null;
  }

  const user = store.users.find((item) => item.id === session.userId);
  return user ? publicUser(user) : null;
}

async function logoutUser(request) {
  const token = getTokenFromRequest(request);

  if (!token) {
    return;
  }

  const store = await readAuthStore();
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  store.sessions = store.sessions.filter((session) => session.tokenHash !== tokenHash);
  await writeAuthStore(store);
}

module.exports = {
  getUserFromRequest,
  loginUser,
  logoutUser,
  signupUser
};
