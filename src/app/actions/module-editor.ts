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
        await prisma.module.update({
            where: { id: moduleId },
            data: { officialText: content }
        });
        revalidatePath(`/dashboard/projects/[id]/modules/${moduleId}`, "page");
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
