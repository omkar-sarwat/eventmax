# 🐳 EventMax Docker Deployment Guide

This guide explains how to deploy the EventMax seat booking system using Docker containers.

## 📋 Prerequisites

- Docker 20.0+ 
- Docker Compose 2.0+
- At least 2GB RAM available
- Ports 3000, 4000, 5432, 6379 available

## 🚀 Quick Start

### 1. Clone and Setup
```bash
git clone <repository-url>
cd eventmax
```

### 2. Production Deployment
```bash
# Start all services
docker-compose -f docker-compose.production.yml up -d

# Check service status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

### 3. Initialize Database
```bash
# Wait for services to be healthy, then seed data
docker-compose -f docker-compose.production.yml exec backend node scripts/seed-real-events.js
```

### 4. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Health Check**: http://localhost:4000/health

## 🏗️ Service Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │
│   (nginx:80)    │◄──►│   (node:4000)   │
│   React SPA     │    │   Express.js    │
└─────────────────┘    └─────────────────┘
                              │
                              ▼
┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │◄──►│     Redis       │
│   (port:5432)   │    │   (port:6379)   │
│   Database      │    │   Cache/Queue   │
└─────────────────┘    └─────────────────┘
```

## 🔧 Service Details

### Frontend (React + Nginx)
- **Image**: Custom multi-stage build
- **Port**: 3000 → 80 (internal)
- **Features**: 
  - Production React build
  - Nginx reverse proxy
  - Gzip compression
  - Client-side routing support

### Backend (Node.js API)
- **Image**: Custom Node.js build
- **Port**: 4000
- **Features**:
  - Express.js REST API
  - Socket.IO WebSockets
  - JWT authentication
  - Real-time seat management

### PostgreSQL Database
- **Image**: postgres:15-alpine
- **Port**: 5432
- **Features**:
  - Persistent data storage
  - Auto-initialization with schema
  - Health checks

### Redis Cache
- **Image**: redis:7-alpine
- **Port**: 6379
- **Features**:
  - Seat reservation caching
  - Session storage
  - Real-time data

## 🔍 Monitoring & Health Checks

All services include health checks:

```bash
# Check all service health
docker-compose -f docker-compose.production.yml ps

# Individual service logs
docker-compose -f docker-compose.production.yml logs frontend
docker-compose -f docker-compose.production.yml logs backend
docker-compose -f docker-compose.production.yml logs postgres
docker-compose -f docker-compose.production.yml logs redis
```

## 🛠️ Development Override

Create `docker-compose.override.yml` for development:

```yaml
version: '3.8'
services:
  backend:
    environment:
      - NODE_ENV=development
    volumes:
      - ./backend:/app
      - /app/node_modules
    command: npm run dev
  
  frontend:
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev
```

## 🔒 Security Considerations

### Production Checklist:
- [ ] Change default JWT secret in environment
- [ ] Use strong PostgreSQL password
- [ ] Enable SSL/TLS termination
- [ ] Configure firewall rules
- [ ] Enable log rotation
- [ ] Set up monitoring alerts

### Environment Variables:
```bash
# Backend
POSTGRES_URL=postgres://user:pass@postgres:5432/eventmax
REDIS_URL=redis://redis:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=production

# Frontend
VITE_API_URL=http://localhost:4000
```

## 📊 Data Management

### Database Backup
```bash
# Create backup
docker-compose -f docker-compose.production.yml exec postgres pg_dump -U postgres eventmax > backup.sql

# Restore backup
docker-compose -f docker-compose.production.yml exec -T postgres psql -U postgres eventmax < backup.sql
```

### Reset Data
```bash
# Stop services
docker-compose -f docker-compose.production.yml down

# Remove volumes (⚠️ DELETES ALL DATA)
docker volume rm eventmax_postgres_data eventmax_redis_data

# Restart and reseed
docker-compose -f docker-compose.production.yml up -d
docker-compose -f docker-compose.production.yml exec backend node scripts/seed-real-events.js
```

## 🚦 Troubleshooting

### Common Issues:

1. **Port conflicts**:
   ```bash
   # Check what's using ports
   netstat -tulpn | grep :3000
   netstat -tulpn | grep :4000
   ```

2. **Service won't start**:
   ```bash
   # Check logs
   docker-compose -f docker-compose.production.yml logs <service-name>
   
   # Restart specific service
   docker-compose -f docker-compose.production.yml restart <service-name>
   ```

3. **Database connection issues**:
   ```bash
   # Check postgres logs
   docker-compose -f docker-compose.production.yml logs postgres
   
   # Test connection
   docker-compose -f docker-compose.production.yml exec backend npm run test-db
   ```

4. **Redis connection issues**:
   ```bash
   # Check redis logs
   docker-compose -f docker-compose.production.yml logs redis
   
   # Test redis
   docker-compose -f docker-compose.production.yml exec redis redis-cli ping
   ```

## 🔄 Updates & Maintenance

### Update Application:
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d
```

### Clean Up:
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune
```

## 📈 Performance Tuning

### Resource Limits (add to docker-compose.yml):
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: "0.5"
        reservations:
          memory: 256M
          cpus: "0.25"
```

### Nginx Optimization:
- Gzip compression enabled
- Static asset caching
- Client-side routing support
- Security headers

## 🎯 Production Ready Features

✅ **Multi-stage builds** for optimized images  
✅ **Health checks** for all services  
✅ **Non-root user** for security  
✅ **Persistent volumes** for data  
✅ **Nginx reverse proxy** for frontend  
✅ **Environment-based configuration**  
✅ **Graceful shutdown handling**  
✅ **Automatic service dependencies**  

## 📝 Login Credentials for Testing

```
Organizers:
- sarah.johnson@bluenotejazz.com / password123
- m.chen@techconf2024.org / password123

Customers:
- john.smith@gmail.com / password123
- emma.wilson@yahoo.com / password123
```

---

## 🎉 Ready to Go!

Your EventMax seat booking system is now running in production-ready Docker containers with:
- ⏰ **3-minute seat locking** 
- 🔄 **Real-time updates via WebSocket**
- 💾 **Redis caching for performance**
- 🔐 **Secure authentication**
- 🧹 **Automatic cleanup jobs**

Access your application at **http://localhost:3000** and start booking seats! 🎫
