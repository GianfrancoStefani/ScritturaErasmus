"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const AddPartnerSchema = z.object({
  workId: z.string(),
  partnerId: z.string(),
  role: z.enum(["LEAD", "CO_LEAD", "BENEFICIARY"]).default("BENEFICIARY"),
  budget: z.number().optional(),
  responsibleUserId: z.string().optional(),
});

export async function addWorkPartner(data: z.infer<typeof AddPartnerSchema>) {
  try {
    const { workId, partnerId, role, budget, responsibleUserId } = data;

    // Check if exists
    const existing = await prisma.workPartner.findUnique({
      where: {
        workId_partnerId: {
          workId,
          partnerId,
        },
      },
    });

    if (existing) {
      return { error: "Partner already assigned to this work package" };
    }

    await prisma.workPartner.create({
      data: {
        workId,
        partnerId,
        role,
        budget,
        responsibleUserId,
      },
    });

    // Sync Legacy Field
    if (role === "LEAD") {
        await prisma.work.update({
            where: { id: workId },
            data: { leadPartnerId: partnerId }
        });
    }

    revalidatePath("/dashboard/projects"); 
    return { success: true };
  } catch (error) {
    console.error("Failed to add work partner:", error);
    return { error: "Failed to add partner" };
  }
}

export async function removeWorkPartner(workId: string, partnerId: string) {
  try {
    const wp = await prisma.workPartner.findUnique({
        where: { workId_partnerId: { workId, partnerId } }
    });

    if (!wp) return { error: "Assignment not found" };

    await prisma.workPartner.delete({
      where: {
        workId_partnerId: {
          workId,
          partnerId,
        },
      },
    });

    // If removing LEAD, clear the legacy field
    if (wp.role === "LEAD") {
        await prisma.work.update({
            where: { id: workId },
            data: { leadPartnerId: null }
        });
    }

    revalidatePath("/dashboard/projects");
    return { success: true };
  } catch (error) {
    console.error("Failed to remove work partner:", error);
    return { error: "Failed to remove partner" };
  }
}

export async function updateWorkPartnerRole(workId: string, partnerId: string, role: string, responsibleUserId?: string) {
    try {
        await prisma.workPartner.update({
            where: { workId_partnerId: { workId, partnerId } },
            data: { role, responsibleUserId }
        });

        // Sync Legacy Field
        if (role === "LEAD") {
            await prisma.work.update({
                where: { id: workId },
                data: { leadPartnerId: partnerId }
            });
        }

        revalidatePath("/dashboard/projects");
        return { success: true };
    } catch (error) {
        return { error: "Failed to update role" };
    }
}

export async function getWorkPartners(workId: string) {
    try {
        const partners = await prisma.workPartner.findMany({
            where: { workId },
            include: { partner: true, responsibleUser: true },
            orderBy: { createdAt: 'asc' }
        });
        return partners;
    } catch (error) {
        return [];
    }
}
