# EventMax Docker Database Setup

## Overview
This setup uses Docker only for the database services (PostgreSQL and Redis) while running the frontend and backend locally for development.

## What's Running in Docker
- **PostgreSQL 15**: Database server on port 5433
- **Redis 7**: Cache server on port 6379
- **pgAdmin**: Database management tool on port 8080 (optional)
- **Redis Commander**: Redis management tool on port 8081 (optional)

## What's Running Locally
- **Backend**: Node.js API server on port 4000
- **Frontend**: React development server on port 3000

## Quick Start

### 1. Start Database Services
```bash
cd docker
docker-compose up -d
```

### 2. Start Local Development
```bash
# From project root
.\start-local-dev.ps1
```

Or manually:
```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm install
npm run dev
```

## Database Schema
The database includes:
- **Users table**: Admin, organizer, and customer accounts
- **Events table**: Event management
- **Seats table**: Seat configuration and pricing
- **Bookings table**: Confirmed bookings
- **Invoices table**: Generated invoices
- **Payments table**: Payment tracking

## Sample Data
Pre-loaded sample data includes:
- **Admin user**: admin@eventmax.com (password: admin123)
- **Organizer user**: organizer@eventmax.com (password: organizer123)
- **Customer user**: customer@eventmax.com (password: customer123)
- **Sample event**: "Summer Concert 2025" with 6 seats

## Environment Configuration

### Backend (.env.local)
```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=eventmax
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:4000
VITE_WS_URL=http://localhost:4000
```

## Benefits of This Setup
1. **Fast Development**: No need to rebuild Docker containers for code changes
2. **Real-time Updates**: Code changes reflect immediately
3. **Database Persistence**: Data persists between restarts
4. **Easy Debugging**: Direct access to logs and processes
5. **Resource Efficient**: Only database services use Docker

## Code Changes and Docker
- **Frontend/Backend code changes**: Take effect immediately (no Docker rebuild needed)
- **Database schema changes**: Require database recreation or migration scripts
- **Environment variables**: Update .env.local files and restart services

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker exec eventmax_postgres psql -U postgres -d eventmax -c "SELECT 1;"

# Check if Redis is running
docker exec eventmax_redis redis-cli ping
```

### Reset Database
```bash
cd docker
docker-compose down
docker volume rm docker_postgres_data
docker-compose up -d
```

### View Logs
```bash
# Database logs
docker-compose logs postgres
docker-compose logs redis

# Local service logs
# Check the terminal windows where you started the services
```

## Ports Used
- **3000**: Frontend (React)
- **4000**: Backend (Node.js API)
- **5433**: PostgreSQL Database
- **6379**: Redis Cache
- **8080**: pgAdmin (optional)
- **8081**: Redis Commander (optional)

## Stopping Services
```bash
# Stop local services: Close the terminal windows or Ctrl+C

# Stop Docker services
cd docker
docker-compose down
```
