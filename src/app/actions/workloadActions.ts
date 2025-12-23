"use server";

import { calculateUserWorkload } from "@/lib/workload";

export async function checkWorkloadAction(userId: string, month: number, year: number) {
    return await calculateUserWorkload(userId, month, year);
}
