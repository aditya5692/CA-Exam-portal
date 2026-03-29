# 🐘 Database Connectivity Troubleshooting Guide

If you are seeing "Connection Terminated" or "Connection Timeout" errors in your terminal, it is usually because your current network cannot reach the remote PostgreSQL server at `72.60.200.196` on port `5432`.

## 1. Quick Reachability Test
Run the following command in your terminal to check if the database port is open and reachable from your computer:

```powershell
# PowerShell (Windows)
Test-NetConnection -ComputerName 72.60.200.196 -Port 5432
```

- **TcpTestSucceeded: True**: Your network is fine. The issue might be authentication or server-side.
- **TcpTestSucceeded: False**: Your network (ISP, Router, or Firewall) is blocking Port 5432.

## 2. Common Blockers
- **Public Wi-Fi**: Many public hotspots (cafes, airports) block non-web ports like 5432.
- **Company Firewalls**: Strict office networks often block outbound database connections.
- **VPNs**: If the server is on a private cloud, you may need a specific VPN to be active.
- **ISP Restrictions**: Some residential ISPs block standard database ports for security.

## 3. Recommended Fixes

### Scenario A: Remote Database Access is Required
If you MUST use the production data:
1. Try switching to a different network (e.g., mobile hotspot).
2. Ensure any required VPN is connected.
3. Verify that your current Public IP is whitelisted on the server firewall.

### Scenario B: General Development (Recommended)
If you just need to work on the UI or business logic, use the local SQLite fallback:
1. Open your `.env` file.
2. Uncomment the `LOCAL_DATABASE_URL` line:
   ```env
   LOCAL_DATABASE_URL=file:./dev.db
   ```
3. Restart your development server (`npm run dev`).

> [!TIP]
> Using the local SQLite fallback is the most stable way to develop the frontend, as it guarantees zero latency and 100% uptime regardless of your network conditions.

## 4. Verifying Connections in Code
The `src/lib/prisma/runtime.ts` file has been enhanced with proactive health checks. When starting `npm run dev`, check your terminal for the `❌ [PostgreSQL Pool Error]` header for automated diagnosis.
