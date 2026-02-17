# GitHub Auto-Sync Script for St. Francis Portal
# This script automates adding changes, committing, pulling latest from remote, and pushing.

$ErrorActionPreference = "Stop"

function Write-Header($msg) {
    Write-Host "`n==== $msg ====" -ForegroundColor Cyan
}

try {
    Write-Header "Checking Git Status"
    $status = git status --porcelain
    
    if ($null -eq $status -or $status.Trim() -eq "") {
        Write-Host "No changes to sync. Just checking for updates from remote..." -ForegroundColor Yellow
    } else {
        Write-Header "Adding Changes"
        git add .
        
        Write-Header "Committing Changes"
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        git commit -m "Auto-sync: $timestamp"
    }

    Write-Header "Pulling Latest Changes (Rebase)"
    # Using rebase to keep a linear history, especially helpful with Lovable auto-commits
    git pull --rebase origin main

    Write-Header "Pushing to GitHub"
    git push origin main

    Write-Host "`nSuccess! Your workspace is in sync with GitHub." -ForegroundColor Green
}
catch {
    Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Sync failed. You might need to resolve conflicts manually." -ForegroundColor Yellow
}

Write-Host "`nPress any key to exit..."
[void][System.Console]::ReadKey($true)
