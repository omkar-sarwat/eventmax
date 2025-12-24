# ═══════════════════════════════════════════════════════════════════════════
# EVENTMAX K6 LOAD TESTING
# ═══════════════════════════════════════════════════════════════════════════
# Based on System Architecture Design Document
# FREE - No cloud required!
# ═══════════════════════════════════════════════════════════════════════════

## 📦 Installation

K6 is already installed! If you need to reinstall:
```powershell
winget install GrafanaLabs.k6
```

## 🚀 Quick Start

### 1. Make sure services are running:
```powershell
# Start Docker (PostgreSQL + Redis)
cd e:\eventmax
docker-compose -f docker-compose.dev.yml up -d

# Start Backend (in another terminal)
cd e:\eventmax\backend
npm run dev
```

### 2. Run Tests:

```powershell
# Quick Smoke Test (30 seconds)
k6 run tests/k6/smoke-test.js

# Full Load Test (about 12 minutes)
k6 run tests/k6/load-test.js

# Booking Flow Test (about 6 minutes)
k6 run tests/k6/booking-flow-test.js

# Spike Test - Flash Sale Simulation (about 2 minutes)
k6 run tests/k6/spike-test.js
```

## 📊 Test Scenarios

| Test | Duration | VUs | Purpose |
|------|----------|-----|---------|
| **Smoke** | 30s | 1 | Quick validation |
| **Load** | 12min | 1-20 | Normal traffic simulation |
| **Booking Flow** | 6min | 1-10 | End-to-end booking test |
| **Spike** | 2min | 1-100 | Flash sale simulation |

## 🎯 Performance Targets (from Architecture Document)

| Metric | Target | Test |
|--------|--------|------|
| P99 Response Time | < 200ms | All tests |
| Booking Latency | < 500ms | Booking Flow |
| Error Rate | < 5% | All tests |
| Requests/Second | 50,000 RPS | Stress test (enterprise) |

## 📈 Custom Target URL

Test against a different URL:
```powershell
k6 run -e BASE_URL=http://localhost:4000 tests/k6/smoke-test.js
```

## 📁 Test Files

- `smoke-test.js` - Quick API validation
- `load-test.js` - Full load testing with ramp-up/down
- `booking-flow-test.js` - Complete booking scenario
- `spike-test.js` - Flash sale traffic spike simulation

## 🔧 Customization

Edit the test files to:
- Change number of virtual users (VUs)
- Adjust test duration
- Modify thresholds
- Add new endpoints to test
