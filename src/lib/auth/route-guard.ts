import type { AppRole } from "@/lib/auth/demo-accounts";
import { getRoleRedirectPath } from "@/lib/server/auth-management";
import { redirect } from "next/navigation";
import { getSessionPayload } from "./session";

function roleMatches(sessionRole: string, allowedRoles: AppRole | AppRole[]) {
    if (Array.isArray(allowedRoles)) {
        return allowedRoles.includes(sessionRole as AppRole);
    }

    return sessionRole === allowedRoles;
}

export async function requireSessionRole(allowedRoles: AppRole | AppRole[]) {
    const session = await getSessionPayload();

    if (!session) {
        redirect("/auth/login");
    }

    if (!roleMatches(session.role, allowedRoles)) {
        redirect(getRoleRedirectPath(session.role as AppRole));
    }

    return session;
}
