"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function saveProjectAsTemplate(projectId: string, templateName: string, description?: string) {
    try {
        const project = await prisma.project.findUnique({
             where: { id: projectId },
             include: {
                 partners: { orderBy: { createdAt: 'asc' } },
                 sections: {
                     orderBy: { order: 'asc' },
                     include: { modules: { orderBy: { order: 'asc' } } }
                 },
                 works: {
                     orderBy: { order: 'asc' },
                     include: {
                         modules: { orderBy: { order: 'asc' } },
                         tasks: {
                            orderBy: { startDate: 'asc' },
                            include: {
                                modules: { orderBy: { order: 'asc' } },
                                activities: {
                                    orderBy: { estimatedStartDate: 'asc' },
                                    include: {
                                        modules: { orderBy: { order: 'asc' } }
                                    }
                                }
                            }
                         }
                     }
                 },
                 modules: { orderBy: { order: 'asc' } } // direct project modules
             }
        });

        if (!project) return { error: "Project not found" };

        await prisma.$transaction(async (tx: any) => {
            // 1. Create Template Project
            const template = await tx.project.create({
                data: {
                    title: templateName,
                    titleEn: templateName, // Added required
                    nationalAgency: project.nationalAgency, // Added required
                    language: project.language, // Added required
                    duration: project.duration, // Added required
                    acronym: `TEMPLATE-${project.acronym}`,
                    startDate: new Date(), 
                    endDate: new Date(),
                    // description: description was invalid
                    // status: "DRAFT" was invalid
                    isTemplate: true
                }
            });

            // 2. Create Placeholder Partners (Coordinator + Partner 1, 2...)
            const partnersMap = new Map<string, string>(); // Old Partner ID -> New Template Partner ID

            for (let i = 0; i < project.partners.length; i++) {
                const p = project.partners[i];
                const isCoord = i === 0;
                const newPartner = await tx.partner.create({
                    data: {
                        projectId: template.id,
                        name: isCoord ? "Coordinator Organization" : `Partner ${i}`,
                        nation: "IT",
                        city: "City",
                        role: isCoord ? "COORDINATOR" : "PARTNER",
                        type: "NGO",
                        budget: 0
                    }
                });
                partnersMap.set(p.id, newPartner.id);
            }

            // 3. Clone Structure
            const cloneModules = async (oldModules: any[], parentId: string, parentType: 'PROJECT' | 'SECTION' | 'WORK' | 'TASK' | 'ACTIVITY') => {
                for (const m of oldModules) {
                    await tx.module.create({
                        data: {
                            title: m.title,
                            subtitle: m.subtitle,
                            order: m.order,
                            maxChars: m.maxChars,
                            guidelines: m.guidelines,
                            status: "TO_DONE",
                            projectId: parentType === 'PROJECT' ? parentId : undefined,
                            sectionId: parentType === 'SECTION' ? parentId : undefined,
                            workId: parentType === 'WORK' ? parentId : undefined,
                            taskId: parentType === 'TASK' ? parentId : undefined,
                            activityId: parentType === 'ACTIVITY' ? parentId : undefined,
                        }
                    });
                }
            };

            await cloneModules(project.modules, template.id, 'PROJECT');

            // 2.5 Clone Sections
            const sectionsMap = new Map<string, string>();
            for (const section of (project as any).sections || []) {
                const newSection = await tx.section.create({
                    data: {
                        projectId: template.id,
                        title: section.title,
                        order: section.order
                    }
                });
                sectionsMap.set(section.id, newSection.id);
                await cloneModules(section.modules, newSection.id, 'SECTION');
            }

            // 3. Clone Works
            for (const work of project.works) {
                const newWork = await tx.work.create({
                    data: {
                        projectId: template.id,
                        sectionId: work.sectionId ? sectionsMap.get(work.sectionId) : null,
                        title: work.title,
                        description: work.description,
                        startDate: new Date(),
                        endDate: new Date(),
                        budget: 0
                    }
                });

                // Clone Work Partners
                const workPartners = await tx.workPartner.findMany({ where: { workId: work.id } });
                for (const wp of workPartners) {
                    if (partnersMap.has(wp.partnerId)) {
                        await tx.workPartner.create({
                            data: {
                                workId: newWork.id,
                                partnerId: partnersMap.get(wp.partnerId)!,
                                role: wp.role,
                                budget: 0
                                // We DO NOT clone responsibleUsers here as users are specific to the old project
                            }
                        });
                    }
                }

                await cloneModules(work.modules, newWork.id, 'WORK');

                for (const task of work.tasks) {
                    const newTask = await tx.task.create({
                        data: {
                            workId: newWork.id,
                            title: task.title,
                            startDate: new Date(),
                            endDate: new Date(),
                            budget: 0
                        }
                    });

                    // Clone Task Partners
                    const taskPartners = await tx.taskPartner.findMany({ where: { taskId: task.id } });
                    for (const tp of taskPartners) {
                        if (partnersMap.has(tp.partnerId)) {
                            await tx.taskPartner.create({
                                data: {
                                    taskId: newTask.id,
                                    partnerId: partnersMap.get(tp.partnerId)!,
                                    role: tp.role,
                                    budget: 0
                                }
                            });
                        }
                    }

                    await cloneModules(task.modules, newTask.id, 'TASK');

                    for (const activity of task.activities) {
                        const newActivity = await tx.activity.create({
                            data: {
                                taskId: newTask.id,
                                title: activity.title,
                                estimatedStartDate: new Date(), 
                                estimatedEndDate: new Date(),
                                allocatedAmount: 0
                            }
                        });

                        await cloneModules(activity.modules, newActivity.id, 'ACTIVITY');
                    }
                }
            }
        });

        revalidatePath("/dashboard/projects");
        return { success: true };

    } catch (error) {
        console.error("Template creation failed:", error);
        return { error: "Failed to create template" };
    }
}

export async function getTemplatePartners(templateId: string) {
    try {
        const partners = await prisma.partner.findMany({
            where: { projectId: templateId },
            orderBy: { createdAt: 'asc' },
            select: { id: true, name: true, role: true }
        });
        return { success: true, data: partners };
    } catch (error) {
        return { error: "Failed to fetch template partners" };
    }
}

export async function getTemplatePreview(templateId: string) {
    try {
        const template = await prisma.project.findUnique({
            where: { id: templateId },
            include: {
                sections: {
                    orderBy: { order: 'asc' },
                    include: {
                        modules: { orderBy: { order: 'asc' } }
                    }
                },
                works: {
                    orderBy: { order: 'asc' },
                    include: {
                        tasks: {
                            orderBy: { startDate: 'asc' },
                            include: {
                                activities: {
                                    orderBy: { estimatedStartDate: 'asc' },
                                    include: {
                                        modules: { orderBy: { order: 'asc' } }
                                    }
                                },
                                modules: { orderBy: { order: 'asc' } }
                            }
                        },
                        modules: { orderBy: { order: 'asc' } }
                    }
                },
                modules: { orderBy: { order: 'asc' } } // root modules
            }
        });
        return { success: true, data: template };
    } catch (error) {
        return { error: "Failed to fetch template preview" };
    }
}
