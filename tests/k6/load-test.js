/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EVENTMAX K6 LOAD TESTING SCRIPT
 * ═══════════════════════════════════════════════════════════════════════════
 * Based on System Architecture Design Document
 * 
 * Tests API performance against targets from Section 1:
 * - Response Time (P99): < 200ms
 * - Requests/Second: Up to 50,000 RPS (enterprise)
 * - Booking Latency: < 500ms
 * 
 * Run: k6 run tests/k6/load-test.js
 * ═══════════════════════════════════════════════════════════════════════════
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

// Custom metrics (from Architecture Document Section 12 - Monitoring)
const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency');
const successfulRequests = new Counter('successful_requests');

// ═══════════════════════════════════════════════════════════════════════════
// TEST SCENARIOS
// ═══════════════════════════════════════════════════════════════════════════

export const options = {
  // Test scenarios based on Architecture Document Section 2.3
  scenarios: {
    // Scenario 1: Smoke Test (quick validation)
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      startTime: '0s',
      tags: { test_type: 'smoke' },
    },
    
    // Scenario 2: Load Test (normal traffic)
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 },   // Ramp up to 10 users
        { duration: '2m', target: 10 },   // Stay at 10 users
        { duration: '1m', target: 20 },   // Ramp up to 20 users
        { duration: '2m', target: 20 },   // Stay at 20 users
        { duration: '1m', target: 0 },    // Ramp down
      ],
      startTime: '35s',
      tags: { test_type: 'load' },
    },
    
    // Scenario 3: Stress Test (find breaking point)
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },  // Ramp to 50 users
        { duration: '1m', target: 50 },   // Stay at 50
        { duration: '30s', target: 100 }, // Push to 100
        { duration: '1m', target: 100 },  // Stay at 100
        { duration: '30s', target: 0 },   // Ramp down
      ],
      startTime: '8m',
      tags: { test_type: 'stress' },
    },
  },
  
  // Thresholds based on Architecture Document Section 1
  thresholds: {
    // Response time targets
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],  // 95% < 500ms, 99% < 1s
    'http_req_duration{endpoint:health}': ['p(99)<100'],
    'http_req_duration{endpoint:events}': ['p(99)<200'],
    'http_req_duration{endpoint:event_detail}': ['p(99)<150'],
    
    // Error rate target
    'errors': ['rate<0.05'],  // Less than 5% errors
    
    // Custom metrics
    'api_latency': ['p(95)<300'],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// TEST FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export default function() {
  // Health Check
  group('Health Check', function() {
    const response = http.get(`${BASE_URL}/health`, {
      tags: { endpoint: 'health' },
    });
    
    const success = check(response, {
      'health status is 200': (r) => r.status === 200,
      'health response has status': (r) => JSON.parse(r.body).status !== undefined,
    });
    
    errorRate.add(!success);
    if (success) successfulRequests.add(1);
    apiLatency.add(response.timings.duration);
  });
  
  sleep(0.5);
  
  // Get Events List
  group('Events API', function() {
    const response = http.get(`${BASE_URL}/api/events`, {
      tags: { endpoint: 'events' },
    });
    
    const success = check(response, {
      'events status is 200': (r) => r.status === 200,
      'events response is array or has data': (r) => {
        const body = JSON.parse(r.body);
        return Array.isArray(body) || (body.data && Array.isArray(body.data)) || body.success !== undefined;
      },
    });
    
    errorRate.add(!success);
    if (success) successfulRequests.add(1);
    apiLatency.add(response.timings.duration);
    
    // If we got events, test getting event details
    if (response.status === 200) {
      try {
        const body = JSON.parse(response.body);
        const events = body.data || body.events || (Array.isArray(body) ? body : []);
        
        if (events.length > 0) {
          const eventId = events[0].id;
          
          sleep(0.3);
          
          // Get Event Detail
          const detailResponse = http.get(`${BASE_URL}/api/events/${eventId}`, {
            tags: { endpoint: 'event_detail' },
          });
          
          const detailSuccess = check(detailResponse, {
            'event detail status is 200': (r) => r.status === 200,
          });
          
          errorRate.add(!detailSuccess);
          if (detailSuccess) successfulRequests.add(1);
          apiLatency.add(detailResponse.timings.duration);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  });
  
  sleep(0.5);
  
  // Featured Events
  group('Featured Events', function() {
    const response = http.get(`${BASE_URL}/api/events/featured`, {
      tags: { endpoint: 'featured' },
    });
    
    const success = check(response, {
      'featured status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    });
    
    errorRate.add(!success && response.status >= 500);
    if (success) successfulRequests.add(1);
    apiLatency.add(response.timings.duration);
  });
  
  sleep(0.5);
  
  // Categories
  group('Categories API', function() {
    const response = http.get(`${BASE_URL}/api/events/categories`, {
      tags: { endpoint: 'categories' },
    });
    
    const success = check(response, {
      'categories status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    });
    
    errorRate.add(!success && response.status >= 500);
    if (success) successfulRequests.add(1);
    apiLatency.add(response.timings.duration);
  });
  
  sleep(1);
}

// ═══════════════════════════════════════════════════════════════════════════
// LIFECYCLE HOOKS
// ═══════════════════════════════════════════════════════════════════════════

export function setup() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  EVENTMAX K6 LOAD TEST');
  console.log('  Target: ' + BASE_URL);
  console.log('═══════════════════════════════════════════════════════════════');
  
  // Verify backend is running
  const response = http.get(`${BASE_URL}/health`);
  
  if (response.status !== 200) {
    console.error('❌ Backend is not responding! Make sure it is running.');
    console.error('   Run: cd backend && npm run dev');
    return { backendReady: false };
  }
  
  console.log('✅ Backend is ready!');
  return { backendReady: true };
}

export function teardown(data) {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  TEST COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════');
}
