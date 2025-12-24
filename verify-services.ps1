# Verify Docker is running
$dockerRunning = $false
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerRunning = $true
        Write-Host "✅ Docker is running" -ForegroundColor Green
    } else {
        Write-Host "❌ Docker is not running or not accessible" -ForegroundColor Red
        Write-Host $dockerInfo -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error checking Docker: $_" -ForegroundColor Red
    exit 1
}

# Check if containers are running
$containers = docker ps -a --format '{{.Names}}|{{.Status}}|{{.Ports}}' 2>&1
$postgresRunning = $containers -like "*eventmax_postgres*" | Select-String -Pattern "Up" -Quiet
$dragonflyRunning = $containers -like "*eventmax_dragonfly*" | Select-String -Pattern "Up" -Quiet

# Display container status
Write-Host "`n📦 Container Status:" -ForegroundColor Cyan
if ($postgresRunning) {
    Write-Host "✅ PostgreSQL container is running" -ForegroundColor Green
} else {
    Write-Host "❌ PostgreSQL container is not running" -ForegroundColor Red
}

if ($dragonflyRunning) {
    Write-Host "✅ Dragonfly container is running" -ForegroundColor Green
} else {
    Write-Host "❌ Dragonfly container is not running" -ForegroundColor Red
}

# If containers are not running, try to start them
if (-not ($postgresRunning -and $dragonflyRunning)) {
    Write-Host "`n🔄 Starting containers..." -ForegroundColor Yellow
    docker-compose up -d
    
    # Wait for containers to start
    Start-Sleep -Seconds 5
    
    # Check status again
    $containers = docker ps -a --format '{{.Names}}|{{.Status}}|{{.Ports}}' 2>&1
    $postgresRunning = $containers -like "*eventmax_postgres*" | Select-String -Pattern "Up" -Quiet
    $dragonflyRunning = $containers -like "*eventmax_dragonfly*" | Select-String -Pattern "Up" -Quiet
    
    if ($postgresRunning -and $dragonflyRunning) {
        Write-Host "✅ Containers started successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to start containers" -ForegroundColor Red
        Write-Host "`n📜 Container logs:" -ForegroundColor Cyan
        docker-compose logs --tail=20
        exit 1
    }
}

# Test PostgreSQL connection
Write-Host "`n🔍 Testing PostgreSQL connection..." -ForegroundColor Cyan
try {
    $pgTest = docker exec eventmax_postgres psql -U postgres -d eventmax -c "SELECT 'PostgreSQL is working' as status;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL connection successful" -ForegroundColor Green
        
        # Check if tables exist
        $tables = docker exec eventmax_postgres psql -U postgres -d eventmax -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';" 2>&1
        if ($tables -match "\S") {
            Write-Host "✅ Database tables exist:" -ForegroundColor Green
            $tables.Trim() | Where-Object { $_ -ne "" } | ForEach-Object { Write-Host "   $_" }
        } else {
            Write-Host "⚠️  No tables found in the database" -ForegroundColor Yellow
            Write-Host "   Please run the database initialization script" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ PostgreSQL connection failed" -ForegroundColor Red
        Write-Host $pgTest -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error testing PostgreSQL: $_" -ForegroundColor Red
}

# Test Dragonfly connection
Write-Host "`n🔍 Testing Dragonfly connection..." -ForegroundColor Cyan
try {
    $dfTest = docker exec eventmax_dragonfly redis-cli PING 2>&1
    if ($dfTest -eq "PONG") {
        Write-Host "✅ Dragonfly connection successful" -ForegroundColor Green
        
        # Test set/get
        $testKey = "test:connection"
        $testValue = "Hello, Dragonfly!"
        
        docker exec eventmax_dragonfly redis-cli SET $testKey "$testValue" | Out-Null
        $value = docker exec eventmax_dragonfly redis-cli GET $testKey 2>&1
        
        if ($value -eq $testValue) {
            Write-Host "✅ Dragonfly set/get test successful" -ForegroundColor Green
            docker exec eventmax_dragonfly redis-cli DEL $testKey | Out-Null
        } else {
            Write-Host "❌ Dragonfly set/get test failed" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Dragonfly connection failed" -ForegroundColor Red
        Write-Host $dfTest -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error testing Dragonfly: $_" -ForegroundColor Red
}

Write-Host "`n🏁 Verification complete" -ForegroundColor Cyan
