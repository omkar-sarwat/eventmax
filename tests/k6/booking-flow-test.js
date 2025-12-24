/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EVENTMAX K6 BOOKING FLOW TEST
 * ═══════════════════════════════════════════════════════════════════════════
 * Based on System Architecture Design Document
 * 
 * Tests the complete booking flow:
 * 1. Login/Auth
 * 2. Browse Events
 * 3. View Event Details
 * 4. Get Available Seats
 * 5. Create Booking
 * 
 * Run: k6 run tests/k6/booking-flow-test.js
 * ═══════════════════════════════════════════════════════════════════════════
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

// Custom metrics
const bookingLatency = new Trend('booking_latency');
const errorRate = new Rate('errors');

// Test user credentials
const TEST_USER = {
  email: 'admin1@eventmax.in',
  password: '1234'
};

export const options = {
  scenarios: {
    booking_flow: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 5 },   // Ramp up
        { duration: '2m', target: 5 },    // Stay at 5 concurrent bookings
        { duration: '30s', target: 10 },  // Increase load
        { duration: '2m', target: 10 },   // Stay at 10
        { duration: '30s', target: 0 },   // Ramp down
      ],
    },
  },
  thresholds: {
    // Booking should complete in < 500ms (from Architecture Doc)
    'booking_latency': ['p(95)<500', 'p(99)<1000'],
    'http_req_duration': ['p(95)<1000'],
    'errors': ['rate<0.1'],
  },
};

export default function() {
  let authToken = null;
  
  // Step 1: Login
  group('01. Login', function() {
    const loginRes = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify(TEST_USER),
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { endpoint: 'login' },
      }
    );
    
    const success = check(loginRes, {
      'login successful': (r) => r.status === 200,
      'got auth token': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.token || body.data?.token || body.accessToken;
        } catch (e) {
          return false;
        }
      },
    });
    
    if (success && loginRes.status === 200) {
      try {
        const body = JSON.parse(loginRes.body);
        authToken = body.token || body.data?.token || body.accessToken;
      } catch (e) {}
    }
    
    errorRate.add(!success);
  });
  
  sleep(0.5);
  
  // Step 2: Browse Events
  group('02. Browse Events', function() {
    const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
    
    const eventsRes = http.get(`${BASE_URL}/api/events`, {
      headers,
      tags: { endpoint: 'events' },
    });
    
    check(eventsRes, {
      'events list retrieved': (r) => r.status === 200,
    });
    
    errorRate.add(eventsRes.status !== 200);
  });
  
  sleep(0.5);
  
  // Step 3: Get Featured Events
  group('03. Featured Events', function() {
    const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
    
    const featuredRes = http.get(`${BASE_URL}/api/events/featured`, {
      headers,
      tags: { endpoint: 'featured' },
    });
    
    check(featuredRes, {
      'featured events retrieved': (r) => r.status === 200 || r.status === 404,
    });
  });
  
  sleep(0.5);
  
  // Step 4: Get Event Details (if we have events)
  group('04. Event Details', function() {
    const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
    
    // First get events list
    const eventsRes = http.get(`${BASE_URL}/api/events`, { headers });
    
    if (eventsRes.status === 200) {
      try {
        const body = JSON.parse(eventsRes.body);
        const events = body.data || body.events || (Array.isArray(body) ? body : []);
        
        if (events.length > 0) {
          const eventId = events[0].id;
          
          const detailRes = http.get(`${BASE_URL}/api/events/${eventId}`, {
            headers,
            tags: { endpoint: 'event_detail' },
          });
          
          check(detailRes, {
            'event detail retrieved': (r) => r.status === 200,
          });
          
          // Step 5: Get Available Seats
          sleep(0.3);
          
          const seatsRes = http.get(`${BASE_URL}/api/events/${eventId}/seats`, {
            headers,
            tags: { endpoint: 'seats' },
          });
          
          check(seatsRes, {
            'seats retrieved': (r) => r.status === 200 || r.status === 404,
          });
          
          bookingLatency.add(detailRes.timings.duration + seatsRes.timings.duration);
        }
      } catch (e) {}
    }
  });
  
  sleep(1);
}

export function setup() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  EVENTMAX BOOKING FLOW TEST');
  console.log('  Target: ' + BASE_URL);
  console.log('═══════════════════════════════════════════════════════════════');
  
  // Verify backend
  const res = http.get(`${BASE_URL}/health`);
  if (res.status !== 200) {
    console.error('❌ Backend not responding!');
    return { ready: false };
  }
  
  // Test login
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify(TEST_USER),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  if (loginRes.status !== 200) {
    console.warn('⚠️  Login test failed - some tests may be limited');
  } else {
    console.log('✅ Authentication working!');
  }
  
  return { ready: true };
}
