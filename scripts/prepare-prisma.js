const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getDatabaseUrl() {
    // Priority 1: Check actual process.env (passed by Dokploy/OS)
    // In production, DATABASE_URL is usually PostgreSQL.
    // In local dev, we check for LOCAL_DATABASE_URL first to stick to SQLite.
    
    const envKeys = [
        'LOCAL_DATABASE_URL', // LOCAL FIRST
        'DATABASE_URL',
        'DOKPLOY_DATABASE_URL',
        'POSTGRES_INTERNAL_URL',
        'DATABASE_URI'
    ];

    // Priority 1: Check actual process.env (passed by Dokploy/OS)
    for (const key of envKeys) {
        if (process.env[key] && process.env[key].trim()) {
            return process.env[key].trim();
        }
    }

    // Priority 2: Try to read from .env if it exists (for local dev)
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
