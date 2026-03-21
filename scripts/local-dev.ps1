# scripts/local-dev.ps1
# This script automates local development with SQLite while keeping the production schema as PostgreSQL.

$schemaPath = "prisma/schema.prisma"
$backupPath = "prisma/schema.prisma.bak"

Write-Host "🚧 Preparing local SQLite environment..." -ForegroundColor Cyan

# 1. Backup and Swap to SQLite
if (Test-Path $backupPath) { Remove-Item $backupPath }
Copy-Item $schemaPath $backupPath
(Get-Content $schemaPath) -replace 'provider = "postgresql"', 'provider = "sqlite"' | Set-Content $schemaPath

# 2. Configure Local .env for this session
$env:DATABASE_URL = "file:./dev.db"

# 3. Synchronize Database & Generate
Write-Host "🔄 Syncing database and generating client..." -ForegroundColor Yellow
npx prisma generate
npx prisma db push --accept-data-loss

# 4. Seed with Test Data (to fix "Unauthorized" errors)
Write-Host "🌱 Seeding local database..." -ForegroundColor Green
npx tsx ./prisma/seed.ts

# 5. Restore PostgreSQL for Git/Production
Write-Host "✅ Restoring PostgreSQL schema for production safety..." -ForegroundColor Cyan
Copy-Item $backupPath $schemaPath -Force
Remove-Item $backupPath

# 6. Start Dev Server
Write-Host "🚀 Starting Next.js Dev Server (Local Mode)..." -ForegroundColor Green
npm run dev
