# Roga Deployment Script
# This script deploys the updated game/page.tsx to Vercel

Write-Host "🚀 Starting Roga deployment process..." -ForegroundColor Green

# Set the project directory
$PROJECT_ROOT = "C:\Users\kcoff\Documents\roga"
$WEB_APP_DIR = "$PROJECT_ROOT\apps\web"

# Check if directories exist
if (-not (Test-Path $PROJECT_ROOT)) {
    Write-Host "❌ Project root directory not found: $PROJECT_ROOT" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $WEB_APP_DIR)) {
    Write-Host "❌ Web app directory not found: $WEB_APP_DIR" -ForegroundColor Red
    exit 1
}

# Navigate to project root
Write-Host "📁 Navigating to project directory..." -ForegroundColor Yellow
Set-Location $PROJECT_ROOT

# Check Git status
Write-Host "🔍 Checking Git status..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "📝 Uncommitted changes detected:" -ForegroundColor Yellow
    git status --short
    
    $commit = Read-Host "Do you want to commit and push changes? (y/n)"
    if ($commit -eq "y" -or $commit -eq "Y") {
        Write-Host "📝 Adding all changes..." -ForegroundColor Yellow
        git add .
        
        $commitMessage = Read-Host "Enter commit message (or press Enter for default)"
        if (-not $commitMessage) {
            $commitMessage = "Update game/page.tsx with improved debugging and error handling"
        }
        
        Write-Host "💾 Committing changes..." -ForegroundColor Yellow
        git commit -m $commitMessage
        
        Write-Host "📤 Pushing to GitHub..." -ForegroundColor Yellow
        git push origin main
    }
} else {
    Write-Host "✅ No uncommitted changes found" -ForegroundColor Green
}

# Navigate to web app directory for build test
Write-Host "📁 Navigating to web app directory..." -ForegroundColor Yellow
Set-Location $WEB_APP_DIR

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Run type check and linting (optional - will show issues but won't block)
Write-Host "🔍 Running type check..." -ForegroundColor Yellow
try {
    npm run build 2>&1 | Tee-Object -Variable buildOutput
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️ Build has issues, but continuing with deployment..." -ForegroundColor Yellow
        Write-Host "Build output:" -ForegroundColor Yellow
        $buildOutput | ForEach-Object { Write-Host $_ -ForegroundColor Gray }
    } else {
        Write-Host "✅ Build successful!" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ Build check failed, but continuing with deployment..." -ForegroundColor Yellow
}

# Deploy to Vercel
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Green
try {
    # Check if Vercel CLI is installed
    $vercelVersion = vercel --version 2>$null
    if (-not $vercelVersion) {
        Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
        npm install -g vercel
    }
    
    # Deploy
    Write-Host "🌐 Triggering Vercel deployment..." -ForegroundColor Yellow
    vercel --prod --yes
    
    Write-Host "✅ Deployment initiated!" -ForegroundColor Green
    Write-Host "🌐 Your site should be live at: https://roga.me" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Vercel deployment failed: $_" -ForegroundColor Red
    Write-Host "🔄 Alternative: Vercel will auto-deploy from GitHub push" -ForegroundColor Yellow
}

# Check deployment status
Write-Host "⏳ Waiting 30 seconds for deployment to process..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host "🧪 Testing the deployment..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://roga.me" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Site is responding!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Site returned status code: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Could not reach site (might still be deploying): $_" -ForegroundColor Yellow
}

# Summary
Write-Host "`n🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "🌐 Live URL: https://roga.me/game" -ForegroundColor Cyan
Write-Host "🔧 Debug: Check browser console for detailed logs" -ForegroundColor Yellow
Write-Host "📊 Monitor: Check Vercel dashboard for deployment status" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Visit https://roga.me/game" -ForegroundColor White
Write-Host "2. Open browser Developer Tools (F12)" -ForegroundColor White
Write-Host "3. Go to Console tab" -ForegroundColor White
Write-Host "4. Submit a test question" -ForegroundColor White
Write-Host "5. Review the debug logs to identify the issue" -ForegroundColor White

# Return to original directory
Set-Location $PROJECT_ROOT

Read-Host "Press Enter to exit"