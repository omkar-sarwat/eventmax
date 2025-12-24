<h1 align="center">🎫 EventMax</h1>

<p align="center">
  <strong>A Modern, High-Performance Event Booking Platform</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React"/>
  <img src="https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Redis-7.x-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis"/>
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-screenshots">Screenshots</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-performance">Performance</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-api-documentation">API Docs</a>
</p>

---

## 📋 Overview

**EventMax** is a production-ready, full-stack event booking platform built with modern technologies. It features real-time seat selection, secure payment processing, and a responsive UI designed for seamless user experience.

### 🎯 Key Highlights

- **Real-time Seat Selection** with distributed locking to prevent double-booking
- **High Performance** - 485 RPS peak throughput with 0% error rate
- **Scalable Architecture** - Redis caching, connection pooling, horizontal scaling ready
- **Comprehensive Testing** - K6 load testing suite with smoke, stress, and spike tests
- **India Localization** - INR currency, 18% GST, India-based payment support

---

## ✨ Features

### 🎫 Booking System
- Real-time seat availability with WebSocket updates
- Interactive seat map with drag-to-select
- Distributed locking for concurrent booking handling
- Automated ticket generation (PDF)
- Booking history and management

### 🔐 Authentication & Security
- JWT-based authentication with refresh tokens
- Secure password hashing (bcrypt)
- Rate limiting and request throttling
- Input validation and sanitization

### 💳 Payment Integration
- Multiple payment gateway support (Razorpay, UPI)
- Secure transaction processing
- Automatic GST calculation (18%)
- Refund handling

### 📱 User Experience
- Responsive design (Mobile, Tablet, Desktop)
- Dark/Light theme support
- Smooth animations (Framer Motion, GSAP)
- Real-time notifications

### 👨‍💼 Admin Dashboard
- Event management (CRUD)
- User management
- Analytics and reporting
- Revenue tracking

---

## 📸 Screenshots

### 🏠 Homepage
<p align="center">
  <img src="docs/screenshots/01-homepage.png" alt="Homepage" width="90%"/>
</p>
<p align="center"><em>Modern landing page with featured events and categories</em></p>

---

### 🎭 Events Listing
<p align="center">
  <img src="docs/screenshots/02-events-listing.png" alt="Events Listing" width="90%"/>
</p>
<p align="center"><em>Browse events with filters, search, and category navigation</em></p>

---

### 📄 Event Details
<p align="center">
  <img src="docs/screenshots/03-event-details.png" alt="Event Details" width="90%"/>
</p>
<p align="center"><em>Detailed event information with venue, timing, and pricing</em></p>

---

### 🪑 Seat Selection
<p align="center">
  <img src="docs/screenshots/04-seat-selection.png" alt="Seat Selection" width="90%"/>
</p>
<p align="center"><em>Interactive seat map with real-time availability and pricing tiers</em></p>

---

### 🛒 Checkout
<p align="center">
  <img src="docs/screenshots/05-checkout.png" alt="Checkout" width="90%"/>
</p>
<p align="center"><em>Secure checkout with order summary and payment options</em></p>

---

### ✅ Booking Confirmation
<p align="center">
  <img src="docs/screenshots/06-confirmation.png" alt="Confirmation" width="90%"/>
</p>
<p align="center"><em>Booking confirmation with ticket download and event details</em></p>

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI Framework with Hooks |
| **Vite** | Build tool & dev server |
| **TailwindCSS** | Utility-first styling |
| **Radix UI** | Accessible components |
| **Framer Motion** | Animations |
| **React Query** | Server state management |
| **Axios** | HTTP client |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework |
| **PostgreSQL 15** | Primary database |
| **Redis 7** | Caching & sessions |
| **Socket.IO** | Real-time updates |
| **JWT** | Authentication |
| **Winston** | Logging |

### DevOps & Testing
| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Multi-container orchestration |
| **K6** | Load testing |
| **GitHub Actions** | CI/CD pipeline |

---

## 📊 Performance

### Load Testing Results (K6)

| Test Type | Virtual Users | Requests | RPS | Error Rate | P99 Latency |
|-----------|---------------|----------|-----|------------|-------------|
| **Smoke** | 1 | 50 | 1.6 | 0% | 35.87ms |
| **Load** | 10 | 1,000 | 16.5 | 0% | 28.34ms |
| **Stress** | 50 | 10,000 | 82 | 0% | 38.8ms |
| **Stress** | 100 | 20,000 | 164 | 0% | 134.72ms |
| **Spike** | 1→100 | 50,812 | 485 | 0% | - |

### Architecture Optimizations

- ✅ **Redis Caching** - Multi-level cache with TTL-based invalidation
- ✅ **Connection Pooling** - PostgreSQL pool (min: 2, max: 20)
- ✅ **Distributed Locking** - Redis-based locks for seat booking
- ✅ **Rate Limiting** - Tiered limits per user role
- ✅ **Slow Query Logging** - Queries > 1s logged for optimization

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.x or higher
- **Docker** & Docker Compose
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/eventmax.git
cd eventmax
```

### 2. Start Docker Services

```bash
docker-compose -f docker-compose.dev.yml up -d
```

This starts:
- PostgreSQL on port `5434`
- Redis on port `6379`

### 3. Setup Backend

```bash
cd backend
cp .env.example .env    # Configure environment variables
npm install
npm run dev             # Starts on http://localhost:4000
```

### 4. Setup Frontend

```bash
cd frontend
npm install
npm run dev             # Starts on http://localhost:3000
```

### 5. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000/api
- **API Health:** http://localhost:4000/api/health

---

## 📁 Project Structure

```
eventmax/
├── backend/                 # Node.js Express API
│   ├── src/
│   │   ├── config/         # Database, Redis, App config
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, validation, rate limiting
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Helper functions
│   │   └── server.js       # Entry point
│   └── package.json
│
├── frontend/               # React Vite Application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── stores/         # State management
│   │   ├── services/       # API services
│   │   └── App.jsx         # Root component
│   └── package.json
│
├── tests/
│   └── k6/                 # Load testing scripts
│       ├── smoke-test.js
│       ├── load-test.js
│       ├── stress-test.js
│       └── spike-test.js
│
├── docs/                   # Documentation
│   ├── screenshots/        # UI screenshots
│   └── SYSTEM_ARCHITECTURE_DESIGN.md
│
├── docker-compose.yml      # Production Docker config
├── docker-compose.dev.yml  # Development Docker config
└── README.md
```

---

## 🔌 API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/me` | Get current user |

### Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | List all events |
| GET | `/api/events/:id` | Get event details |
| GET | `/api/events/:id/seats` | Get seat availability |
| GET | `/api/events/featured` | Get featured events |

### Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings` | Get user bookings |
| GET | `/api/bookings/:id` | Get booking details |
| POST | `/api/bookings/:id/cancel` | Cancel booking |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | API health check |

---

## 🧪 Running Tests

### Load Testing with K6

```bash
# Install K6
winget install GrafanaLabs.k6

# Run smoke test
k6 run tests/k6/smoke-test.js

# Run load test
k6 run tests/k6/load-test.js

# Run stress test
k6 run tests/k6/stress-test.js

# Run spike test (flash sale simulation)
k6 run tests/k6/spike-test.js
```

---

## 🐳 Docker Deployment

### Development

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Production

```bash
docker-compose up -d --build
```

---

## 🔧 Environment Variables

### Backend (.env)

```env
# Server
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5434/eventmax

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:3000
```

---

## 📈 Future Roadmap

- [ ] GraphQL API support
- [ ] Mobile app (React Native)
- [ ] Multi-language support (i18n)
- [ ] Advanced analytics dashboard
- [ ] Social login (Google, Facebook)
- [ ] Event recommendations (ML-based)
- [ ] Waitlist management
- [ ] Dynamic pricing

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Omkar Sarswat**

- GitHub: [@omkar-sarswat](https://github.com/omkar-sarswat)
- LinkedIn: [Omkar Sarswat](https://linkedin.com/in/omkar-sarswat)

---

<p align="center">
  Made with ❤️ in India 🇮🇳
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Built%20with-Passion-red?style=for-the-badge" alt="Built with Passion"/>
</p>
