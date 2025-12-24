#!/bin/bash

# EventMax - Complete Project Startup Script
# This script sets up and runs the entire EventMax application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_NAME="EventMax"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
DOCKER_DIR="$PROJECT_DIR/docker"

# Service ports
POSTGRES_PORT=5433
REDIS_PORT=6379
BACKEND_PORT=4000
FRONTEND_PORT=3000

# Function to print colored output
print_color() {
    printf "${1}${2}${NC}\n"
}

# Function to print section headers
print_header() {
    echo ""
    print_color $CYAN "============================================================"
    print_color $CYAN "  $1"
    print_color $CYAN "============================================================"
}

# Function to print status
print_status() {
    print_color $BLUE "ℹ️  $1"
}

# Function to print success
print_success() {
    print_color $GREEN "✅ $1"
}

# Function to print warning
print_warning() {
    print_color $YELLOW "⚠️  $1"
}

# Function to print error
print_error() {
    print_color $RED "❌ $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is available
is_port_available() {
    local port=$1
    if command_exists nc; then
        ! nc -z localhost $port >/dev/null 2>&1
    elif command_exists netstat; then
        ! netstat -tuln | grep ":$port " >/dev/null 2>&1
    else
        # Fallback: try to bind to the port
        ! timeout 1 bash -c "</dev/tcp/localhost/$port" >/dev/null 2>&1
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local port=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1

    print_status "Waiting for $service_name to be ready on port $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if ! is_port_available $port; then
            print_success "$service_name is ready on port $port"
            return 0
        fi
        
        printf "  Attempt %d/%d...\r" $attempt $max_attempts
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start on port $port after $max_attempts attempts"
    return 1
}

# Function to check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    local missing_deps=()
    
    # Check Docker
    if command_exists docker; then
        print_success "Docker is installed"
        if ! docker info >/dev/null 2>&1; then
            print_error "Docker is not running. Please start Docker and try again."
            exit 1
        fi
    else
        missing_deps+=("docker")
    fi
    
    # Check Docker Compose
    if command_exists docker-compose || docker compose version >/dev/null 2>&1; then
        print_success "Docker Compose is available"
    else
        missing_deps+=("docker-compose")
    fi
    
    # Check Node.js
    if command_exists node; then
        local node_version=$(node --version | sed 's/v//')
        print_success "Node.js is installed (version $node_version)"
        if ! node -e "process.exit(parseInt(process.version.slice(1)) >= 16 ? 0 : 1)"; then
            print_warning "Node.js version 16+ is recommended. Current version: $node_version"
        fi
    else
        missing_deps+=("node")
    fi
    
    # Check npm
    if command_exists npm; then
        local npm_version=$(npm --version)
        print_success "npm is installed (version $npm_version)"
    else
        missing_deps+=("npm")
    fi
    
    # Check yarn (optional)
    if command_exists yarn; then
        local yarn_version=$(yarn --version)
        print_success "Yarn is installed (version $yarn_version)"
    else
        print_warning "Yarn is not installed (optional, but recommended for frontend)"
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        print_error "Please install the missing dependencies and try again."
        exit 1
    fi
    
    print_success "All prerequisites are satisfied"
}

# Function to check port availability
check_ports() {
    print_header "Checking Port Availability"
    
    local ports=($POSTGRES_PORT $REDIS_PORT $BACKEND_PORT $FRONTEND_PORT)
    local port_names=("PostgreSQL" "Redis" "Backend" "Frontend")
    local occupied_ports=()
    
    for i in "${!ports[@]}"; do
        local port=${ports[$i]}
        local name=${port_names[$i]}
        
        if is_port_available $port; then
            print_success "Port $port is available for $name"
        else
            print_warning "Port $port is already in use (needed for $name)"
            occupied_ports+=("$port ($name)")
        fi
    done
    
    if [ ${#occupied_ports[@]} -ne 0 ]; then
        print_warning "The following ports are occupied: ${occupied_ports[*]}"
        print_status "You can continue, but services might fail to start"
        read -p "Do you want to continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Operation cancelled"
            exit 1
        fi
    fi
}

# Function to setup environment files
setup_environment() {
    print_header "Setting Up Environment Files"
    
    # Backend environment
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        print_status "Creating backend .env file..."
        cp "$BACKEND_DIR/env.example" "$BACKEND_DIR/.env"
        print_success "Backend .env file created"
    else
        print_success "Backend .env file already exists"
    fi
    
    # Frontend environment
    if [ ! -f "$FRONTEND_DIR/.env" ]; then
        print_status "Creating frontend .env file..."
        cp "$FRONTEND_DIR/env.example" "$FRONTEND_DIR/.env"
        print_success "Frontend .env file created"
    else
        print_success "Frontend .env file already exists"
    fi
}

# Function to install dependencies
install_dependencies() {
    print_header "Installing Dependencies"
    
    # Backend dependencies
    print_status "Installing backend dependencies..."
    cd "$BACKEND_DIR"
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    print_success "Backend dependencies installed"
    
    # Frontend dependencies
    print_status "Installing frontend dependencies..."
    cd "$FRONTEND_DIR"
    if command_exists yarn && [ -f "yarn.lock" ]; then
        yarn install --frozen-lockfile
    elif [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    print_success "Frontend dependencies installed"
    
    cd "$PROJECT_DIR"
}

# Function to create Docker volumes directory
create_volumes() {
    print_header "Creating Docker Volumes"
    
    mkdir -p "$DOCKER_DIR/volumes/postgres"
    mkdir -p "$DOCKER_DIR/volumes/redis"
    mkdir -p "$DOCKER_DIR/volumes/logs"
    
    print_success "Docker volumes directories created"
}

# Function to start database services
start_databases() {
    print_header "Starting Database Services"
    
    cd "$DOCKER_DIR"
    
    print_status "Starting PostgreSQL and Redis..."
    if command_exists docker-compose; then
        docker-compose up -d postgres redis
    else
        docker compose up -d postgres redis
    fi
    
    if [ $? -eq 0 ]; then
        print_success "Database services started"
    else
        print_error "Failed to start database services"
        exit 1
    fi
    
    # Wait for services to be ready
    wait_for_service $POSTGRES_PORT "PostgreSQL"
    wait_for_service $REDIS_PORT "Redis"
    
    cd "$PROJECT_DIR"
}

# Function to initialize database
initialize_database() {
    print_header "Initializing Database"
    
    cd "$BACKEND_DIR"
    
    print_status "Running database initialization..."
    if [ -f "scripts/init-db.js" ]; then
        node scripts/init-db.js
        print_success "Database initialized"
    else
        print_warning "Database initialization script not found"
    fi
    
    print_status "Seeding database with sample data..."
    if [ -f "scripts/seed-db.js" ]; then
        node scripts/seed-db.js
        print_success "Database seeded with sample data"
    else
        print_warning "Database seeding script not found"
    fi
    
    cd "$PROJECT_DIR"
}

# Function to start backend service
start_backend() {
    print_header "Starting Backend Service"
    
    cd "$BACKEND_DIR"
    
    print_status "Starting backend server..."
    npm run dev &
    BACKEND_PID=$!
    
    # Wait for backend to be ready
    if wait_for_service $BACKEND_PORT "Backend"; then
        print_success "Backend service is running on port $BACKEND_PORT"
    else
        print_error "Backend service failed to start"
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    
    cd "$PROJECT_DIR"
}

# Function to start frontend service
start_frontend() {
    print_header "Starting Frontend Service"
    
    cd "$FRONTEND_DIR"
    
    print_status "Starting frontend development server..."
    if command_exists yarn; then
        yarn dev &
    else
        npm run dev &
    fi
    FRONTEND_PID=$!
    
    # Wait for frontend to be ready
    if wait_for_service $FRONTEND_PORT "Frontend"; then
        print_success "Frontend service is running on port $FRONTEND_PORT"
    else
        print_error "Frontend service failed to start"
        kill $FRONTEND_PID 2>/dev/null || true
        exit 1
    fi
    
    cd "$PROJECT_DIR"
}

# Function to run health checks
run_health_checks() {
    print_header "Running Health Checks"
    
    # Backend health check
    print_status "Checking backend health..."
    if curl -s -f "http://localhost:$BACKEND_PORT/health" >/dev/null; then
        print_success "Backend health check passed"
    else
        print_warning "Backend health check failed (service might still be starting)"
    fi
    
    # Database connectivity check
    print_status "Checking database connectivity..."
    cd "$BACKEND_DIR"
    if npm run test:db >/dev/null 2>&1; then
        print_success "Database connectivity check passed"
    else
        print_warning "Database connectivity check failed"
    fi
    
    # Redis connectivity check
    print_status "Checking Redis connectivity..."
    if npm run test:redis >/dev/null 2>&1; then
        print_success "Redis connectivity check passed"
    else
        print_warning "Redis connectivity check failed"
    fi
    
    cd "$PROJECT_DIR"
}

# Function to display service information
display_service_info() {
    print_header "Service Information"
    
    echo ""
    print_color $GREEN "🎉 EventMax is now running!"
    echo ""
    print_color $CYAN "📱 Frontend Application:"
    print_color $WHITE "   URL: http://localhost:$FRONTEND_PORT"
    print_color $WHITE "   Description: Main user interface for event booking"
    echo ""
    print_color $CYAN "🖥️  Backend API:"
    print_color $WHITE "   URL: http://localhost:$BACKEND_PORT"
    print_color $WHITE "   Health: http://localhost:$BACKEND_PORT/health"
    print_color $WHITE "   API Docs: http://localhost:$BACKEND_PORT/docs"
    echo ""
    print_color $CYAN "🗄️  Database Services:"
    print_color $WHITE "   PostgreSQL: localhost:$POSTGRES_PORT"
    print_color $WHITE "   Redis: localhost:$REDIS_PORT"
    echo ""
    print_color $CYAN "🛠️  Management Tools (optional):"
    print_color $WHITE "   pgAdmin: http://localhost:8080 (admin@eventmax.com / admin)"
    print_color $WHITE "   Redis Commander: http://localhost:8081 (admin / admin)"
    echo ""
    print_color $YELLOW "📝 Commands:"
    print_color $WHITE "   Stop all services: ./stop-all.sh"
    print_color $WHITE "   View logs: docker logs eventmax_postgres"
    print_color $WHITE "   Restart backend: cd backend && npm run dev"
    print_color $WHITE "   Restart frontend: cd frontend && yarn dev"
    echo ""
    print_color $PURPLE "🎯 Quick Test:"
    print_color $WHITE "   1. Open http://localhost:$FRONTEND_PORT in your browser"
    print_color $WHITE "   2. Register a new account or login"
    print_color $WHITE "   3. Browse events and test seat booking"
    print_color $WHITE "   4. Check real-time updates in multiple browser tabs"
    echo ""
}

# Function to setup signal handlers
setup_signal_handlers() {
    # Cleanup function
    cleanup() {
        print_header "Shutting Down Services"
        
        if [ ! -z "$FRONTEND_PID" ]; then
            print_status "Stopping frontend service..."
            kill $FRONTEND_PID 2>/dev/null || true
        fi
        
        if [ ! -z "$BACKEND_PID" ]; then
            print_status "Stopping backend service..."
            kill $BACKEND_PID 2>/dev/null || true
        fi
        
        print_status "Stopping database services..."
        cd "$DOCKER_DIR"
        if command_exists docker-compose; then
            docker-compose down
        else
            docker compose down
        fi
        
        print_success "All services stopped"
        exit 0
    }
    
    # Set up signal handlers
    trap cleanup SIGINT SIGTERM
}

# Main execution function
main() {
    print_header "EventMax Complete Project Setup"
    print_status "Starting comprehensive EventMax application setup..."
    
    setup_signal_handlers
    check_prerequisites
    check_ports
    setup_environment
    install_dependencies
    create_volumes
    start_databases
    initialize_database
    start_backend
    start_frontend
    run_health_checks
    display_service_info
    
    print_header "Setup Complete"
    print_success "EventMax is fully operational!"
    print_status "Press Ctrl+C to stop all services"
    
    # Keep the script running
    while true; do
        sleep 1
    done
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
