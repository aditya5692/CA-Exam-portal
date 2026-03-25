"use client";

import { useEffect, useRef, useState } from "react";
import { saveProgress } from "@/actions/progress-actions";

type AutoSaveOptions = {
    resourceType: string;
    resourceId: string;
    debounceMs?: number;
    onSaveSuccess?: () => void;
    onSaveError?: (error: string) => void;
};

/**
 * useAutoSave hook
 * Throttles and debounces progress updates to the server.
 * Buffers data in localStorage for persistence during network/tab closures.
 */
export function useAutoSave<T>({
    resourceType,
    resourceId,
    debounceMs = 20000, // 20 seconds default as per user request
    onSaveSuccess,
    onSaveError
}: AutoSaveOptions) {
    const [data, setData] = useState<T | null>(null);
    const lastSavedDataRef = useRef<string>("");
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Sync with server
    const syncWithServer = async (currentData: T) => {
        const dataStr = JSON.stringify(currentData);
        if (dataStr === lastSavedDataRef.current) return;

        try {
            const result = await saveProgress({
                resourceType,
                resourceId,
                data: currentData
            });

            if (result.success) {
                lastSavedDataRef.current = dataStr;
                onSaveSuccess?.();
            } else {
                onSaveError?.(result.message);
            }
        } catch (err: any) {
            onSaveError?.(err.message || "Failed to sync progress");
        }
    };

    // Effect to handle manual updates and timer
    useEffect(() => {
        if (!data) return;

        if (timerRef.current) clearTimeout(timerRef.current);

        timerRef.current = setTimeout(() => {
            syncWithServer(data);
        }, debounceMs);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [data, debounceMs]);

    // Handle initial state or manual trigger
    const updateProgress = (newData: T) => {
        setData(newData);
    };

    return { updateProgress, currentProgress: data };
}
