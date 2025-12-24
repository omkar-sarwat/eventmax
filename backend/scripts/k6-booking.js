import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuration via env
const BASE = __ENV.API_BASE_URL || 'http://localhost:4000/api';
const EVENT_ID = __ENV.EVENT_ID || 'replace-event-id';
const ITER = parseInt(__ENV.ITER || '1000', 10);
const DURATION = __ENV.DURATION || '1m';
const ARRIVAL_RATE = parseInt(__ENV.ARRIVAL_RATE || '50', 10); // requests/sec - reduced for 16GB RAM
const MAX_VUS = parseInt(__ENV.MAX_VUS || '100', 10); // reduced for 16GB RAM
const PAUSE_MS = parseInt(__ENV.PAUSE_MS || '50', 10);

// Auth
const TEST_EMAIL = __ENV.TEST_EMAIL || '';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || '';
let TOKEN = __ENV.TOKEN || '';

// Two scenarios: a) arrival-rate to simulate large concurrency, b) fixed iterations
export const options = {
  scenarios: {
    arrival_rate: {
      executor: 'constant-arrival-rate',
      rate: ARRIVAL_RATE, // iterations per second
      timeUnit: '1s',
      duration: DURATION,
      preAllocatedVUs: Math.min(MAX_VUS, ARRIVAL_RATE),
      maxVUs: MAX_VUS,
      exec: 'bookingFlow',
      startTime: '0s',
    },
    fixed_work: {
      executor: 'shared-iterations',
      vus: Math.min(MAX_VUS, 500),
      iterations: ITER,
      maxDuration: DURATION,
      exec: 'bookingFlow',
      startTime: '0s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'], // relaxed for 16GB RAM
    http_req_duration: [
      'p(90)<500',  // relaxed for 16GB RAM
      'p(95)<1000', // relaxed for 16GB RAM
      'p(99)<2000', // relaxed for 16GB RAM
    ],
  },
};

export function setup() {
  if (!TOKEN && TEST_EMAIL && TEST_PASSWORD) {
    const res = http.post(`${BASE}/auth/login`, JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }), {
      headers: { 'Content-Type': 'application/json' },
      timeout: '10s',
    });
    check(res, { 'login 200': (r) => r.status === 200 });
    try {
      const data = res.json()?.data || res.json();
      TOKEN = data?.tokens?.accessToken || data?.accessToken || '';
    } catch (e) {}
  }
  return { token: TOKEN };
}

export function bookingFlow(data) {
  const token = data?.token || TOKEN;
  const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

  // Reserve seats
  const reserveBody = JSON.stringify({ seats: __ENV.SEATS ? __ENV.SEATS.split(',') : ['A1'] });
  const reserve = http.post(`${BASE}/events/${EVENT_ID}/reserve`, reserveBody, { headers });

  check(reserve, {
    'reserve status OK/201/200': (r) => r.status === 200 || r.status === 201,
  });

  // Confirm booking (best effort even if reserve is mocked)
  const confirmBody = JSON.stringify({ seats: __ENV.SEATS ? __ENV.SEATS.split(',') : ['A1'] });
  const confirm = http.post(`${BASE}/events/${EVENT_ID}/confirm`, confirmBody, { headers });

  check(confirm, {
    'confirm status OK/201/200': (r) => r.status === 200 || r.status === 201,
  });

  sleep(PAUSE_MS / 1000);
}

export function teardown() {}


