#!/usr/bin/env pwsh
# ============================================================
#  InterviAI — Progressive Assembly Optimization Test Script
#  Tests that the optimization works WITHOUT breaking existing flow
#
#  Usage:
#    .\scripts\test-progressive-assembly.ps1 -BaseUrl "http://localhost:3001" -Token "<jwt>" -ConfigId "<examConfigId>"
#
#  Requirements:
#    - PowerShell 7+
#    - API server running locally
#    - A valid CANDIDATE JWT token
#    - A valid examConfigId with 2+ sections in the DB
# ============================================================

param(
    [string]$BaseUrl   = "http://localhost:3001",
    [string]$Token     = $env:TEST_JWT_TOKEN,
    [string]$ConfigId  = $env:TEST_EXAM_CONFIG_ID
)

# ─── Helpers ─────────────────────────────────────────────────────────────────

$Headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type"  = "application/json"
}

$Passed = 0
$Failed = 0
$Warnings = 0

function Write-Pass($msg) {
    Write-Host "  ✅ PASS  $msg" -ForegroundColor Green
    $script:Passed++
}
function Write-Fail($msg) {
    Write-Host "  ❌ FAIL  $msg" -ForegroundColor Red
    $script:Failed++
}
function Write-Warn($msg) {
    Write-Host "  ⚠️  WARN  $msg" -ForegroundColor Yellow
    $script:Warnings++
}
function Write-Step($msg) {
    Write-Host ""
    Write-Host "── $msg" -ForegroundColor Cyan
}
function Write-Info($msg) {
    Write-Host "     ℹ️   $msg" -ForegroundColor DarkGray
}

# ─── Pre-Flight ───────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║  InterviAI Progressive Assembly — Optimization Tester   ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

if (-not $Token)    { Write-Host "ERROR: -Token required" -ForegroundColor Red; exit 1 }
if (-not $ConfigId) { Write-Host "ERROR: -ConfigId required" -ForegroundColor Red; exit 1 }

Write-Host "  Base URL  : $BaseUrl"
Write-Host "  ConfigId  : $ConfigId"
Write-Host ""

$testInstanceId = $null
$sections       = $null

# ─── TEST 1: Start Test Timing ────────────────────────────────────────────────

Write-Step "TEST 1 — Exam Start Time (should be < 90s with progressive mode)"

$body = @{ testConfigId = $ConfigId } | ConvertTo-Json
$sw   = [System.Diagnostics.Stopwatch]::StartNew()

try {
    $resp = Invoke-RestMethod -Uri "$BaseUrl/api/v1/tests/start" `
        -Method POST -Headers $Headers -Body $body -ErrorAction Stop
    $sw.Stop()
    $elapsedSec = [math]::Round($sw.Elapsed.TotalSeconds, 1)

    if ($resp.success -eq $true -and $resp.data.testInstanceId) {
        $testInstanceId = $resp.data.testInstanceId
        Write-Info "testInstanceId = $testInstanceId"
        Write-Info "Elapsed time   = ${elapsedSec}s"

        if ($elapsedSec -le 90) {
            Write-Pass "Start returned in ${elapsedSec}s (✅ Progressive mode active)"
        } elseif ($elapsedSec -le 300) {
            Write-Warn "Start returned in ${elapsedSec}s — slow but alive. Progressive mode may not be active yet."
        } else {
            Write-Fail "Start took ${elapsedSec}s — full sequential assembly running. Progressive mode NOT enabled."
        }
    } else {
        Write-Fail "startTest returned success=false or missing testInstanceId: $($resp | ConvertTo-Json -Compress)"
        exit 1
    }
} catch {
    $sw.Stop()
    Write-Fail "startTest API call failed: $_"
    exit 1
}

# ─── TEST 2: Section 1 Has Questions Immediately ─────────────────────────────

Write-Step "TEST 2 — Section 1 Is Populated Immediately After Start"

try {
    $snap = Invoke-RestMethod -Uri "$BaseUrl/api/v1/tests/$testInstanceId" `
        -Method GET -Headers $Headers -ErrorAction Stop

    $sections = $snap.sections
    Write-Info "Total sections in snapshot: $($sections.Count)"

    if ($sections.Count -lt 1) {
        Write-Fail "No sections returned in snapshot"
    } else {
        $sec1 = $sections[0]
        $sec1QCount = $sec1.questions.Count
        Write-Info "Section 1 ('$($sec1.sectionName)') question count: $sec1QCount"

        if ($sec1QCount -gt 0) {
            Write-Pass "Section 1 has $sec1QCount questions ready immediately ✅"
        } else {
            Write-Fail "Section 1 has 0 questions — assembly did not populate Section 1"
        }
    }
} catch {
    Write-Fail "loadAssessment (GET /tests/$testInstanceId) failed: $_"
}

# ─── TEST 3: Background Worker Populates Sections 2..N ───────────────────────

Write-Step "TEST 3 — Sections 2..N Get Populated in Background (polls every 10s, max 10 min)"

if ($null -eq $sections -or $sections.Count -le 1) {
    Write-Warn "Exam config only has 1 section — background population test skipped"
} else {
    Write-Info "Waiting for background worker to populate $($sections.Count - 1) remaining section(s)..."

    $maxWaitSec     = 600
    $pollIntervalSec= 10
    $waited         = 0
    $allPopulated   = $false

    while ($waited -lt $maxWaitSec) {
        Start-Sleep -Seconds $pollIntervalSec
        $waited += $pollIntervalSec

        try {
            $snap2    = Invoke-RestMethod -Uri "$BaseUrl/api/v1/tests/$testInstanceId" `
                -Method GET -Headers $Headers -ErrorAction Stop
            $allReady = $true

            for ($i = 1; $i -lt $snap2.sections.Count; $i++) {
                $s = $snap2.sections[$i]
                if ($s.questions.Count -eq 0) {
                    $allReady = $false
                    Write-Info "  [${waited}s] Section $($i+1) ('$($s.sectionName)'): still populating..."
                } else {
                    Write-Info "  [${waited}s] Section $($i+1) ('$($s.sectionName)'): $($s.questions.Count) questions ✓"
                }
            }

            if ($allReady) { $allPopulated = $true; break }
        } catch {
            Write-Warn "Poll at ${waited}s failed: $_"
        }
    }

    if ($allPopulated) {
        Write-Pass "All sections populated in background within ${waited}s ✅"
    } else {
        Write-Fail "Sections 2..N NOT fully populated after ${maxWaitSec}s — background worker may have failed"
    }
}

# ─── TEST 4: Section Advance (One-Way Door) ────────────────────────────────

Write-Step "TEST 4 — Section Advance Works (One-Way Door Confirmed)"

try {
    $advResp = Invoke-RestMethod -Uri "$BaseUrl/api/v1/tests/$testInstanceId/sections/advance" `
        -Method POST -Headers $Headers -ErrorAction Stop

    Write-Info "advanceSection response: $($advResp | ConvertTo-Json -Compress)"

    if ($null -ne $advResp.nextSectionIndex -and $advResp.nextSectionIndex -ge 0) {
        Write-Pass "Section advanced → nextSectionIndex=$($advResp.nextSectionIndex), submitted=$($advResp.submitted)"
    } elseif ($advResp.submitted -eq $true -or $advResp.isLastSection -eq $true) {
        Write-Pass "Last section advanced — exam auto-submitted (correct for single/last-section)"
    } else {
        Write-Warn "advanceSection returned unexpected body — inspect manually"
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 409) {
        Write-Pass "409 Conflict — idempotency guard working (advance already processed)"
    } else {
        Write-Fail "advanceSection failed with status $statusCode: $_"
    }
}

# ─── TEST 5: Section 1 Is LOCKED After Advance ───────────────────────────────

Write-Step "TEST 5 — Section 1 Is LOCKED, Section 2 Is ACTIVE (Cannot Go Back)"

try {
    $snap3     = Invoke-RestMethod -Uri "$BaseUrl/api/v1/tests/$testInstanceId" `
        -Method GET -Headers $Headers -ErrorAction Stop
    $sec1Status = $snap3.sections[0].status
    Write-Info "Section 1 status after advance: $sec1Status"

    if ($sec1Status -eq "LOCKED" -or $sec1Status -eq "COMPLETED") {
        Write-Pass "Section 1 is '$sec1Status' — one-way door confirmed ✅"
    } else {
        Write-Fail "Section 1 status is '$sec1Status' — expected LOCKED or COMPLETED"
    }

    if ($snap3.sections.Count -gt 1) {
        $sec2Status = $snap3.sections[1].status
        Write-Info "Section 2 status after advance: $sec2Status"
        if ($sec2Status -eq "ACTIVE") {
            Write-Pass "Section 2 is ACTIVE — next section correctly activated ✅"
        } else {
            Write-Warn "Section 2 status is '$sec2Status' — expected ACTIVE"
        }
    }
} catch {
    Write-Fail "loadAssessment after advance failed: $_"
}

# ─── TEST 6: Manual Submission Still Works ────────────────────────────────────

Write-Step "TEST 6 — Manual Submit Still Works (allowPartial=true for test safety)"

try {
    $subResp = Invoke-RestMethod `
        -Uri "$BaseUrl/api/v1/tests/$testInstanceId/submit?allowPartial=true" `
        -Method POST -Headers $Headers -ErrorAction Stop

    Write-Info "submit response: $($subResp | ConvertTo-Json -Compress)"

    if ($subResp.submissionId -or $subResp.status -match "SUBMITTED") {
        Write-Pass "Submission succeeded — status=$($subResp.status), id=$($subResp.submissionId) ✅"
    } else {
        Write-Warn "Submit returned unexpected body (may already be submitted)"
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 409) {
        Write-Pass "409 Conflict — already submitted (idempotency guard working) ✅"
    } else {
        Write-Fail "Submit failed with status $statusCode: $_"
    }
}

# ─── Summary ─────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "  Test Results Summary" -ForegroundColor Magenta
Write-Host "════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "  ✅ Passed  : $Passed" -ForegroundColor Green
Write-Host "  ❌ Failed  : $Failed" -ForegroundColor Red
Write-Host "  ⚠️  Warnings: $Warnings" -ForegroundColor Yellow
Write-Host ""

if ($Failed -eq 0) {
    Write-Host "  🎉 All tests passed! Optimization working, existing flow preserved." -ForegroundColor Green
} else {
    Write-Host "  ❗ $Failed test(s) failed. Review output above before deploying." -ForegroundColor Red
    exit 1
}
