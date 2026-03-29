# Database Connectivity Troubleshooting Guide

If you are seeing "Connection Terminated" or "Connection Timeout" errors in your terminal, it is usually because your current network cannot reach the PostgreSQL host from your configured database URL.

## 1. Quick Reachability Test
Run the following command in your terminal to check if the database port is open and reachable from your computer:

```powershell
# PowerShell (Windows)
Test-NetConnection -ComputerName <your-db-host> -Port 5432
```

- **TcpTestSucceeded: True**: Your network is fine. The issue might be authentication or server-side.
- **TcpTestSucceeded: False**: Your network, firewall, or ISP is blocking port `5432`.

## 2. Common Blockers
- **Public Wi-Fi**: Many public hotspots block non-web ports such as `5432`.
- **Company Firewalls**: Office networks often block outbound database connections.
- **VPN Requirements**: Some servers are reachable only from a private network or VPN.
- **ISP Restrictions**: Some residential ISPs block database ports by default.

## 3. Recommended Fixes

### Scenario A: Remote Database Access Is Required
If you must use the production data:

1. Switch to a different network, such as a mobile hotspot.
2. Ensure any required VPN is connected.
3. Verify that your current public IP is whitelisted on the server firewall.

### Scenario B: General Development
If you only need to work on UI or business logic, use the local SQLite fallback:

1. Open your `.env` file.
2. Set a local file-based database URL:

```env
DATABASE_URL=file:./dev.db
```

3. Restart your development server with `npm run dev`.

## 4. Verifying Connections In Code
The runtime database selection logic lives in `src/lib/prisma/runtime.ts`. You can also verify the active connection with:

```bash
npm run db:check
```
