# EventMax - Complete Project Setup & Deployment Guide

## 🚀 Quick Start

EventMax is a comprehensive event management platform with real-time seat booking, payment processing, and modern web technologies.

### Prerequisites

- **Docker & Docker Compose** (recommended for easy setup)
- **Node.js 16+** 
- **npm** or **yarn**
- **Git**

### One-Command Setup

```powershell
# Windows PowerShell
.\start-project.ps1

# Linux/macOS
./start-project.sh
```

## 📋 System Requirements

### Minimum Requirements
- **RAM**: 4GB available
- **Storage**: 2GB free space
- **Ports**: 3000, 4000, 5433, 6379 (must be available)

### Recommended Requirements
- **RAM**: 8GB available
- **Storage**: 5GB free space
- **CPU**: Multi-core processor
- **Network**: Stable internet connection

## 🛠️ Manual Setup (Alternative)

If you prefer manual setup or need to customize the installation:

### 1. Environment Configuration

```powershell
# Backend environment
cd backend
cp env.example .env

# Frontend environment  
cd ../frontend
cp env.example .env
```

### 2. Install Dependencies

```powershell
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
# or
yarn install
```

### 3. Start Database Services

```powershell
cd docker
docker-compose up -d postgres redis
```

### 4. Initialize Database

```powershell
cd ../backend
node scripts/init-db.js
node scripts/seed-db.js
```

### 5. Start Application Services

```powershell
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
# or
yarn dev
```

## 🔧 Configuration Options

### Backend Configuration (.env)

```env
# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_DB=eventmax_db
POSTGRES_USER=eventmax_user
POSTGRES_PASSWORD=eventmax_secure_password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_secure_password

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Feature Flags
ENABLE_SEAT_SYNC=true
ENABLE_REAL_TIME_UPDATES=true
ENABLE_PAYMENT_PROCESSING=true
ENABLE_INVOICE_GENERATION=true
ENABLE_EMAIL_NOTIFICATIONS=true
```

### Frontend Configuration (.env)

```env
# API Configuration
VITE_API_URL=http://localhost:4000
VITE_WS_URL=ws://localhost:4000

# Feature Flags
VITE_ENABLE_REAL_TIME_SEAT_UPDATES=true
VITE_ENABLE_SEAT_ANIMATIONS=true
VITE_ENABLE_ADVANCED_FILTERS=true
VITE_ENABLE_SOCIAL_SHARING=true
VITE_ENABLE_PWA=true

# UI Configuration
VITE_DEFAULT_THEME=light
VITE_ENABLE_DARK_MODE=true
VITE_ENABLE_ANIMATIONS=true
VITE_ANIMATION_DURATION=300
```

## 🐳 Docker Deployment

### Production Deployment

```powershell
# Build and start all services
docker-compose -f docker-compose.production.yml up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Development with Docker

```powershell
cd docker
docker-compose up -d
```

## 🌐 Service Endpoints

### Main Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API Documentation**: http://localhost:4000/docs
- **Health Check**: http://localhost:4000/health

### Database Services
- **PostgreSQL**: localhost:5433
- **Redis**: localhost:6379

### Management Tools (Optional)
- **pgAdmin**: http://localhost:8080
  - Email: admin@eventmax.com
  - Password: admin
- **Redis Commander**: http://localhost:8081
  - Username: admin
  - Password: admin

## 🎯 Testing the Application

### 1. User Registration & Login
1. Open http://localhost:3000
2. Click "Sign Up" to create a new account
3. Fill out the registration form
4. Verify email (if email service is configured)
5. Login with your credentials

### 2. Browse Events
1. View the event dashboard
2. Use search and filter options
3. Click on an event to view details

### 3. Seat Booking Flow
1. Select an event
2. Choose seats on the interactive seat map
3. Add to cart and proceed to checkout
4. Fill out customer information
5. Complete payment (test mode)
6. View confirmation and invoice

### 4. Real-Time Features
1. Open multiple browser tabs
2. Select seats in one tab
3. Observe real-time updates in other tabs
4. Test seat reservation timers

## 🔧 Troubleshooting

### Common Issues

#### Port Already in Use
```powershell
# Check what's using the port
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <process_id> /F
```

#### Database Connection Issues
```powershell
# Check PostgreSQL container
docker logs eventmax_postgres

# Restart database
docker-compose restart postgres
```

#### Frontend Build Issues
```powershell
# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

#### Backend API Issues
```powershell
# Check backend logs
cd backend
npm run dev

# Test database connection
node scripts/test-connection.js
```

### Service Status Checks

```powershell
# Check all services
.\scripts\health-check.ps1

# Check specific service
curl http://localhost:4000/health
curl http://localhost:3000

# Check database connectivity
cd backend
npm run test:db
npm run test:redis
```

## 📊 Performance Optimization

### Development Performance
- Use `npm run dev` for hot reloading
- Enable browser dev tools for debugging
- Use React Developer Tools extension

### Production Optimizations
- Build frontend with `npm run build`
- Use production Docker images
- Enable caching in Redis
- Configure CDN for static assets

## 🔒 Security Considerations

### Development Security
- Keep `.env` files secure
- Use strong passwords for database
- Enable CORS protection
- Validate all inputs

### Production Security
- Use HTTPS in production
- Configure proper firewall rules
- Enable rate limiting
- Use production-grade secrets
- Enable audit logging

## 📝 Development Commands

### Backend Commands
```powershell
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run test:db      # Test database connection
npm run test:redis   # Test Redis connection
npm run migrate      # Run database migrations
npm run seed         # Seed database with sample data
```

### Frontend Commands
```powershell
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run lint         # Run linter
npm run format       # Format code
```

### Docker Commands
```powershell
docker-compose up -d              # Start all services
docker-compose down               # Stop all services
docker-compose logs -f            # View logs
docker-compose restart <service>  # Restart specific service
docker-compose ps                 # List running services
```

## 🎨 Customization

### Theme Customization
1. Edit `frontend/tailwind.config.js`
2. Modify color scheme in CSS variables
3. Update component themes

### Feature Configuration
1. Enable/disable features in `.env` files
2. Modify feature flags in configuration
3. Customize UI components

### Database Schema
1. Modify `backend/sql/schema.sql`
2. Create migration scripts
3. Update models accordingly

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout

### Event Endpoints
- `GET /api/events` - List events
- `GET /api/events/:id` - Get event details
- `POST /api/events` - Create event (admin)
- `PUT /api/events/:id` - Update event (admin)

### Booking Endpoints
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking details
- `GET /api/user/bookings` - User's bookings
- `PUT /api/bookings/:id/cancel` - Cancel booking

### Seat Endpoints
- `GET /api/events/:id/seats` - Get event seats
- `POST /api/seats/reserve` - Reserve seats
- `PUT /api/seats/release` - Release seats
- `GET /api/seats/status` - Real-time seat status

## 🎉 Success Indicators

Your EventMax installation is successful when:

✅ All services start without errors
✅ Frontend loads at http://localhost:3000
✅ Backend API responds at http://localhost:4000/health
✅ Database connections are established
✅ Real-time seat updates work
✅ User registration and login function
✅ Seat booking flow completes
✅ Invoice generation works
✅ WebSocket connections are stable

## 🆘 Getting Help

### Support Resources
- Check logs for error messages
- Review configuration files
- Test individual components
- Use browser developer tools
- Check network connectivity

### Common Solutions
1. **Restart all services**: `.\stop-all.ps1` then `.\start-project.ps1`
2. **Clear cache**: Delete `node_modules` and reinstall
3. **Reset database**: `docker-compose down -v` then restart
4. **Check ports**: Ensure required ports are available
5. **Update dependencies**: `npm update` in both directories

---

## 🏆 EventMax Architecture Overview

EventMax is built with modern technologies for scalability and performance:

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express + PostgreSQL + Redis
- **Real-time**: WebSocket connections for live updates
- **Containerization**: Docker for easy deployment
- **Security**: JWT authentication + CORS protection
- **Performance**: Redis caching + optimized queries
- **UI/UX**: Responsive design + animations + accessibility

Happy coding! 🚀
