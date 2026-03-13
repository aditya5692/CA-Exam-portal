import { defineConfig } from '@prisma/config'

export default defineConfig({
    datasource: {
        url: "file:./dev.db",
    },
    migrations: {
        seed: 'npx tsx ./prisma/seed.ts',
    },
})
