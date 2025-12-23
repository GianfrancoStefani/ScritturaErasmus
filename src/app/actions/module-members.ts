'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const memberSchema = z.object({
  userId: z.string(),
  role: z.enum(["SUPERVISOR", "LEADER", "EDITOR", "VIEWER"]),
})

export async function updateModuleMembers(moduleId: string, members: z.infer<typeof memberSchema>[]) {
  try {
    // Transaction: Delete all existing members for this module, then create new ones
    await prisma.$transaction(async (tx) => {
      await tx.moduleMember.deleteMany({
        where: { moduleId }
      })

      if (members.length > 0) {
        await tx.moduleMember.createMany({
          data: members.map(m => ({
            moduleId,
            userId: m.userId,
            role: m.role
          }))
        })
      }
    })

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
          include: {
              user: {
                  select: {
                      id: true,
                      name: true,
                      surname: true,
                      email: true,
                      photo: true,
                      partner: {
                          select: {
                              id: true,
                              name: true
                          }
                      }
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
    // 1. Get Project ID from Module (direct or inherited)
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      select: {
         projectId: true,
         task: { select: { work: { select: { projectId: true } } } },
         work: { select: { projectId: true } },
         section: { select: { projectId: true } },
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
            role: true // User's generic role
          }
        }
      }
    })

    return { success: true, data: partners }

  } catch (error) {
    console.error("Failed to fetch assignment candidates:", error)
    return { success: false, error: "Failed to fetch candidates" }
  }
}
