const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-only-jwt-secret";

let initializationError = null;
let queryError = null;
const queries = [];
const fakeDatabase = {
  async ensureDatabaseReady() {
    if (initializationError) throw initializationError;
  },
  pool: {
    async query(sql, values = []) {
      if (queryError) throw queryError;
      queries.push({ sql, values });
      if (/^\s*SELECT\b/i.test(sql)) return { rows: [], rowCount: 0 };
      if (/^\s*INSERT\b/i.test(sql)) {
        return { rows: [{ id: 7, user_id: values[0] }], rowCount: 1 };
      }
      if (/^\s*UPDATE\b/i.test(sql)) {
        return { rows: [{ id: values[11], user_id: values[12] }], rowCount: 1 };
      }
      if (/^\s*DELETE\b/i.test(sql)) {
        return { rows: [{ id: values[0] }], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    },
  },
};

const dbPath = path.resolve(__dirname, "../database/db.js");
const dbModule = new Module(dbPath);
dbModule.filename = dbPath;
dbModule.loaded = true;
dbModule.exports = fakeDatabase;
require.cache[dbPath] = dbModule;

const authenticateToken = require("../middleware/authMiddleware");
const capsuleRoutes = require("../routes/capsuleRoutes");
const {
  getCapsules,
  createCapsule,
  updateCapsule,
  deleteCapsule,
} = require("../controllers/capsuleController");

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function signedCookie(claims = { userId: "verified-user-42", username: "capsule-user" }) {
  return `token=${jwt.sign(claims, process.env.JWT_SECRET)}`;
}

function expiredCookie() {
  return signedCookie({ userId: "verified-user-42", exp: Math.floor(Date.now() / 1000) - 1 });
}

function runAuth(cookie) {
  const req = { cookies: cookie ? { token: cookie.slice("token=".length) } : {} };
  const res = createResponse();
  let nextCalls = 0;
  authenticateToken(req, res, () => { nextCalls += 1; });
  return { req, res, nextCalls };
}

function runController(handler, req) {
  const res = createResponse();
  return Promise.resolve(handler(req, res)).then(() => res);
}

test("missing, invalid, and expired JWTs return 401 without reaching protected routes", () => {
  for (const cookie of [undefined, "token=not-a-jwt", expiredCookie()]) {
    const { res, nextCalls } = runAuth(cookie);
    assert.equal(res.statusCode, 401);
    assert.equal(nextCalls, 0);
  }

  const { req, res, nextCalls } = runAuth(signedCookie());
  assert.equal(res.statusCode, 200);
  assert.equal(nextCalls, 1);
  assert.equal(req.user.userId, "verified-user-42");
});

test("GET, POST, PUT, and DELETE routes share JWT protection before database readiness", () => {
  const middleware = capsuleRoutes.stack.filter((layer) => !layer.route);
  assert.equal(middleware[0].handle, authenticateToken);
  assert.equal(typeof middleware[1].handle, "function");

  const routeLayers = capsuleRoutes.stack.filter((layer) => layer.route);
  const methodPaths = routeLayers.map((layer) => ({ path: layer.route.path, methods: layer.route.methods }));
  assert.ok(methodPaths.some(({ path: route, methods }) => route === "/" && methods.get));
  assert.ok(methodPaths.some(({ path: route, methods }) => route === "/" && methods.post));
  assert.ok(methodPaths.some(({ path: route, methods }) => route === "/:id" && methods.put));
  assert.ok(methodPaths.some(({ path: route, methods }) => route === "/:id" && methods.delete));
});

test("authenticated CRUD uses the verified JWT user ID for ownership", async () => {
  const user = { userId: "verified-user-42" };
  const body = {
    project_name: "My project",
    prompt_title: "A prompt",
    prompt_text: "Generate a helpful response",
    user_id: "attacker-supplied-user",
  };
  queries.length = 0;

  let res = await runController(getCapsules, { user, params: {}, body: {} });
  assert.equal(res.statusCode, 200);
  assert.equal(queries.at(-1).values[0], user.userId);

  res = await runController(createCapsule, { user, params: {}, body });
  assert.equal(res.statusCode, 201);
  assert.equal(queries.at(-1).values[0], user.userId);

  res = await runController(updateCapsule, { user, params: { id: "7" }, body });
  assert.equal(res.statusCode, 200);
  assert.equal(queries.at(-1).values[12], user.userId);

  res = await runController(deleteCapsule, { user, params: { id: "7" }, body: {} });
  assert.equal(res.statusCode, 200);
  assert.equal(queries.at(-1).values[1], user.userId);
});

test("required whitespace is rejected and database failures stay 500 errors", async () => {
  let res = await runController(createCapsule, {
    user: { userId: "verified-user-42" },
    params: {},
    body: { project_name: "  ", prompt_title: "Title", prompt_text: "Text" },
  });
  assert.equal(res.statusCode, 400);

  queryError = new Error("Neon query timeout");
  res = await runController(getCapsules, {
    user: { userId: "verified-user-42" },
    params: {},
    body: {},
  });
  queryError = null;
  assert.equal(res.statusCode, 500);
});

test("database readiness errors pass to the server error handler", async () => {
  const readiness = capsuleRoutes.stack.filter((layer) => !layer.route)[1].handle;
  initializationError = new Error("Neon initialization timeout");
  let forwardedError;

  await readiness({ user: { userId: "verified-user-42" } }, createResponse(), (error) => {
    forwardedError = error;
  });

  initializationError = null;
  assert.match(forwardedError.message, /Neon initialization timeout/);
});

test.after(() => {
  delete require.cache[dbPath];
});
