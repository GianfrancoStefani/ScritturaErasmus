"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface AssignParams {
    userId: string;
    days: number;
    months: string[];
    taskId?: string;
    workId?: string;
    sectionId?: string;
    activityId?: string;
}

export async function assignUser(params: AssignParams) {
    try {
        await prisma.assignment.create({
            data: {
                userId: params.userId,
                days: params.days,
                months: JSON.stringify(params.months),
                dailyRate: 0,
                // Optional links
                taskId: params.taskId,
                workId: params.workId,
                sectionId: params.sectionId,
                activityId: params.activityId
            }
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to assign user:", error);
        return { error: "Failed to assign user" };
    }
}

export async function removeAssignment(assignmentId: string) {
    try {
        await prisma.assignment.delete({ where: { id: assignmentId } });
        return { success: true };
    } catch (error) {
        return { error: "Failed to remove assignment" };
    }
}

export async function getAssignments(containerId: string, type: 'TASK' | 'WORK' | 'SECTION' | 'ACTIVITY') {
    const where: any = {};
    if (type === 'TASK') where.taskId = containerId;
    if (type === 'WORK') where.workId = containerId;
    if (type === 'SECTION') where.sectionId = containerId;
    if (type === 'ACTIVITY') where.activityId = containerId;

    try {
        const assignments = await prisma.assignment.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, surname: true, email: true } }
            }
        });
        return assignments;
    } catch (error) {
        return [];
    }
}
