"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const WorkSchema = z.object({
  title: z.string().min(1, "Title is required"),
  budget: z.coerce.number().min(0, "Budget must be positive"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export async function createWork(projectId: string, formData: FormData) {
  const validatedFields = WorkSchema.safeParse({
    title: formData.get("title"),
    budget: formData.get("budget"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });

  if (!validatedFields.success) {
    return { error: "Invalid fields" };
  }

  const { title, budget, startDate, endDate } = validatedFields.data;

  try {
    await prisma.work.create({
      data: {
        projectId,
        title,
        budget,
        startDate,
        endDate,
        modules: {
          create: {
            title: "Work Package Description",
            officialText: "<h2>Description</h2><p>Describe the objectives and deliverables of this work package.</p>",
            status: "TO_DONE",
            order: 0
          }
        }
      },
    });

    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath("/dashboard/works");
    return { success: true };
  } catch (error) {
    console.error("Failed to create work:", error);
    return { error: "Failed to create work package" };
  }
}

export async function deleteWork(workId: string, projectId: string) {
  try {
    await prisma.work.delete({
      where: { id: workId },
    });

    revalidatePath(`/dashboard/projects/${projectId}`);
     revalidatePath("/dashboard/works");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete work:", error);
    return { error: "Failed to delete work package" };
  }
}

export async function updateWork(workId: string, projectId: string, formData: FormData) {
  const validatedFields = WorkSchema.safeParse({
    title: formData.get("title"),
    budget: formData.get("budget"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });

  if (!validatedFields.success) {
    return { error: "Invalid fields" };
  }

  const { title, budget, startDate, endDate } = validatedFields.data;

  try {
    await prisma.work.update({
      where: { id: workId },
      data: {
        title,
        budget,
        startDate,
        endDate,
      },
    });

    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath(`/dashboard/works/${workId}`); // Revalidate self
    revalidatePath("/dashboard/works");
    return { success: true };
  } catch (error) {
    console.error("Failed to update work:", error);
    return { error: "Failed to update work package" };
  }
}

export async function cloneWork(workId: string, projectId: string) {
  try {
    const originalWork = await prisma.work.findUnique({
      where: { id: workId },
      include: {
        modules: true,
        tasks: {
          include: {
            modules: true,
            activities: {
              include: {
                modules: true,
              },
            },
          },
        },
      },
    });

    if (!originalWork) {
      return { error: "Work package not found" };
    }

    await prisma.$transaction(async (tx) => {
        // 1. Create Work Copy
        const newWork = await tx.work.create({
          data: {
            projectId: projectId,
            sectionId: originalWork.sectionId,
            title: `${originalWork.title} (Copy)`,
            budget: originalWork.budget,
            startDate: originalWork.startDate,
            endDate: originalWork.endDate,
            description: originalWork.description,
            modules: {
              create: originalWork.modules.map((m) => ({
                title: m.title,
                subtitle: m.subtitle,
                officialText: m.officialText,
                status: "TO_DONE",
                order: m.order,
                type: m.type,
                options: m.options,
                maxChars: m.maxChars,
                maxSelections: m.maxSelections,
                guidelines: m.guidelines
              })),
            },
          },
        });

        // 2. Clone Work Partners
        const workPartners = await tx.workPartner.findMany({
            where: { workId: originalWork.id },
            include: { responsibleUsers: true }
        });

        for (const wp of workPartners) {
            await tx.workPartner.create({
                data: {
                    workId: newWork.id,
                    partnerId: wp.partnerId,
                    role: wp.role,
                    budget: wp.budget,
                    responsibleUsers: {
                        connect: wp.responsibleUsers.map(u => ({ id: u.id }))
                    }
                }
            });
        }

        // 3. Clone Tasks and their Partners
        for (const t of originalWork.tasks) {
            const newTask = await tx.task.create({
                data: {
                    workId: newWork.id,
                    title: t.title,
                    budget: t.budget,
                    startDate: t.startDate,
                    endDate: t.endDate,
                    modules: {
                        create: t.modules.map((tm) => ({
                            title: tm.title,
                            subtitle: tm.subtitle,
                            officialText: tm.officialText,
                            status: "TO_DONE",
                            order: tm.order,
                            type: tm.type,
                            options: tm.options,
                            maxChars: tm.maxChars,
                            maxSelections: tm.maxSelections,
                            guidelines: tm.guidelines
                        })),
                    },
                    activities: {
                        create: t.activities.map((a) => ({
                            title: a.title,
                            venue: a.venue,
                            estimatedStartDate: a.estimatedStartDate,
                            estimatedEndDate: a.estimatedEndDate,
                            allocatedAmount: a.allocatedAmount,
                            expectedResults: a.expectedResults,
                            modules: {
                                create: a.modules.map((am) => ({
                                    title: am.title,
                                    subtitle: am.subtitle,
                                    officialText: am.officialText,
                                    status: "TO_DONE",
                                    order: am.order,
                                    type: am.type,
                                    options: am.options,
                                    maxChars: am.maxChars,
                                    maxSelections: am.maxSelections,
                                    guidelines: am.guidelines
                                })),
                            }
                        })),
                    },
                }
            });

            // Clone Task Partners
            const taskPartners = await tx.taskPartner.findMany({
                where: { taskId: t.id },
                include: { responsibleUsers: true }
            });

            for (const tp of taskPartners) {
                await tx.taskPartner.create({
                    data: {
                        taskId: newTask.id,
                        partnerId: tp.partnerId,
                        role: tp.role,
                        budget: tp.budget,
                        responsibleUsers: {
                            connect: tp.responsibleUsers.map(u => ({ id: u.id }))
                        }
                    }
                });
            }
        }
    });

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to clone work:", error);
    return { error: "Failed to clone work package" };
  }
}
