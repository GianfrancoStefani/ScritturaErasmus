"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const AddPartnerSchema = z.object({
  taskId: z.string(),
  partnerId: z.string(),
  role: z.enum(["LEAD", "CO_LEAD", "BENEFICIARY"]).default("BENEFICIARY"),
  budget: z.number().optional(),
  responsibleUserIds: z.array(z.string()).optional(),
});

export async function addTaskPartner(data: z.infer<typeof AddPartnerSchema>) {
  try {
    const { taskId, partnerId, role, budget, responsibleUserIds } = data;

    // Check if exists
    const existing = await prisma.taskPartner.findUnique({
      where: {
        taskId_partnerId: {
          taskId,
          partnerId,
        },
      },
    });

    if (existing) {
      return { error: "Partner already assigned to this task" };
    }

    await prisma.taskPartner.create({
      data: {
        taskId,
        partnerId,
        role,
        budget,
        responsibleUsers: responsibleUserIds ? {
             connect: responsibleUserIds.map(id => ({ id }))
        } : undefined,
      },
    });

    // If role is LEAD, update the legacy field for compatibility
    if (role === "LEAD") {
        await prisma.task.update({
            where: { id: taskId },
            data: { leadPartnerId: partnerId }
        });
    }

    revalidatePath("/dashboard/projects"); 
    return { success: true };
  } catch (error) {
    console.error("Failed to add task partner:", error);
    return { error: "Failed to add partner" };
  }
}

export async function removeTaskPartner(taskId: string, partnerId: string) {
  try {
    const tp = await prisma.taskPartner.findUnique({
        where: { taskId_partnerId: { taskId, partnerId } }
    });

    if (!tp) return { error: "Assignment not found" };

    await prisma.taskPartner.delete({
      where: {
        taskId_partnerId: {
          taskId,
          partnerId,
        },
      },
    });

    // If removing LEAD, clear the legacy field
    if (tp.role === "LEAD") {
        await prisma.task.update({
            where: { id: taskId },
            data: { leadPartnerId: null }
        });
    }

    revalidatePath("/dashboard/projects");
    return { success: true };
  } catch (error) {
    console.error("Failed to remove task partner:", error);
    return { error: "Failed to remove partner" };
  }
}

export async function updateTaskPartnerRole(taskId: string, partnerId: string, role: string, responsibleUserIds?: string[]) {
    try {
        await prisma.taskPartner.update({
            where: { taskId_partnerId: { taskId, partnerId } },
            data: { 
                role,
                responsibleUsers: responsibleUserIds ? {
                    set: responsibleUserIds.map(id => ({ id }))
                } : undefined
            }
        });

        // Sync Legacy Field
        if (role === "LEAD") {
            await prisma.task.update({
                where: { id: taskId },
                data: { leadPartnerId: partnerId }
            });
        }

        revalidatePath("/dashboard/projects");
        return { success: true };
    } catch (error) {
        return { error: "Failed to update role" };
    }
}

export async function getTaskPartners(taskId: string) {
    try {
        const partners = await prisma.taskPartner.findMany({
            where: { taskId },
            include: { partner: true, responsibleUsers: true },
            orderBy: { createdAt: 'asc' }
        });
        return partners;
    } catch (error) {
        return [];
    }
}
