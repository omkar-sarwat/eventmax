/* eslint-disable no-console */
const axios = require('axios');

const BASE = process.env.API_BASE_URL || 'http://localhost:4000/api';
const ITERATIONS = parseInt(process.env.ITER || '5', 10);
const WARMUP = parseInt(process.env.WARMUP || '2', 10);
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '1', 10);
const TIMEOUT = parseInt(process.env.TIMEOUT || '10000', 10);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function stats(samples) {
  if (!samples.length) return { count: 0 };
  const sorted = [...samples].sort((a, b) => a - b);
  const p = q => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
  const sum = samples.reduce((s, v) => s + v, 0);
  return {
    count: samples.length,
    min: sorted[0],
    p50: p(0.5),
    p90: p(0.9),
    p95: p(0.95),
    max: sorted[sorted.length - 1],
    avg: +(sum / samples.length).toFixed(1)
  };
}

async function timed(fn) {
  const start = performance.now();
  try {
    const res = await fn();
    const ms = performance.now() - start;
    return { ok: true, ms, res };
  } catch (err) {
    const ms = performance.now() - start;
    return { ok: false, ms, err };
  }
}

function endpoint(name, method, path, opts = {}) {
  return { name, method, path, ...opts };
}

const endpoints = [
  endpoint('health', 'get', '/health'),
  endpoint('ping', 'get', '/ping'),
  endpoint('api-root', 'get', '/'),
  endpoint('events-list', 'get', '/events', { params: { limit: 12 } }),
  endpoint('events-categories', 'get', '/events/categories'),
  endpoint('events-v1-list', 'get', '/v1/events', { params: { limit: 12 } }),
  // Booking endpoints require auth; skip by default unless TOKEN provided
  endpoint('bookings-my', 'get', '/bookings/my-bookings', { auth: true, optional: true }),
  // Auth endpoints
  endpoint('auth-login', 'post', '/auth/login', { body: { email: process.env.TEST_EMAIL || 'user@example.com', password: process.env.TEST_PASSWORD || 'Password123!' } }),
  endpoint('auth-profile', 'get', '/auth/profile', { auth: true, optional: true }),
];

async function runEndpoint(ep, client, tokenRef) {
  const url = BASE + ep.path;
  const config = { timeout: TIMEOUT, params: ep.params };
  if (ep.auth) {
    if (!tokenRef.token && ep.optional) return { skipped: true };
    config.headers = { Authorization: `Bearer ${tokenRef.token}` };
  }
  const call = () => client[ep.method](url, ep.body, config);
  return await timed(call);
}

async function authenticate(client) {
  const loginEp = endpoints.find(e => e.name === 'auth-login');
  const result = await runEndpoint(loginEp, client, { token: null });
  if (result.ok) {
    const data = result.res.data?.data || result.res.data;
    const token = data?.tokens?.accessToken || data?.accessToken || data?.token;
    return { token, ms: result.ms };
  }
  return { token: null, ms: result.ms };
}

async function run() {
  globalThis.performance = require('perf_hooks').performance;
  const client = axios.create({ timeout: TIMEOUT });

  const tokenRef = { token: process.env.TOKEN || null };
  if (!tokenRef.token) {
    const auth = await authenticate(client);
    tokenRef.token = auth.token;
  }

  const results = {};

  for (const ep of endpoints) {
    // Skip optional auth endpoints if no token
    if (ep.auth && ep.optional && !tokenRef.token) {
      results[ep.name] = { skipped: true };
      continue;
    }

    // Warmup
    for (let i = 0; i < WARMUP; i++) {
      await runEndpoint(ep, client, tokenRef);
      await sleep(50);
    }

    const samples = [];
    let failures = 0;

    const perBatch = async () => {
      const tasks = [];
      for (let c = 0; c < CONCURRENCY; c++) {
        tasks.push(runEndpoint(ep, client, tokenRef));
      }
      const batch = await Promise.all(tasks);
      for (const r of batch) {
        if (r.ok) samples.push(+r.ms.toFixed(1)); else failures++;
      }
    };

    for (let i = 0; i < ITERATIONS; i++) {
      await perBatch();
      await sleep(50);
    }

    results[ep.name] = { stats: stats(samples), failures };
  }

  // Report
  const fmt = (n) => (n === undefined ? '-' : `${n.toFixed ? n.toFixed(1) : n}`.padStart(6));
  console.log(`\nLatency Report (base: ${BASE})`);
  console.log('endpoint           count    min    p50    p90    p95    max    avg  fail');
  for (const [name, r] of Object.entries(results)) {
    if (r.skipped) {
      console.log(`${name.padEnd(18)}   skipped`);
      continue;
    }
    const s = r.stats || {};
    console.log(
      `${name.padEnd(18)} ${String(s.count || 0).padStart(6)} ${fmt(s.min)} ${fmt(s.p50)} ${fmt(s.p90)} ${fmt(s.p95)} ${fmt(s.max)} ${fmt(s.avg)} ${String(r.failures || 0).padStart(5)}`
    );
  }
}

run().catch((e) => {
  console.error('Latency test failed:', e.message);
  process.exit(1);
});


