/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EVENTMAX K6 SMOKE TEST (Quick Validation)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * A quick test to verify all API endpoints are working.
 * Use this before running full load tests.
 * 
 * Run: k6 run tests/k6/smoke-test.js
 * ═══════════════════════════════════════════════════════════════════════════
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';
const errorRate = new Rate('errors');

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    'http_req_duration': ['p(99)<1000'],
    'errors': ['rate<0.1'],
  },
};

export default function() {
  // Test 1: Health Check
  let res = http.get(`${BASE_URL}/health`);
  check(res, {
    '✅ Health: status 200': (r) => r.status === 200,
    '✅ Health: response time < 100ms': (r) => r.timings.duration < 100,
  });
  
  sleep(0.5);
  
  // Test 2: API Info
  res = http.get(`${BASE_URL}/info`);
  check(res, {
    '✅ Info: status 200': (r) => r.status === 200,
  });
  
  sleep(0.5);
  
  // Test 3: Events List
  res = http.get(`${BASE_URL}/api/events`);
  check(res, {
    '✅ Events: status 200': (r) => r.status === 200,
    '✅ Events: response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(res.status !== 200);
  
  sleep(0.5);
  
  // Test 4: Featured Events
  res = http.get(`${BASE_URL}/api/events/featured`);
  check(res, {
    '✅ Featured: status 200 or 404': (r) => r.status === 200 || r.status === 404,
  });
  
  sleep(0.5);
  
  // Test 5: Categories
  res = http.get(`${BASE_URL}/api/events/categories`);
  check(res, {
    '✅ Categories: status 200 or 404': (r) => r.status === 200 || r.status === 404,
  });
  
  sleep(1);
}

export function handleSummary(data) {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  SMOKE TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const metrics = data.metrics;
  
  console.log(`  Total Requests:     ${metrics.http_reqs.values.count}`);
  console.log(`  Failed Requests:    ${metrics.http_req_failed?.values?.passes || 0}`);
  console.log(`  Avg Response Time:  ${metrics.http_req_duration.values.avg.toFixed(2)}ms`);
  console.log(`  P95 Response Time:  ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`);
  console.log(`  P99 Response Time:  ${metrics.http_req_duration.values['p(99)'].toFixed(2)}ms`);
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  return {
    stdout: JSON.stringify(data, null, 2),
  };
}
