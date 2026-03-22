const { Client } = require('pg');

async function main() {
    const client = new Client({
        connectionString: "postgresql://aditya424:aditya424@72.60.200.196:3000/financlycadatabase"
    });
    try {
        await client.connect();
        const res = await client.query('SELECT COUNT(*) FROM "User"');
        console.log(`Total users: ${res.rows[0].count}`);
        
        const users = await client.query('SELECT registrationNumber, email, role FROM "User" WHERE email IS NOT NULL LIMIT 20');
        console.table(users.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

main();
