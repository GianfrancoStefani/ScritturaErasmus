"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveProjectAsTemplate(projectId: string, templateName: string, description?: string) {
    try {
        const project = await prisma.project.findUnique({
             where: { id: projectId },
             include: {
                 partners: { orderBy: { createdAt: 'asc' } },
                 works: {
                     orderBy: { startDate: 'asc' },
                     include: {
                         modules: { orderBy: { order: 'asc' } },
                         tasks: {
                            orderBy: { startDate: 'asc' },
                            include: {
                                modules: { orderBy: { order: 'asc' } },
                                activities: {
                                    orderBy: { startDate: 'asc' },
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

        // Transaction to create everything
        await prisma.$transaction(async (tx) => {
            // 1. Create Template Project
            const template = await tx.project.create({
                data: {
                    title: templateName,
                    acronym: `TEMPLATE-${project.acronym}`,
                    startDate: new Date(), // Reset dates?
                    endDate: new Date(),
                    description: description || `Template created from ${project.title}`,
                    status: "DRAFT",
                    isTemplate: true
                }
            });

            // 2. Create Placeholder Partners (Coordinator + Partner 1, 2...)
            // We map original partner IDs to new partner IDs for potential future references (if we had them)
            // But for now we just create generic ones.
            const partnersMap = new Map<string, string>(); // OldID -> NewID
            
            // Assume first is Coordinator (or logic based on type?)
            // We'll just iterate
            for (let i = 0; i < project.partners.length; i++) {
                const p = project.partners[i];
                const isCoord = i === 0; // Simplified assumption or check `p.type` if available
                const newPartner = await tx.partner.create({
                    data: {
                        projectId: template.id,
                        organizationName: isCoord ? "Coordinator Organization" : `Partner ${i}`,
                        country: "XX",
                        budget: 0 // Reset budget
                    }
                });
                partnersMap.set(p.id, newPartner.id);
            }

            // 3. Clone Structure (Works -> Tasks -> Activities -> Modules)
            
            // Helper to clone modules for a parent
            const cloneModules = async (oldModules: any[], parentId: string, parentType: 'PROJECT' | 'WORK' | 'TASK' | 'ACTIVITY') => {
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
                            workId: parentType === 'WORK' ? parentId : undefined,
                            taskId: parentType === 'TASK' ? parentId : undefined,
                            activityId: parentType === 'ACTIVITY' ? parentId : undefined,
                            // Note: we are NOT copying components or officialText
                        }
                    });
                }
            };

            // Project direct modules
            await cloneModules(project.modules, template.id, 'PROJECT');

            // Works
            for (const work of project.works) {
                const newWork = await tx.work.create({
                    data: {
                        projectId: template.id,
                        title: work.title,
                        description: work.description,
                        order: 0, // Should be sequential but copied logic usually implies order? Schema doesn't strictly have order on Work yet? 
                        // Checked schema previously: Work has `startDate` but order? `getProject` ordered by startDate. 
                        // We'll keep it simple.
                        startDate: new Date(), 
                        endDate: new Date()
                    }
                });

                await cloneModules(work.modules, newWork.id, 'WORK');

                // Tasks
                for (const task of work.tasks) {
                    const newTask = await tx.task.create({
                        data: {
                            workId: newWork.id,
                            title: task.title,
                            description: task.description,
                            startDate: new Date(),
                            endDate: new Date(),
                            // resource assignments skipped
                        }
                    });

                    await cloneModules(task.modules, newTask.id, 'TASK');

                    // Activities
                    for (const activity of task.activities) {
                        const newActivity = await tx.activity.create({
                            data: {
                                taskId: newTask.id,
                                title: activity.title,
                                description: activity.description,
                                startDate: new Date(),
                                endDate: new Date()
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
