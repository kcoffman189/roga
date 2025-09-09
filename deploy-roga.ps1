param(
  [string] $CommitMessage = "Roga: ChatGPT scoring + /api/ask proxy update",
  [switch] $SkipVercel,
  [switch] $SkipFly,
  [string] $FlyApp = "roga-api"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Assert-Cmd($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Required command '$name' not found on PATH. Please install it."
  }
}

Write-Host "Checking required tools..."
Assert-Cmd git
if (-not $SkipFly) { Assert-Cmd flyctl }

# Sanity check: repo root should contain 'apps'
if (-not (Test-Path 'apps')) {
  throw "This script expects to be run from the repository root (where the 'apps' folder exists)."
}

# 1) Push to GitHub to trigger Vercel (frontend)
if (-not $SkipVercel) {
  Write-Host "`nPushing code to GitHub (triggers Vercel deploy)..."
  git add -A

  # If there is nothing to commit, avoid failing the script
  $gitStatus = git status --porcelain
  if ($gitStatus) {
    git commit -m $CommitMessage
  } else {
    Write-Host "No changes to commit. Continuing..."
  }

  $branch = git branch --show-current
  if (-not $branch) { $branch = "main" }

  Write-Host ("Pushing to origin/{0}..." -f $branch)
  git push origin $branch

  Write-Host "Git push complete. Vercel will auto-deploy the frontend."
} else {
  Write-Host "`nSkipping Vercel push as requested."
}

# 2) Deploy FastAPI to Fly.io (backend)
if (-not $SkipFly) {
  Write-Host "`nDeploying FastAPI backend to Fly.io app '$FlyApp'..."

  # Ensure OPENAI_API_KEY is available on Fly (uncomment if you need to set it)
  # flyctl secrets set OPENAI_API_KEY=$env:OPENAI_API_KEY --app $FlyApp

  Push-Location "apps/api"
  try {
    flyctl deploy --app $FlyApp --remote-only
    Write-Host ("Fly.io deploy complete: https://{0}.fly.dev" -f $FlyApp)
  } finally {
    Pop-Location
  }
} else {
  Write-Host "`nSkipping Fly.io deploy as requested."
}

Write-Host "`nDone. Frontend will deploy via Vercel; backend deployed to Fly.io (if not skipped)."
