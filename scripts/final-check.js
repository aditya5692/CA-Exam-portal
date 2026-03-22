const { Client } = require('pg');

async function main() {
    const client = new Client({
        connectionString: "postgresql://aditya424:aditya424@72.60.200.196:3000/financlycadatabase"
    });
    try {
        await client.connect();
        const res = await client.query('SELECT "registrationNumber", email, role FROM "User" LIMIT 5');
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

main();
