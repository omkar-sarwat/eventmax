# EventMax API Endpoint Testing Script
# Tests API endpoints and measures response times

$baseUrl = "http://localhost:4000"
$apiUrl = "$baseUrl/api/v1"

Write-Host "🚀 EventMax API Testing Started" -ForegroundColor Green
Write-Host "🎯 Target: $baseUrl" -ForegroundColor Blue
Write-Host "=" * 80 -ForegroundColor Cyan

function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Path,
        [object]$Body = $null,
        [int]$ExpectedStatus = 200,
        [hashtable]$Headers = @{}
    )
    
    $url = if ($Path.StartsWith("/api/")) { "$baseUrl$Path" } else { "$apiUrl$Path" }
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    
    try {
        $params = @{
            Uri = $url
            Method = $Method
            TimeoutSec = 10
            Headers = $Headers
        }
        
        if ($Body -and ($Method -eq "POST" -or $Method -eq "PUT" -or $Method -eq "PATCH")) {
            $params.Body = $Body | ConvertTo-Json
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-RestMethod @params -ErrorAction Stop
        $stopwatch.Stop()
        $latency = $stopwatch.ElapsedMilliseconds
        
        $status = "✅ PASS"
        $color = "Green"
        
        if ($latency -gt 1000) {
            $color = "Red"
            $status = "🚨 SLOW"
        } elseif ($latency -gt 500) {
            $color = "Yellow"
            $status = "⚠️  WARN"
        }
        
        Write-Host "$status $($Method.PadRight(6)) $($Path.PadRight(40)) $($latency)ms" -ForegroundColor $color
        return @{ Success = $true; Latency = $latency; Response = $response }
        
    } catch {
        $stopwatch.Stop()
        $latency = $stopwatch.ElapsedMilliseconds
        $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { 0 }
        
        $status = if ($statusCode -eq $ExpectedStatus) { "✅ PASS" } else { "❌ FAIL" }
        $color = if ($statusCode -eq $ExpectedStatus) { "Green" } else { "Red" }
        
        Write-Host "$status $($Method.PadRight(6)) $($Path.PadRight(40)) $($latency)ms ($statusCode)" -ForegroundColor $color
        return @{ Success = ($statusCode -eq $ExpectedStatus); Latency = $latency; Error = $_.Exception.Message }
    }
}

# Health Checks
Write-Host "`n🏥 HEALTH CHECKS" -ForegroundColor Yellow
Write-Host "=" * 80 -ForegroundColor Cyan

Test-Endpoint "GET" "/health"
Test-Endpoint "GET" "/ping"
Test-Endpoint "GET" "/info"

# Authentication Tests (should fail without proper data)
Write-Host "`n🔐 AUTHENTICATION TESTS" -ForegroundColor Yellow
Write-Host "=" * 80 -ForegroundColor Cyan

Test-Endpoint "POST" "/auth/register" @{} 400
Test-Endpoint "POST" "/auth/login" @{} 400
Test-Endpoint "POST" "/auth/refresh" @{} 401
Test-Endpoint "GET" "/auth/profile" $null 401

# Event Tests
Write-Host "`n📅 EVENT TESTS" -ForegroundColor Yellow
Write-Host "=" * 80 -ForegroundColor Cyan

Test-Endpoint "GET" "/events"
Test-Endpoint "GET" "/events/non-existent" $null 404
Test-Endpoint "POST" "/events" @{} 401

# Booking Tests (should require auth)
Write-Host "`n🎫 BOOKING TESTS" -ForegroundColor Yellow
Write-Host "=" * 80 -ForegroundColor Cyan

Test-Endpoint "POST" "/bookings/attempt" @{} 401
Test-Endpoint "POST" "/bookings/verify" @{} 401
Test-Endpoint "POST" "/bookings/confirm" @{} 401
Test-Endpoint "GET" "/bookings/history" $null 401

# Ultra-Fast Endpoints (should require auth)
Write-Host "`n⚡ ULTRA-FAST ENDPOINTS" -ForegroundColor Yellow
Write-Host "=" * 80 -ForegroundColor Cyan

Test-Endpoint "POST" "/seats/ultra-fast/status" @{} 401
Test-Endpoint "POST" "/seats/ultra-fast/lock" @{} 401
Test-Endpoint "POST" "/seats/minimal/lock" @{} 401

# Test Endpoints (no auth required)
Write-Host "`n🧪 TEST ENDPOINTS" -ForegroundColor Yellow
Write-Host "=" * 80 -ForegroundColor Cyan

$testData = @{
    eventId = "test-event"
    seatLabels = @("A1", "A2")
    userId = "test-user"
}

Test-Endpoint "POST" "/seats/test/ultra-fast/status" $testData 400
Test-Endpoint "POST" "/seats/test/reserve" $testData 500

Write-Host "`n🎉 API Testing Completed!" -ForegroundColor Green
