# EventMax Setup Verification Script
# This script verifies and helps fix the Docker setup for EventMax

# Function to check if Docker is running
function Test-DockerRunning {
    try {
        $null = docker info 2>&1
        return $true
    } catch {
        Write-Host "❌ Docker is not running or not installed" -ForegroundColor Red
        Write-Host "   Please ensure Docker Desktop is running and try again."
        return $false
    }
}

# Function to clean up existing containers
function Clear-ExistingContainers {
    Write-Host "🧹 Cleaning up existing containers..." -ForegroundColor Cyan
    
    # Stop and remove all containers
    $containers = docker ps -a -q
    if ($containers) {
        Write-Host "   Stopping and removing $($containers.Count) containers..."
        $containers | ForEach-Object { 
            docker stop $_ 2>&1 | Out-Null
            docker rm -f $_ 2>&1 | Out-Null
        }
    } else {
        Write-Host "   No containers to clean up."
    }
    
    # Remove unused networks and volumes
    Write-Host "   Removing unused networks and volumes..."
    docker network prune -f 2>&1 | Out-Null
    docker volume prune -f 2>&1 | Out-Null
    
    Write-Host "✅ Cleanup complete" -ForegroundColor Green
}

# Function to start EventMax services
function Start-EventMaxServices {
    param (
        [string]$ComposeFile = "docker\docker-compose.yml"
    )
    
    Write-Host "🚀 Starting EventMax services..." -ForegroundColor Cyan
    
    # Check if the compose file exists
    if (-not (Test-Path $ComposeFile)) {
        Write-Host "❌ Compose file not found: $ComposeFile" -ForegroundColor Red
        return $false
    }
    
    # Start services
    try {
        Write-Host "   Starting services using $ComposeFile..."
        $startCommand = "docker-compose -f $ComposeFile up -d postgres dragonfly"
        Invoke-Expression $startCommand | Out-Host
        
        # Wait for services to start
        Start-Sleep -Seconds 5
        
        # Check if containers are running
        $postgresStatus = docker ps --filter "name=eventmax_postgres" --format "{{.Status}}" 2>&1
        $dragonflyStatus = docker ps --filter "name=eventmax_dragonfly" --format "{{.Status}}" 2>&1
        
        if ($postgresStatus -like "*Up*" -and $dragonflyStatus -like "*Up*") {
            Write-Host "✅ Services started successfully" -ForegroundColor Green
            Write-Host "   - PostgreSQL: $postgresStatus"
            Write-Host "   - Dragonfly:  $dragonflyStatus"
            return $true
        } else {
            Write-Host "❌ Failed to start services:" -ForegroundColor Red
            if (-not ($postgresStatus -like "*Up*")) {
                Write-Host "   - PostgreSQL is not running"
                docker logs eventmax_postgres 2>&1 | Select-Object -Last 20 | ForEach-Object { Write-Host "   $_" }
            }
            if (-not ($dragonflyStatus -like "*Up*")) {
                Write-Host "   - Dragonfly is not running"
                docker logs eventmax_dragonfly 2>&1 | Select-Object -Last 20 | ForEach-Object { Write-Host "   $_" }
            }
            return $false
        }
    } catch {
        Write-Host "❌ Error starting services: $_" -ForegroundColor Red
        return $false
    }
}

# Function to test database connection
function Test-DatabaseConnection {
    Write-Host "🔍 Testing database connection..." -ForegroundColor Cyan
    
    try {
        $result = docker exec eventmax_postgres psql -U postgres -d eventmax -c "SELECT NOW() AS current_time, 'Database connection successful' AS status;" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Database connection successful" -ForegroundColor Green
            $result | ForEach-Object { Write-Host "   $_" }
            
            # Check if tables exist
            Write-Host "\n📊 Checking database tables..."
            $tables = docker exec eventmax_postgres psql -U postgres -d eventmax -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';" 2>&1
            
            if ($tables) {
                Write-Host "✅ Database tables exist:" -ForegroundColor Green
                $tables | ForEach-Object { if ($_.Trim()) { Write-Host "   - $($_.Trim())" } }
            } else {
                Write-Host "❌ No tables found in the database" -ForegroundColor Red
            }
            
            return $true
        } else {
            Write-Host "❌ Database connection failed" -ForegroundColor Red
            $result | ForEach-Object { Write-Host "   $_" }
            return $false
        }
    } catch {
        Write-Host "❌ Error testing database connection: $_" -ForegroundColor Red
        return $false
    }
}

# Function to test Dragonfly connection
function Test-DragonflyConnection {
    Write-Host "\n🔍 Testing Dragonfly connection..." -ForegroundColor Cyan
    
    try {
        # Test basic connection
        $ping = docker exec eventmax_dragonfly redis-cli PING 2>&1
        
        if ($ping -eq "PONG") {
            Write-Host "✅ Dragonfly connection successful" -ForegroundColor Green
            
            # Test set/get
            $testKey = "test:connection"
            $testValue = "Hello, Dragonfly!"
            
            docker exec eventmax_dragonfly redis-cli SET $testKey "$testValue" 2>&1 | Out-Null
            $value = docker exec eventmax_dragonfly redis-cli GET $testKey 2>&1
            
            if ($value -eq $testValue) {
                Write-Host "✅ Dragonfly set/get test successful" -ForegroundColor Green
                docker exec eventmax_dragonfly redis-cli DEL $testKey 2>&1 | Out-Null
                return $true
            } else {
                Write-Host "❌ Dragonfly set/get test failed" -ForegroundColor Red
                return $false
            }
        } else {
            Write-Host "❌ Dragonfly connection failed" -ForegroundColor Red
            Write-Host "   Ping response: $ping"
            return $false
        }
    } catch {
        Write-Host "❌ Error testing Dragonfly connection: $_" -ForegroundColor Red
        return $false
    }
}

# Main script execution
Write-Host "\n=== EventMax Setup Verification ===\n" -ForegroundColor Cyan

# Check if Docker is running
if (-not (Test-DockerRunning)) {
    exit 1
}

# Clean up existing containers
Clear-ExistingContainers

# Start services
if (Start-EventMaxServices) {
    # Test database connection
    $dbSuccess = Test-DatabaseConnection
    
    # Test Dragonfly connection
    $dfSuccess = Test-DragonflyConnection
    
    # Display summary
    Write-Host "\n=== Setup Summary ===" -ForegroundColor Cyan
    Write-Host "Database:     $(if ($dbSuccess) { '✅' } else { '❌' }) Connection $(if ($dbSuccess) { 'successful' } else { 'failed' })"
    Write-Host "Dragonfly:    $(if ($dfSuccess) { '✅' } else { '❌' }) Connection $(if ($dfSuccess) { 'successful' } else { 'failed' })"
    
    if ($dbSuccess -and $dfSuccess) {
        Write-Host "\n🎉 EventMax setup is complete and working correctly!" -ForegroundColor Green
        Write-Host "   - PostgreSQL is running on localhost:5433"
        Write-Host "   - Dragonfly is running on localhost:6380"
    } else {
        Write-Host "\n❌ Some services are not working correctly. Please check the error messages above." -ForegroundColor Red
    }
} else {
    Write-Host "\n❌ Failed to start EventMax services. Please check the error messages above." -ForegroundColor Red
}

Write-Host "\nVerification complete." -ForegroundColor Cyan
