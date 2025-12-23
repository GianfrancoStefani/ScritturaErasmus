"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ModuleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  maxChars: z.coerce.number().optional(), 
  guidelines: z.string().optional(),
  parentId: z.string(), 
  parentType: z.enum(['PROJECT', 'WORK', 'TASK', 'ACTIVITY', 'SECTION']),
  type: z.enum(['TEXT', 'POPUP']).default('TEXT'),
  options: z.string().optional(), 
  maxSelections: z.coerce.number().optional().default(1),
  completion: z.coerce.number().min(0).max(100).optional().default(0),
  commentEndingDate: z.string().optional(),
});

export type ModuleActionState = {
  success?: boolean;
  error?: string | null;
  fieldErrors?: Record<string, string[]> | null;
}; 

export async function createModule(prevState: any, formData: FormData): Promise<ModuleActionState> {
    const rawData = {
        title: formData.get("title"),
        subtitle: formData.get("subtitle") || undefined,
        maxChars: formData.get("maxChars") || undefined,
        guidelines: formData.get("guidelines") || undefined,
        parentId: formData.get("parentId"),
        parentType: formData.get("parentType"),
        type: formData.get("type") || 'TEXT',
        options: formData.get("options") || undefined,
        maxSelections: formData.get("maxSelections") || undefined,
        completion: formData.get("completion") || undefined,
        commentEndingDate: formData.get("commentEndingDate") || undefined,
    };

    const validated = ModuleSchema.safeParse(rawData);

    if (!validated.success) {
        return { fieldErrors: validated.error.flatten().fieldErrors };
    }

    const { title, subtitle, maxChars, guidelines, parentId, parentType } = validated.data;

    try {
        const connectData: any = {};
        if (parentType === 'PROJECT') connectData.projectId = parentId;
        else if (parentType === 'WORK') connectData.workId = parentId;
        else if (parentType === 'TASK') connectData.taskId = parentId;
        else if (parentType === 'ACTIVITY') connectData.activityId = parentId;
        else if (parentType === 'SECTION') connectData.sectionId = parentId;

        const whereClause: any = {};
        if (parentType === 'PROJECT') whereClause.projectId = parentId;
        else if (parentType === 'WORK') whereClause.workId = parentId;
        else if (parentType === 'TASK') whereClause.taskId = parentId;
        else if (parentType === 'ACTIVITY') whereClause.activityId = parentId;
        else if (parentType === 'SECTION') whereClause.sectionId = parentId;

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
                type: validated.data.type,
                options: validated.data.options,
                maxSelections: validated.data.maxSelections,
                completion: validated.data.completion,
                commentEndingDate: validated.data.commentEndingDate ? new Date(validated.data.commentEndingDate) : null,
                order: (lastModule?.order || 0) + 1,
                ...connectData
            }
        });
        
        revalidatePath("/dashboard/projects/[id]", 'page');
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
    maxSelections: z.coerce.number().optional(),
    completion: z.coerce.number().min(0).max(100).optional(),
    commentEndingDate: z.string().optional(),
});

export async function updateModuleMetadata(prevState: any, formData: FormData): Promise<ModuleActionState> {
    const rawData = {
        id: formData.get("id"),
        title: formData.get("title"),
        subtitle: formData.get("subtitle") || undefined,
        maxChars: formData.get("maxChars") || undefined,
        guidelines: formData.get("guidelines") || undefined,
        maxSelections: formData.get("maxSelections") || undefined,
        completion: formData.get("completion") || undefined,
        commentEndingDate: formData.get("commentEndingDate") || undefined,
    };

    const validated = UpdateModuleSchema.safeParse(rawData);
    if (!validated.success) return { fieldErrors: validated.error.flatten().fieldErrors };

    try {
        await prisma.module.update({
            where: { id: validated.data.id },
            data: {
                title: validated.data.title,
                subtitle: validated.data.subtitle,
                maxChars: validated.data.maxChars ? Number(validated.data.maxChars) : null,
                guidelines: validated.data.guidelines,
                maxSelections: validated.data.maxSelections ? Number(validated.data.maxSelections) : undefined,
                completion: validated.data.completion !== undefined ? Number(validated.data.completion) : undefined,
                commentEndingDate: validated.data.commentEndingDate ? new Date(validated.data.commentEndingDate) : null,
            }
        });
        revalidatePath("/dashboard/projects/[id]", 'page'); 
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: "Failed to update module" };
    }
}
