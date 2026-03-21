import "server-only";

import prisma from "@/lib/prisma/client";
import { Prisma } from "@prisma/client";

export type ManagedActor = {
    id: string;
    role: string;
};

export type ManagedEducatorOption = Prisma.UserGetPayload<{
    select: {
        id: true;
        fullName: true;
        email: true;
        role: true;
    };
}>;

export type ManagedEducatorRecord = Prisma.UserGetPayload<{
    select: {
        id: true;
        fullName: true;
        email: true;
        role: true;
    };
}>;

export function isAdminUser(user: { role: string }) {
    return user.role === "ADMIN";
}

export async function listManagedEducatorOptions() {
    return prisma.user.findMany({
        where: {
            role: {
                in: ["TEACHER", "ADMIN"],
            },
        },
        select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
        },
        orderBy: [
            { fullName: "asc" },
            { email: "asc" },
        ],
    });
}

export async function ensureManagedEducatorRecord(
    educatorId: string,
    notFoundMessage = "Selected educator was not found.",
) {
    const educator = await prisma.user.findFirst({
        where: {
            id: educatorId,
            role: {
                in: ["TEACHER", "ADMIN"],
            },
        },
        select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
        },
    });

    if (!educator) {
        throw new Error(notFoundMessage);
    }

    return educator;
}

type ResolveManagedEducatorOptions = {
    allowAdminFallbackToActor?: boolean;
    missingSelectionMessage?: string;
    notFoundMessage?: string;
};

export async function resolveManagedEducatorId(
    actor: ManagedActor,
    requestedEducatorId: string | null,
    options: ResolveManagedEducatorOptions = {},
) {
    const {
        allowAdminFallbackToActor = true,
        missingSelectionMessage = "Selected educator was not found.",
        notFoundMessage = "Selected educator was not found.",
    } = options;

    if (!isAdminUser(actor)) {
        return actor.id;
    }

    if (!requestedEducatorId) {
        if (allowAdminFallbackToActor) {
            return actor.id;
        }

        throw new Error(missingSelectionMessage);
    }

    const educator = await ensureManagedEducatorRecord(requestedEducatorId, notFoundMessage);
    return educator.id;
}
