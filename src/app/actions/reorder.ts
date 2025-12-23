"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function reorderWorks(items: { id: string, order: number }[], projectId: string) {
    try {
        const transaction = items.map((item) => 
            prisma.work.update({
                where: { id: item.id },
                data: { order: item.order }
            })
        );
        
        await prisma.$transaction(transaction);
        revalidatePath(`/dashboard/projects/${projectId}`);
        return { success: true };
    } catch (e) {
        console.error("Failed to reorder works:", e);
        return { error: "Failed to reorder works" };
    }
}

export async function reorderSections(items: { id: string, order: number }[], projectId: string) {
    try {
        const transaction = items.map((item) => 
            prisma.section.update({
                where: { id: item.id },
                data: { order: item.order }
            })
        );
        
        await prisma.$transaction(transaction);
        revalidatePath(`/dashboard/projects/${projectId}`);
        return { success: true };
    } catch (e) {
        console.error("Failed to reorder sections:", e);
        return { error: "Failed to reorder sections" };
    }
}

export async function reorderModules(items: { id: string, order: number }[], projectId: string) {
    try {
        console.log(`[reorderModules] Reordering ${items.length} modules for project ${projectId}`);
        const transaction = items.map((item) => 
            prisma.module.update({
                where: { id: item.id },
                data: { order: item.order }
            })
        );
        
        await prisma.$transaction(transaction);
        console.log(`[reorderModules] Transaction successful`);
        revalidatePath(`/dashboard/projects/${projectId}`);
        return { success: true };
    } catch (e) {
        console.error("Failed to reorder modules:", e);
        return { error: "Failed to reorder modules" };
    }
}

export async function moveModule(moduleId: string, direction: 'UP' | 'DOWN', projectId: string) {
    try {
        console.log(`[moveModule] Starting move for ${moduleId} ${direction}`);
        const module = await prisma.module.findUnique({ where: { id: moduleId } });
        if (!module) {
            console.error(`[moveModule] Module not found: ${moduleId}`);
            return { error: "Module not found" };
        }

        // Determine Container
        let whereClause: any = {};
        if (module.sectionId) whereClause.sectionId = module.sectionId;
        else if (module.workId) whereClause.workId = module.workId;
        else if (module.taskId) whereClause.taskId = module.taskId;
        else {
             console.error(`[moveModule] Module has no parent container`);
             return { error: "Module has no parent container" };
        }
        
        console.log(`[moveModule] Where clause:`, whereClause);

        // Fetch Siblings
        const siblings = await prisma.module.findMany({
            where: whereClause,
            orderBy: { order: 'asc' }
        });
        
        console.log(`[moveModule] Found ${siblings.length} siblings`);

        const currentIndex = siblings.findIndex(m => m.id === moduleId);
        if (currentIndex === -1) {
            console.error(`[moveModule] Module not found in siblings list`);
            return { error: "Module not found in siblings" };
        }
        
        console.log(`[moveModule] Current Index: ${currentIndex}, Direction: ${direction}`);

        const newIndex = direction === 'UP' ? currentIndex - 1 : currentIndex + 1;
        
        console.log(`[moveModule] New Index: ${newIndex}`);

        if (newIndex < 0 || newIndex >= siblings.length) {
            console.warn(`[moveModule] Cannot move. Index out of bounds.`);
            return { success: false }; // Can't move
        }

        // Swap by creating a new array 
        const newSiblings = [...siblings];
        [newSiblings[currentIndex], newSiblings[newIndex]] = [newSiblings[newIndex], newSiblings[currentIndex]];
        
        // Update all orders to ensure consistency
        const updates = newSiblings.map((m, idx) => ({ id: m.id, order: idx }));
        
        const transaction = updates.map((item) => 
            prisma.module.update({
                where: { id: item.id },
                data: { order: item.order }
            })
        );
        
        await prisma.$transaction(transaction);
        console.log(`[moveModule] Transaction completed. Revalidating path.`);
        revalidatePath(`/dashboard/projects/${projectId}`);
        return { success: true };

    } catch (e) {
        console.error("Failed to move module:", e);
        return { error: "Failed to move module" };
    }
}
