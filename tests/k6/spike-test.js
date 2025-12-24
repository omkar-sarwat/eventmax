/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EVENTMAX K6 SPIKE TEST
 * ═══════════════════════════════════════════════════════════════════════════
 * Based on System Architecture Design Document - Section 4.1
 * 
 * Simulates Flash Sale scenario:
 * "T-0: Flash sale starts, traffic spike detected"
 * "T+30sec: HPA triggers, scales to 100 pods"
 * 
 * Tests how the system handles sudden traffic spikes.
 * 
 * Run: k6 run tests/k6/spike-test.js
 * ═══════════════════════════════════════════════════════════════════════════
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

const errorRate = new Rate('errors');
const spikeLatency = new Trend('spike_latency');
const requestCount = new Counter('total_requests');

export const options = {
  scenarios: {
    // Simulate flash sale spike
    flash_sale_spike: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '10s', target: 5 },    // Normal traffic
        { duration: '5s', target: 50 },    // SPIKE! 10x increase
        { duration: '30s', target: 50 },   // Sustained spike
        { duration: '10s', target: 100 },  // Push harder
        { duration: '30s', target: 100 },  // Max load
        { duration: '10s', target: 5 },    // Sudden drop
        { duration: '10s', target: 0 },    // Ramp down
      ],
    },
  },
  thresholds: {
    // During spike, we expect some degradation but should still work
    'http_req_duration': ['p(95)<2000'],  // 95% under 2 seconds even during spike
    'errors': ['rate<0.2'],                // Accept up to 20% errors during spike
    'spike_latency': ['avg<1000'],         // Average should stay under 1s
  },
};

export default function() {
  const startTime = new Date();
  
  // Simulate user browsing during flash sale
  const responses = http.batch([
    ['GET', `${BASE_URL}/api/events`, null, { tags: { name: 'events' } }],
    ['GET', `${BASE_URL}/api/events/featured`, null, { tags: { name: 'featured' } }],
  ]);
  
  responses.forEach((res, idx) => {
    const success = check(res, {
      'status is 200 or 404': (r) => r.status === 200 || r.status === 404,
      'not server error': (r) => r.status < 500,
    });
    
    errorRate.add(!success);
    requestCount.add(1);
    spikeLatency.add(res.timings.duration);
  });
  
  // Small sleep to prevent overwhelming local machine
  sleep(0.1);
}

export function handleSummary(data) {
  const metrics = data.metrics;
  
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  ⚡ SPIKE TEST RESULTS');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Total Requests:      ${metrics.http_reqs?.values?.count || 0}`);
  console.log(`  Error Rate:          ${(metrics.errors?.values?.rate * 100 || 0).toFixed(2)}%`);
  console.log(`  Avg Response Time:   ${metrics.http_req_duration?.values?.avg?.toFixed(2) || 0}ms`);
  console.log(`  P95 Response Time:   ${metrics.http_req_duration?.values['p(95)']?.toFixed(2) || 0}ms`);
  console.log(`  P99 Response Time:   ${metrics.http_req_duration?.values['p(99)']?.toFixed(2) || 0}ms`);
  console.log(`  Max Response Time:   ${metrics.http_req_duration?.values?.max?.toFixed(2) || 0}ms`);
  console.log('═══════════════════════════════════════════════════════════════');
  
  // Check if thresholds passed
  const passed = !data.root_group?.checks?.some(c => c.fails > 0);
  console.log(passed ? '  ✅ SPIKE TEST PASSED!' : '  ⚠️  SPIKE TEST HAD ISSUES');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  return {};
}
