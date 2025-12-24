"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const AddPartnerSchema = z.object({
  sectionId: z.string(),
  partnerId: z.string(),
  role: z.enum(["LEAD", "CO_LEAD", "BENEFICIARY"]).default("BENEFICIARY"),
  budget: z.number().optional(),
  responsibleUserId: z.string().optional(),
});

export async function addSectionPartner(data: z.infer<typeof AddPartnerSchema>) {
  try {
    const { sectionId, partnerId, role, budget, responsibleUserId } = data;

    // Check if exists
    const existing = await prisma.sectionPartner.findUnique({
      where: {
        sectionId_partnerId: {
          sectionId,
          partnerId,
        },
      },
    });

    if (existing) {
      return { error: "Partner already assigned to this section" };
    }

    await prisma.sectionPartner.create({
      data: {
        sectionId,
        partnerId,
        role,
        budget,
        responsibleUserId,
      },
    });

    // Sync Legacy Field
    if (role === "LEAD") {
        await prisma.section.update({
            where: { id: sectionId },
            data: { leadPartnerId: partnerId }
        });
    }

    revalidatePath("/dashboard/projects"); 
    return { success: true };
  } catch (error) {
    console.error("Failed to add section partner:", error);
    return { error: "Failed to add partner" };
  }
}

export async function removeSectionPartner(sectionId: string, partnerId: string) {
  try {
    const sp = await prisma.sectionPartner.findUnique({
        where: { sectionId_partnerId: { sectionId, partnerId } }
    });

    if (!sp) return { error: "Assignment not found" };

    await prisma.sectionPartner.delete({
      where: {
        sectionId_partnerId: {
          sectionId,
          partnerId,
        },
      },
    });

    // If removing LEAD, clear the legacy field
    if (sp.role === "LEAD") {
        await prisma.section.update({
            where: { id: sectionId },
            data: { leadPartnerId: null }
        });
    }

    revalidatePath("/dashboard/projects");
    return { success: true };
  } catch (error) {
    console.error("Failed to remove section partner:", error);
    return { error: "Failed to remove partner" };
  }
}

export async function updateSectionPartnerRole(sectionId: string, partnerId: string, role: string, responsibleUserId?: string) {
    try {
        await prisma.sectionPartner.update({
            where: { sectionId_partnerId: { sectionId, partnerId } },
            data: { role, responsibleUserId }
        });

        // Sync Legacy Field
        if (role === "LEAD") {
            await prisma.section.update({
                where: { id: sectionId },
                data: { leadPartnerId: partnerId }
            });
        }

        revalidatePath("/dashboard/projects");
        return { success: true };
    } catch (error) {
        return { error: "Failed to update role" };
    }
}

export async function getSectionPartners(sectionId: string) {
    try {
        const partners = await prisma.sectionPartner.findMany({
            where: { sectionId },
            include: { partner: true, responsibleUser: true },
            orderBy: { createdAt: 'asc' }
        });
        return partners;
    } catch (error) {
        return [];
    }
}
