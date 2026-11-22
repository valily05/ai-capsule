const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");

const databaseModulePath = path.join(__dirname, "../database/db.js");
const originalLoad = Module._load;
const originalEnvironment = {
  DATABASE_URL: process.env.DATABASE_URL,
  VERCEL: process.env.VERCEL,
  VERCEL_ENV: process.env.VERCEL_ENV,
  VERCEL_URL: process.env.VERCEL_URL,
  NODE_ENV: process.env.NODE_ENV,
};

let databaseModule;
let poolInstances = 0;
let poolOptions;
let attachedPoolCount = 0;
let initCalls = 0;
let releaseConnectionCalled = false;
let queryHandler;

class FakePool {
  constructor(options) {
    poolInstances += 1;
    poolOptions = options;
    this.listeners = new Map();
  }

  on(event, listener) {
    this.listeners.set(event, listener);
    return this;
  }

  query(...args) {
    initCalls += 1;
    return queryHandler(...args);
  }

  connect() {
    releaseConnectionCalled = true;
    throw new Error("Initialization must not acquire and manually release a client.");
  }
}

function resetDatabaseModule() {
  poolInstances = 0;
  poolOptions = undefined;
  attachedPoolCount = 0;
  initCalls = 0;
  releaseConnectionCalled = false;
  queryHandler = async () => ({ rows: [], rowCount: 0 });

  process.env.DATABASE_URL = "postgresql://test.invalid/testdb";
  process.env.VERCEL = "1";
  delete process.env.VERCEL_ENV;
  delete process.env.VERCEL_URL;
  delete process.env.NODE_ENV;

  delete require.cache[databaseModulePath];
  Module._load = function (request, parent, isMain) {
    if (request === "pg") return { Pool: FakePool };
    if (request === "@vercel/functions") {
      return {
        attachDatabasePool(pool) {
          assert.ok(pool instanceof FakePool);
          attachedPoolCount += 1;
        },
      };
    }
    return originalLoad.call(this, request, parent, isMain);
  };

  databaseModule = require(databaseModulePath);
}

test.before(() => resetDatabaseModule());

test.after(() => {
  Module._load = originalLoad;
  delete require.cache[databaseModulePath];
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test("shares one configured Vercel pool and one concurrent initialization", async () => {
  let resolveQuery;
  queryHandler = () => new Promise((resolve) => { resolveQuery = resolve; });

  const first = databaseModule.ensureDatabaseReady();
  const second = databaseModule.ensureDatabaseReady();
  const third = databaseModule.ensureDatabaseReady();

  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(poolInstances, 1);
  assert.equal(attachedPoolCount, 1);
  assert.equal(initCalls, 1);
  assert.equal(releaseConnectionCalled, false);
  assert.equal(poolOptions.max, 5);
  assert.equal(poolOptions.connectionTimeoutMillis, 10000);
  assert.equal(poolOptions.idleTimeoutMillis, 5000);
  assert.equal(poolOptions.query_timeout, 10000);
  assert.equal(poolOptions.statement_timeout, 10000);

  resolveQuery({ rows: [], rowCount: 0 });
  await Promise.all([first, second, third]);

  await databaseModule.ensureDatabaseReady();
  assert.equal(initCalls, 1, "ready initialization should be cached for this instance");
});

test("clears a failed initialization promise so a later request can retry", async () => {
  resetDatabaseModule();
  let attempts = 0;
  queryHandler = async () => {
    attempts += 1;
    if (attempts === 1) throw new Error("temporary Neon timeout");
    return { rows: [], rowCount: 0 };
  };

  await assert.rejects(databaseModule.ensureDatabaseReady(), /temporary Neon timeout/);
  await databaseModule.ensureDatabaseReady();
  await databaseModule.ensureDatabaseReady();

  assert.equal(poolInstances, 1, "retries should reuse the instance pool");
  assert.equal(attempts, 2);
  assert.equal(attachedPoolCount, 1);
});
