'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const memberSchema = z.object({
  userId: z.string(),
  role: z.enum(["SUPERVISOR", "LEADER", "EDITOR", "VIEWER"]),
  isWriter: z.boolean().default(true),
  isGrantPerson: z.boolean().default(false),
  grantTitle: z.string().optional(),
})

import { createNotification } from "@/app/actions/notifications"

export async function updateModuleMembers(moduleId: string, members: z.infer<typeof memberSchema>[]) {
  try {
    const module = await prisma.module.findUnique({
        where: { id: moduleId },
        select: { title: true, projectId: true }
    });

    // Transaction: Delete all existing members for this module, then create new ones
    await prisma.$transaction(async (tx: any) => {
      await tx.moduleMember.deleteMany({
        where: { moduleId }
      })

      if (members.length > 0) {
        await tx.moduleMember.createMany({
          data: members.map(m => ({
            moduleId,
            userId: m.userId,
            role: m.role,
            isWriter: m.isWriter,
            isGrantPerson: m.isGrantPerson,
            grantTitle: m.grantTitle
          }))
        })
      }
    })

    // Send Notifications (Fire and forget, or await)
    // We notify new members they have been assigned.
    if (members.length > 0 && module) {
        await Promise.all(members.map(m => 
            createNotification(
                m.userId,
                "New Assignment",
                `You have been assigned as ${m.role} to module: ${module.title}`,
                `/dashboard/projects/${module.projectId}/modules/${moduleId}`,
                "INFO"
            )
        ));
    }

    revalidatePath(`/dashboard/modules/${moduleId}`)
    return { success: true }
  } catch (error) {
    console.error("Failed to update module members:", error)
    return { success: false, error: "Failed to update members" }
  }
}

export async function getModuleMembers(moduleId: string) {
  try {
      const members = await prisma.moduleMember.findMany({
          where: { moduleId },
          // Include new fields
          select: {
              userId: true,
              role: true,
              isWriter: true,
              isGrantPerson: true,
              grantTitle: true,
              user: {
                  select: {
                      id: true,
                      name: true,
                      surname: true,
                      email: true,
                      photo: true,
                      partner: { select: { id: true, name: true } }
                  }
              }
          }
      })
      return { success: true, data: members }
  } catch (error) {
      console.error("Failed to get module members:", error)
      return { success: false, error: "Failed to fetch members" }
  }
}

export async function getAssignmentCandidates(moduleId: string) {
  try {
    // 1. Get Project ID and potential Lead Partners from Module's lineage
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      select: {
         projectId: true,
         task: { 
             select: { 
                 leadPartnerId: true,
                 work: { select: { leadPartnerId: true, projectId: true } } 
             } 
         },
         work: { select: { leadPartnerId: true, projectId: true } },
         section: { select: { leadPartnerId: true, projectId: true } },
         project: { select: { id: true } } // redundancy check
      }
    })

    if (!module) return { success: false, error: "Module not found" }

    // Resolve projectId
    const projectId = module.projectId || 
                      module.task?.work?.projectId || 
                      module.work?.projectId || 
                      module.section?.projectId

    if (!projectId) return { success: false, error: "Project context not found" }

    // Resolve Lead Partner (closest wins: Task -> Work -> Section)
    // Note: Module can belong to Task OR Work OR Section. Only one path is valid.
    let leadPartnerId: string | null = null;

    if (module.task) {
        leadPartnerId = module.task.leadPartnerId || module.task.work?.leadPartnerId || null
    } else if (module.work) {
        leadPartnerId = module.work.leadPartnerId
    } else if (module.section) {
        leadPartnerId = module.section.leadPartnerId
    }

    // 2. Fetch Partners and Users
    const partners = await prisma.partner.findMany({
      where: { projectId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            photo: true,
            role: true
          }
        }
      }
    })

    return { success: true, data: partners, leadPartnerId }

  } catch (error) {
    console.error("Failed to fetch assignment candidates:", error)
    return { success: false, error: "Failed to fetch candidates" }
  }
}
