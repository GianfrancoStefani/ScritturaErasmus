'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const assignLeadSchema = z.object({
    containerId: z.string(),
    containerType: z.enum(["WORK", "TASK", "SECTION"]),
    partnerId: z.string().nullable() // Null to remove assignment
})

export async function assignLeadPartner(data: z.infer<typeof assignLeadSchema>) {
    try {
        const { containerId, containerType, partnerId } = data
        
        let projectId: string | undefined;

        if (containerType === "WORK") {
            const res = await prisma.work.update({
                where: { id: containerId },
                data: { leadPartnerId: partnerId },
                select: { projectId: true }
            })
            projectId = res.projectId
        } else if (containerType === "TASK") {
            const res = await prisma.task.update({
                where: { id: containerId },
                data: { leadPartnerId: partnerId },
                select: { work: { select: { projectId: true } } }
            })
            projectId = res.work.projectId
        } else if (containerType === "SECTION") {
             const res = await prisma.section.update({
                where: { id: containerId },
                data: { leadPartnerId: partnerId },
                select: { projectId: true }
            })
            projectId = res.projectId
        }

        if (projectId) {
            revalidatePath(`/dashboard/projects/${projectId}`)
        }
        
        return { success: true }
    } catch (error) {
        console.error("Failed to assign lead partner:", error)
        return { success: false, error: "Failed to update lead partner" }
    }
}
