"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProject(formData: FormData) {
  const title = formData.get("title") as string;
  const acronym = formData.get("acronym") as string;
  const startDate = new Date(formData.get("startDate") as string);
  const duration = parseInt(formData.get("duration") as string);
  const nationalAgency = formData.get("nationalAgency") as string;
  const language = formData.get("language") as string;
  
    const templateId = formData.get("templateId") as string;
    
    // Calculate End Date
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + duration);

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Create Project
            const project = await tx.project.create({
                data: {
                    title,
                    titleEn: title,
                    acronym,
                    startDate,
                    duration,
                    endDate,
                    nationalAgency,
                    language,
                    isTemplate: false
                }
            });

            if (templateId) {
                // CLONE FROM TEMPLATE
                const template = await tx.project.findUnique({
                    where: { id: templateId },
                    include: {
                        sections: {
                            orderBy: { order: 'asc' },
                            include: {
                                modules: { orderBy: { order: 'asc' } },
                                works: {
                                    orderBy: { startDate: 'asc' },
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
                                }
                            }
                        },
                        works: {
                            where: { sectionId: null },
                            orderBy: { startDate: 'asc' },
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
                        modules: { 
                             where: { sectionId: null },
                             orderBy: { order: 'asc' } 
                        },
                    }
                });

                if (template) {
                    // Helper to copy modules
                    const copyModules = async (modules: any[], parentId: string, parentType: 'PROJECT' | 'SECTION' | 'WORK' | 'TASK' | 'ACTIVITY') => {
                        for (const m of modules) {
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

                    // 1. Copy Direct Project Modules
                    await copyModules(template.modules, project.id, 'PROJECT');

                    // 2. Copy Sections and their contents
                    for (const section of template.sections) {
                        const newSection = await tx.section.create({
                            data: {
                                projectId: project.id,
                                title: section.title,
                                order: section.order
                            }
                        });
                        
                        await copyModules(section.modules, newSection.id, 'SECTION');

                        // Copy Works within Section
                        for (const work of section.works) {
                            const newWork = await tx.work.create({
                                data: {
                                    projectId: project.id,
                                    sectionId: newSection.id,
                                    title: work.title,
                                    description: work.description,
                                    startDate,
                                    endDate,
                                    budget: 0
                                }
                            });
                            await copyModules(work.modules, newWork.id, 'WORK');
                            
                            for (const task of work.tasks) {
                                const newTask = await tx.task.create({
                                    data: {
                                        workId: newWork.id,
                                        title: task.title,
                                        startDate,
                                        endDate,
                                        budget: 0
                                    }
                                });
                                await copyModules(task.modules, newTask.id, 'TASK');

                                for (const act of task.activities) {
                                    const newAct = await tx.activity.create({
                                        data: {
                                            taskId: newTask.id,
                                            title: act.title,
                                            estimatedStartDate: startDate,
                                            estimatedEndDate: endDate,
                                            allocatedAmount: 0
                                        }
                                    });
                                    await copyModules(act.modules, newAct.id, 'ACTIVITY');
                                }
                            }
                        }
                    }

                    // 3. Copy Unassigned Works
                    for (const work of template.works) {
                            const newWork = await tx.work.create({
                                data: {
                                    projectId: project.id,
                                    title: work.title,
                                    description: work.description,
                                    startDate,
                                    endDate,
                                    budget: 0
                                }
                            });
                            await copyModules(work.modules, newWork.id, 'WORK');
                            
                            for (const task of work.tasks) {
                                const newTask = await tx.task.create({
                                    data: {
                                        workId: newWork.id,
                                        title: task.title,
                                        startDate,
                                        endDate,
                                        budget: 0
                                    }
                                });
                                await copyModules(task.modules, newTask.id, 'TASK');

                                for (const act of task.activities) {
                                    const newAct = await tx.activity.create({
                                        data: {
                                            taskId: newTask.id,
                                            title: act.title,
                                            estimatedStartDate: startDate,
                                            estimatedEndDate: endDate,
                                            allocatedAmount: 0
                                        }
                                    });
                                    await copyModules(act.modules, newAct.id, 'ACTIVITY');
                                }
                            }
                    }

                }
            } else {
                // DEFAULT SEED (No Template)
                await tx.work.create({
                    data: {
                        projectId: project.id,
                        title: "Project Management",
                        startDate,
                        endDate,
                        budget: 0,
                        modules: {
                            create: {
                                title: "Project Handbook",
                                order: 1,
                                officialText: "<h1>Project Handbook</h1><p>Welcome to the project...</p>",
                                status: "TO_DONE"
                            }
                        }
                    }
                });

                await tx.module.create({
                    data: {
                        projectId: project.id,
                        title: "General Project Overview",
                        order: 0,
                        status: "TO_DONE",
                        officialText: "This module is attached directly to the project."
                    }
                });
            }
        });

    } catch (error) {
        console.error("Failed to create project:", error);
        return { error: "Failed to create project" };
    }
  
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
