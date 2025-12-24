# Simple connection test script

Write-Host "=== Testing PostgreSQL Connection ===" -ForegroundColor Cyan
$postgresTest = docker exec eventmax_postgres psql -U postgres -d eventmax -c "SELECT 'PostgreSQL connection successful' AS status;" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ PostgreSQL connection successful" -ForegroundColor Green
    $tables = docker exec eventmax_postgres psql -U postgres -d eventmax -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';" 2>&1
    Write-Host "   Tables found: $($tables.Count)"
} else {
    Write-Host "❌ PostgreSQL connection failed" -ForegroundColor Red
    $postgresTest | ForEach-Object { Write-Host "   $_" }
}

Write-Host "
=== Testing Dragonfly Connection ===" -ForegroundColor Cyan
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
    } else {
        Write-Host "❌ Dragonfly set/get test failed" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Dragonfly connection failed" -ForegroundColor Red
    $ping | ForEach-Object { Write-Host "   $_" }
}
