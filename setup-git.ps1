# Setup Git and Push to GitHub
# Run this script in PowerShell as Administrator

Write-Host "=== Tier Coffee - Git Setup & Push ===" -ForegroundColor Cyan
Write-Host ""

# Check if Git is installed
$gitInstalled = Get-Command git -ErrorAction SilentlyContinue

if (-not $gitInstalled) {
    Write-Host "Git is not installed. Installing Git..." -ForegroundColor Yellow
    
    # Try to install using winget
    try {
        winget install --id Git.Git -e --source winget
        Write-Host "Git installed successfully!" -ForegroundColor Green
        Write-Host "Please restart PowerShell and run this script again." -ForegroundColor Yellow
        exit
    }
    catch {
        Write-Host "Failed to install Git automatically." -ForegroundColor Red
        Write-Host "Please download and install Git from: https://git-scm.com/download/win" -ForegroundColor Yellow
        exit
    }
}

Write-Host "Git is installed. Proceeding with repository setup..." -ForegroundColor Green
Write-Host ""

# Navigate to project directory
Set-Location "c:\Dev by Tum\Tier Mage\tier-coffee"

# Initialize git repository if not already initialized
if (-not (Test-Path ".git")) {
    Write-Host "Initializing Git repository..." -ForegroundColor Cyan
    git init
    Write-Host "Git repository initialized." -ForegroundColor Green
}

# Add all files
Write-Host "Adding files to Git..." -ForegroundColor Cyan
git add .

# Commit changes
Write-Host "Committing changes..." -ForegroundColor Cyan
git commit -m "feat: Major updates - POS add-ons, Dashboard filters, Stock branch filter, and bug fixes

- Removed seed data for menu items and ingredients (now fully editable via UI)
- Added POS add-ons/modifiers system with dialog selection
- Added editable order total in POS
- Added Dashboard filters: date picker, category filter, branch filter
- Added branch filter to Stock/Ingredients page
- Changed Analytics to show Top 5 menu items
- Made employee wage optional for Admin role
- Fixed all reported bugs and issues"

# Add remote (if not already added)
$remoteExists = git remote | Select-String "origin"
if (-not $remoteExists) {
    Write-Host "Adding GitHub remote..." -ForegroundColor Cyan
    git remote add origin https://github.com/korrakottum-code/Tier-Mage.git
}

# Rename branch to main
Write-Host "Setting branch to main..." -ForegroundColor Cyan
git branch -M main

# Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
Write-Host "You may need to authenticate with GitHub..." -ForegroundColor Yellow
git push -u origin main --force

Write-Host ""
Write-Host "=== Push Complete! ===" -ForegroundColor Green
Write-Host "Repository: https://github.com/korrakottum-code/Tier-Mage" -ForegroundColor Cyan
Write-Host ""
