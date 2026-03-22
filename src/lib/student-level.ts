export type CaLevelKey = "foundation" | "ipc" | "final";

function normalizeLevelSource(value: string | null | undefined) {
    return (value ?? "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

export function resolveStudentCALevel(
    examTarget: string | null | undefined,
    department?: string | null | undefined,
): CaLevelKey {
    const examTargetValue = normalizeLevelSource(examTarget);
    const departmentValue = normalizeLevelSource(department);

    if (examTargetValue.includes("foundation")) {
        return "foundation";
    }

    if (
        examTargetValue.includes("intermediate") ||
        examTargetValue.includes("ca inter") ||
        examTargetValue.includes("ipc")
    ) {
        return "ipc";
    }

    if (examTargetValue.includes("final")) {
        return "final";
    }

    if (
        departmentValue.includes("foundation")
    ) {
        return "foundation";
    }

    if (
        departmentValue.includes("intermediate") ||
        departmentValue.includes("ca inter") ||
        departmentValue.includes("ipc")
    ) {
        return "ipc";
    }

    if (departmentValue.includes("final")) {
        return "final";
    }

    return "final";
}

export function getStudentCACategory(level: CaLevelKey) {
    if (level === "foundation") {
        return "CA Foundation";
    }

    if (level === "ipc") {
        return "CA Intermediate";
    }

    return "CA Final";
}
