# EventMax Docker Setup

## Quick Start

### Option 1: Just Database Services (Recommended for Development)
```powershell
# Start only PostgreSQL and Redis
docker-compose -f docker-compose.dev.yml up -d

# Check status
docker-compose -f docker-compose.dev.yml ps

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

### Option 2: Full Stack with Docker
```powershell
# Start all services (PostgreSQL, Redis, Backend, Frontend)
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

## Database Configuration

**PostgreSQL:**
- Host: `localhost`
- Port: `5432`
- Database: `eventmax`
- Username: `postgres`
- Password: `password`

**Redis:**
- Host: `localhost`
- Port: `6379`
- Password: `password`

## Your Existing SQL Files

The Docker setup automatically loads your existing SQL files from `backend/sql/`:
- ✅ `001_initial_schema.sql` - Database schema and tables
- ✅ `sample_data.sql` - Sample data for development

## Running Backend/Frontend Manually

If you prefer to run the backend/frontend outside Docker:

1. Start database services only:
   ```powershell
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. Run backend:
   ```powershell
   cd backend
   npm install
   npm run dev
   ```

3. Run frontend:
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

## Useful Commands

```powershell
# Stop services
docker-compose down
docker-compose -f docker-compose.dev.yml down

# Remove volumes (clean slate)
docker-compose down -v
docker-compose -f docker-compose.dev.yml down -v

# View database logs
docker logs eventmax_postgres_dev

# Connect to database
docker exec -it eventmax_postgres_dev psql -U postgres -d eventmax

# Connect to Redis
docker exec -it eventmax_redis_dev redis-cli -a password
```

## Environment Variables

The setup uses these environment variables (already configured):
- `POSTGRES_USER=postgres`
- `POSTGRES_PASSWORD=password`
- `POSTGRES_DB=eventmax`
- `REDIS_PASSWORD=password`
