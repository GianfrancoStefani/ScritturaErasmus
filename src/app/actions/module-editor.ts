"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Schema for contribution
const ContributionSchema = z.object({
  moduleId: z.string(),
  authorId: z.string(),
  type: z.enum(["USER_TEXT", "COORD_NOTE", "USER_NOTE"]),
  content: z.string().min(1, "Content cannot be empty"),
});

export async function createContribution(formData: FormData) {
  const rawData = {
    moduleId: formData.get("moduleId"),
    authorId: formData.get("authorId"),
    type: formData.get("type"),
    content: formData.get("content"),
  };

  const validation = ContributionSchema.safeParse(rawData);

  if (!validation.success) {
    return { error: validation.error.flatten().fieldErrors };
  }

  const data = validation.data;

  try {
    // Get max order
    const lastComp = await prisma.textComponent.findFirst({
        where: { moduleId: data.moduleId },
        orderBy: { order: 'desc' },
        select: { order: true }
    });
    const newOrder = (lastComp?.order || 0) + 1;

    await prisma.textComponent.create({
      data: {
        moduleId: data.moduleId,
        authorId: data.authorId,
        type: data.type,
        content: data.content,
        order: newOrder,
        status: "TO_INTEGRATE" // Default status
      }
    });

    revalidatePath(`/dashboard/projects/[id]/modules/${data.moduleId}`, "page"); // Revalidating specific module page might be tricky with dynamic [id]
    // We'll rely on client router refresh or pass projectId if needed.
    // For now, let's try to capture projectId from module to be precise, or just return success and let client refresh.
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to create contribution" };
  }
}

export async function deleteContribution(id: string) {
    try {
        await prisma.textComponent.delete({ where: { id } });
        return { success: true };
    } catch (error) {
        return { error: "Failed to delete contribution" };
    }
}

export async function updateContributionStatus(id: string, status: string) {
    try {
        await prisma.textComponent.update({
            where: { id },
            data: { status }
        });
        return { success: true };
    } catch (error) {
        return { error: "Failed to update status" };
    }
}

export async function mergeContribution(contributionId: string) {
    try {
        const contribution = await prisma.textComponent.findUnique({
            where: { id: contributionId },
            include: { module: true }
        });

        if (!contribution || !contribution.module) throw new Error("Contribution not found");

        const currentText = contribution.module.officialText || "";
        // Append content nicely (newline)
        const newText = currentText + (currentText ? "\n\n" : "") + contribution.content;

        // Transaction: Update official text AND mark contribution as ACCEPTED
        await prisma.$transaction([
            prisma.module.update({
                where: { id: contribution.moduleId },
                data: { officialText: newText }
            }),
            prisma.textComponent.update({
                where: { id: contributionId },
                data: { status: "ACCEPTED" }
            })
        ]);
        
        return { success: true };
    } catch (error) {
        return { error: "Failed to merge contribution" };
    }
}

export async function updateOfficialText(moduleId: string, content: string) {
    try {
        // Fetch module to get maxSelections and type AND projectId for revalidation
        const module = await prisma.module.findUnique({
            where: { id: moduleId },
            select: { type: true, maxSelections: true, projectId: true, workId: true, sectionId: true, taskId: true }
        });

        let updateData: any = { officialText: content };

        // Logic for Popup Completion
        if (module?.type === 'POPUP') {
            const maxSelections = module.maxSelections || 1;
            // Split content by "; " to get selected items. Filter empty strings.
            const selectedCount = content.split(';').map(s => s.trim()).filter(s => s !== "").length;
            
            // Calculate percentage
            let completion = Math.round((selectedCount / maxSelections) * 100);
            if (completion > 100) completion = 100;

            updateData.completion = completion;

            // Auto-Status to DONE if 100%
            if (completion === 100) {
                updateData.status = "DONE";
            }
        }

        await prisma.module.update({
            where: { id: moduleId },
            data: updateData
        });

        // Determine Project ID for Revalidation
        // Since modules can be nested deeply (Task -> Work -> Project), we might need to fetch up the chain
        // OR, simply revalidate the dashboard paths.
        // Easiest is to rely on "page" revalidation if we knew the URL. 
        // But we can try to get the project ID.
        // For now, let's just revalidate the dashboard structure broadly or use the projectId if attached directly.
        // Note: The caller usually knows the context.
        
        // Strategy: Revalidate the specific project page if we can find the Project ID.
        // If module is direct child of Project:
        let projectId = module?.projectId;
        
        // If not, we might need to query parents. This is expensive. 
        // Alternative: Revalidate "/dashboard/projects" and hope the specific page cache is cleared?
        // No, dynamic pages need specific path or 'layout'.
        
        // BETTER: Revalidate the layout.
        // revalidatePath("/dashboard/projects/[id]", "layout") SHOULD work for all ids if [id] is the param name?
        // Actually, revalidatePath("/", "layout") clears everything.
        // Correct usage for dynamic route: revalidatePath(`/dashboard/projects/${projectId}`)
        
        // If we don't have projectId, maybe we accept it as an arg? No, signature fixed.
        // Fetch it.
        if (!projectId) {
             if (module?.workId) {
                 const work = await prisma.work.findUnique({ where: { id: module.workId }, select: { projectId: true } });
                 projectId = work?.projectId;
             } else if (module?.sectionId) {
                 const section = await prisma.section.findUnique({ where: { id: module.sectionId }, select: { projectId: true } });
                 projectId = section?.projectId;
             } else if (module?.taskId) {
                  const task = await prisma.task.findUnique({ where: { id: module.taskId }, select: { work: { select: { projectId: true } } } });
                  projectId = task?.work.projectId;
             }
        }
        
        if (projectId) {
             revalidatePath(`/dashboard/projects/${projectId}`);
        } else {
             // Fallback
             revalidatePath("/dashboard");
        }
        
        return { success: true };
    } catch (error) {
         return { error: "Failed to save official text" };
    }
}

export async function addComment(textComponentId: string, userId: string, content: string) {
    try {
        await prisma.comment.create({
            data: {
                textComponentId,
                userId,
                content
            }
        });
        // We'll rely on client refresh or precise revalidation
        return { success: true };
    } catch (error) {
        return { error: "Failed to add comment" };
    }
}

export async function rateComponent(textComponentId: string, userId: string, value: number) {
    try {
        await prisma.rating.upsert({
            where: {
                textComponentId_userId: {
                    textComponentId,
                    userId
                }
            },
            update: { value },
            create: {
                textComponentId,
                userId,
                value
            }
        });
        return { success: true };
    } catch (error) {
        return { error: "Failed to rate" };
    }
}

export async function reorderContributions(items: { id: string, order: number }[]) {
    try {
        await prisma.$transaction(
            items.map(item => 
                prisma.textComponent.update({
                    where: { id: item.id },
                    data: { order: item.order }
                })
            )
        );
        return { success: true };
    } catch (error) {
        return { error: "Failed to reorder" };
    }
}

import { createNotification } from "@/app/actions/notifications";

export async function updateModuleStatus(moduleId: string, status: string) {
    try {
        const module = await prisma.module.update({
            where: { id: moduleId },
            data: { status },
            select: { id: true, title: true, projectId: true }
        });
        
        revalidatePath("/dashboard/projects/[id]"); 
        
        // Notify Leaders and Editors about status change
        // Fetch members
        const members = await prisma.moduleMember.findMany({
            where: { moduleId, role: { in: ['LEADER', 'EDITOR', 'SUPERVISOR'] } },
            select: { userId: true }
        });
        
        await Promise.all(members.map(m => 
            createNotification(
                m.userId,
                "Status Updated",
                `Module "${module.title}" status changed to ${status}`,
                `/dashboard/projects/${module.projectId}/modules/${moduleId}`,
                status === 'DONE' ? 'SUCCESS' : 'INFO'
            )
        ));

        return { success: true };
    } catch (error) {
        return { error: "Failed to update status" };
    }
}
