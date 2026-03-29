const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getDatabaseUrl() {
    // 💡 PRIORITY CONFIGURATION: Always prefer local overrides for testing
    const envKeys = [
        'LOCAL_DATABASE_URL',     // Priority 1: Direct Local Override (SQLite)
        'DOKPLOY_DATABASE_URL',    // Priority 2: Dokploy Production (Internal)
        'POSTGRES_INTERNAL_URL',
        'DATABASE_URL',            // Priority 3: Standard Environment
        'POSTGRES_URL',
        'POSTGRES_PRISMA_URL',
        'POSTGRESQL_URL',
        'DATABASE_URI',
        'POSTGRES_EXTERNAL_URL',
    ];

    // Check process.env first (for CI/CD environments)
    for (const key of envKeys) {
        if (process.env[key] && process.env[key].trim()) {
            return process.env[key].trim();
        }
    }

    // Check .env file directly (for local development fallback)
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        for (const key of envKeys) {
            const regex = new RegExp(`^${key}=["']?([^"'\r\n]+)["']?`, 'm');
            const match = envContent.match(regex);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
    }

    return null;
}

function updatePrismaSchema() {
    const dbUrl = getDatabaseUrl();
    if (!dbUrl) {
        console.warn('⚠️ [PreparePrisma] No DATABASE_URL found. Defaulting to existing schema.');
        return;
    }

    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    if (!fs.existsSync(schemaPath)) {
        console.error('❌ [PreparePrisma] Could not find prisma/schema.prisma');
        process.exit(1);
    }

    let schema = fs.readFileSync(schemaPath, 'utf8');
    const isPostgres = dbUrl.startsWith('postgresql:') || dbUrl.startsWith('postgres:');
    const isSqlite = dbUrl.startsWith('file:') || dbUrl.endsWith('.db');

    let targetProvider = 'sqlite';
    if (isPostgres) {
        targetProvider = 'postgresql';
    } else if (isSqlite) {
        targetProvider = 'sqlite';
    } else {
        console.warn(`⚠️ [PreparePrisma] Unrecognized protocol in ${dbUrl}. Keeping existing provider.`);
        return;
    }

    const providerRegex = /provider\s*=\s*"([^"]+)"/;
    const currentMatch = schema.match(providerRegex);
    
    if (currentMatch && currentMatch[1] !== targetProvider) {
        console.log(`🔄 [PreparePrisma] Switching Prisma provider: ${currentMatch[1]} -> ${targetProvider}`);
        schema = schema.replace(providerRegex, `provider = "${targetProvider}"`);
        fs.writeFileSync(schemaPath, schema);
    } else {
        console.log(`✅ [PreparePrisma] Schema provider is already ${targetProvider}`);
    }
}

try {
    updatePrismaSchema();
    // After updating, run the actual generation
    console.log('🚀 [PreparePrisma] Running npx prisma generate...');
    execSync('npx prisma generate', { stdio: 'inherit' });
} catch (error) {
    console.error('❌ [PreparePrisma] Error during execution:');
    console.error(error.message);
    process.exit(1);
}
