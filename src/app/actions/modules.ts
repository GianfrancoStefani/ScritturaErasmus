"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ModuleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  maxChars: z.coerce.number().optional(), // Coerce form data string to number
  guidelines: z.string().optional(),
  parentId: z.string(), // ID of Project, Work, Task, or Activity
  parentType: z.enum(['PROJECT', 'WORK', 'TASK', 'ACTIVITY']),
});

export async function createModule(prevState: any, formData: FormData) {
    const rawData = {
        title: formData.get("title"),
        subtitle: formData.get("subtitle") || undefined,
        maxChars: formData.get("maxChars") || undefined,
        guidelines: formData.get("guidelines") || undefined,
        parentId: formData.get("parentId"),
        parentType: formData.get("parentType"),
    };

    const validated = ModuleSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    const { title, subtitle, maxChars, guidelines, parentId, parentType } = validated.data;

    try {
        // Construct connect object dynamically
        const connectData: any = {};
        if (parentType === 'PROJECT') connectData.projectId = parentId;
        else if (parentType === 'WORK') connectData.workId = parentId;
        else if (parentType === 'TASK') connectData.taskId = parentId;
        else if (parentType === 'ACTIVITY') connectData.activityId = parentId;

        // Get max order in this context
        const whereClause: any = {};
        if (parentType === 'PROJECT') whereClause.projectId = parentId;
        else if (parentType === 'WORK') whereClause.workId = parentId;
        else if (parentType === 'TASK') whereClause.taskId = parentId;
        else if (parentType === 'ACTIVITY') whereClause.activityId = parentId;

        const lastModule = await prisma.module.findFirst({
            where: whereClause,
            orderBy: { order: 'desc' },
            select: { order: true }
        });

        await prisma.module.create({
            data: {
                title,
                subtitle,
                maxChars: maxChars ? Number(maxChars) : null,
                guidelines,
                order: (lastModule?.order || 0) + 1,
                ...connectData
            }
        });

        // Revalidate. Since we don't know the exact URL of the parent list easily without a lot of logic,
        // we heavily rely on where this form is used. 
        // Assuming it's used in Project Dashboard:
        revalidatePath("/dashboard/projects/[id]", 'page'); 
        // Also revalidate works page if created there
        revalidatePath("/dashboard/works/[id]", 'page');

        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: "Failed to create module" };
    }
}

const UpdateModuleSchema = z.object({
    id: z.string(),
    title: z.string().min(1),
    subtitle: z.string().optional(),
    maxChars: z.coerce.number().optional(),
    guidelines: z.string().optional(),
});

export async function updateModuleMetadata(prevState: any, formData: FormData) {
    const rawData = {
        id: formData.get("id"),
        title: formData.get("title"),
        subtitle: formData.get("subtitle") || undefined,
        maxChars: formData.get("maxChars") || undefined,
        guidelines: formData.get("guidelines") || undefined,
    };

    const validated = UpdateModuleSchema.safeParse(rawData);
    if (!validated.success) return { error: validated.error.flatten().fieldErrors };

    try {
        await prisma.module.update({
            where: { id: validated.data.id },
            data: {
                title: validated.data.title,
                subtitle: validated.data.subtitle,
                maxChars: validated.data.maxChars ? Number(validated.data.maxChars) : null,
                guidelines: validated.data.guidelines
            }
        });
        revalidatePath("/dashboard/projects/[id]", 'page'); 
        return { success: true };
    } catch (e) {
        return { error: "Failed to update module" };
    }
}
