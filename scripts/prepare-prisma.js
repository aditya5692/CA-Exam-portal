const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getDatabaseUrl() {
    const envKeys = [
        'LOCAL_DATABASE_URL',
        'DATABASE_URL',
        'POSTGRES_URL',
        'POSTGRES_PRISMA_URL',
        'DOKPLOY_DATABASE_URL',
        'POSTGRES_INTERNAL_URL',
    ];

    const getEnvValue = (key) => {
        // 1. Check process.env (provided by OS or dotenv)
        const procVal = process.env[key]?.trim();
        if (procVal) return procVal;

        // 2. Manual fallback: Read .env directly
        try {
            const envPath = path.join(process.cwd(), '.env');
            if (fs.existsSync(envPath)) {
                const envContent = fs.readFileSync(envPath, 'utf8');
                const regex = new RegExp(`^${key}=\\s*["']?([^"'\r\n]+)["']?`, 'm');
                const match = envContent.match(regex);
                if (match && match[1]) return match[1].trim();
            }
        } catch (e) { /* ignore */ }
        return null;
    };

    for (const key of envKeys) {
        const val = getEnvValue(key);
        if (val) return val;
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
        console.error('❌ [PreparePrisma] Could find prisma/schema.prisma');
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

    const datasourceRegex = /datasource\s+db\s*{[^}]*provider\s*=\s*"([^"]+)"/;
    const currentMatch = schema.match(datasourceRegex);
    
    if (currentMatch && currentMatch[1] !== targetProvider) {
        console.log(`🔄 [PreparePrisma] Switching Prisma provider: ${currentMatch[1]} -> ${targetProvider}`);
        // Replace only the provider within the datasource block. 
        // Note: In Prisma 7 with prisma.config.ts, the 'url' property must NOT be in schema.prisma
        const updatedSchema = schema.replace(
            /(datasource\s+db\s*{[^}]*provider\s*=\s*")([^"]+)(")/,
            `$1${targetProvider}$3`
        );
        fs.writeFileSync(schemaPath, updatedSchema);
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
