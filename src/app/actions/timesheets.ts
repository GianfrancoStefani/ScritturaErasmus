"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function logTime(data: {
    projectId: string;
    userId: string;
    date: Date;
    hours: number;
    description?: string;
    workId?: string;
    taskId?: string;
    activityId?: string;
}) {
    // 1. Auth Check (Basic) - Ensure user is logging for themselves or is admin
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };
    // TODO: Add stricter check if needed (e.g. only self unless admin)

    try {
        const entry = await prisma.timesheetEntry.create({
            data: {
                projectId: data.projectId,
                userId: data.userId,
                date: data.date,
                hours: data.hours,
                description: data.description,
                workId: data.workId,
                taskId: data.taskId,
                activityId: data.activityId,
                status: "DRAFT"
            }
        });

        revalidatePath(`/dashboard/projects/${data.projectId}`);
        revalidatePath(`/dashboard/workload`);
        
        return { success: true, entry };
    } catch (e) {
        console.error("Failed to log time", e);
        return { success: false, error: "Failed to log time" };
    }
}

export async function getTimesheets(projectId: string, userId?: string) {
    try {
        const where: any = { projectId };
        if (userId) where.userId = userId;

        const entires = await prisma.timesheetEntry.findMany({
            where,
            include: {
                user: true,
                activity: true,
                task: true,
                work: true
            },
            orderBy: { date: 'desc' }
        });
        
        return { success: true, data: entires };
    } catch (e) {
        return { success: false, error: "Failed to fetch timesheets" };
    }
}

export async function getWorkloadVariance(projectId: string) {
    try {
        // 1. Get Planned (Assignments)
        const assignments = await prisma.assignment.findMany({
            where: {
                // Determine scope based on projectId logic. 
                // Assignments are linked to Activity/Task/Work/Section which belong to Project.
                // We must query assignments where connected entities belong to projectId.
                // Or simplified: assignments doesn't strictly link to Project directly in schema?
                // Wait, Assignment links to User and Activity/Task/Work.
                // Activity links to Task -> Work -> Project.
                OR: [
                    { activity: { task: { work: { projectId } } } },
                    { task: { work: { projectId } } },
                    { work: { projectId } },
                    { section: { projectId } }
                ]
            },
            include: {
                user: { include: { partner: true } },
                activity: true
            }
        });

        // 2. Get Actual (Timesheets)
        const timesheets = await prisma.timesheetEntry.findMany({
            where: { projectId }
        });

        // 3. Aggregate
        // We want to group by User.
        const stats = new Map<string, {
            userId: string, 
            userName: string, 
            partnerName: string,
            plannedDays: number, 
            actualHours: number 
        }>();

        // Process Planned
        assignments.forEach((a: any) => {
             const key = a.userId;
             if (!stats.has(key)) {
                 stats.set(key, { 
                     userId: a.userId, 
                     userName: `${a.user.name} ${a.user.surname}`,
                     partnerName: a.user.partner?.name || "Unknown",
                     plannedDays: 0, 
                     actualHours: 0 
                 });
             }
             const curr = stats.get(key)!;
             curr.plannedDays += a.days;
        });

        // Process Actual
        timesheets.forEach((t: any) => {
             const key = t.userId;
             // If user logged time but has no assignment, we still show them? Yes.
             if (!stats.has(key)) {
                 stats.set(key, { 
                     userId: t.userId, 
                     userName: "Unknown User", // Fetch user detail if needed or optimized query above
                     partnerName: "Unknown",
                     plannedDays: 0, 
                     actualHours: 0 
                 });
             }
             const curr = stats.get(key)!;
             curr.actualHours += t.hours;
        });
        
        // Enhance "Unknown User" if needed by fetching users, 
        // but typically timesheet users will have assignments or be project members.
        
        const varianceData = Array.from(stats.values()).map(s => ({
            ...s,
            plannedHours: s.plannedDays * 8, // Assuming 8h day
            variance: (s.plannedDays * 8) - s.actualHours, // Positive = Under budget, Negative = Over budget
            utilization: s.plannedDays > 0 ? (s.actualHours / (s.plannedDays * 8)) * 100 : 0
        }));

        return { success: true, varianceData };

    } catch (e) {
        console.error(e);
        return { success: false, error: "Failed to calc variance" };
    }
}
