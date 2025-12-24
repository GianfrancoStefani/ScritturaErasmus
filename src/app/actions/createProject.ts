"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

import { auth } from "@/auth";


export async function createProjectAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const title = formData.get("title") as string;
  const acronym = formData.get("acronym") as string;
  const startDate = new Date(formData.get("startDate") as string);
  const duration = parseInt(formData.get("duration") as string);
  const nationalAgency = formData.get("nationalAgency") as string;
  const language = formData.get("language") as string;
  
    const templateId = formData.get("templateId") as string;
    
    let coordinatorPartnerId: string | null = null;
    const partnerMappingRaw = formData.get("partnerMapping") as string;
    const partnerMapping = partnerMappingRaw ? JSON.parse(partnerMappingRaw) : {};
    
    const extraPartnersRaw = formData.get("extraPartners") as string;
    const extraPartners = extraPartnersRaw ? JSON.parse(extraPartnersRaw) : [];

    // Calculate End Date
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + duration);

    try {
        await prisma.$transaction(async (tx: any) => {
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
                        partners: { orderBy: { createdAt: 'asc' } }, // Needed for mapping
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
                    // MAP PARTNERS
                    // ... (inside template block)
                    const newPartnersMap = new Map<string, string>(); 

                    for (const tp of template.partners) {
                        const mappedOrgId = partnerMapping[tp.id];
                        let newPartnerId;

                        if (mappedOrgId) {
                            // Create REAL Partner from Org
                            const org = await tx.organization.findUnique({ where: { id: mappedOrgId } });
                            if (org) {
                                const newP = await tx.partner.create({
                                    data: {
                                        projectId: project.id,
                                        organizationId: org.id,
                                        name: org.name,
                                        nation: org.nation || "IT",
                                        city: org.city || "City",
                                        type: org.type || "NGO",
                                        role: tp.role, // Inherit role (Coordinator vs Partner)
                                        budget: 0,
                                        email: org.email,
                                        website: org.website,
                                        logo: org.logoUrl
                                    }
                                });
                                newPartnerId = newP.id;
                            } else {
                                // Fallback if org not found
                                const newP = await tx.partner.create({
                                    data: {
                                        projectId: project.id,
                                        name: tp.name,
                                        nation: tp.nation,
                                        city: tp.city,
                                        type: tp.type,
                                        role: tp.role,
                                        budget: 0
                                    }
                                });
                                newPartnerId = newP.id;
                            }
                        } else {
                             // No mapping provided: Create Placeholder Partner (Clone exact template partner)
                             const newP = await tx.partner.create({
                                data: {
                                    projectId: project.id,
                                    name: tp.name,
                                    nation: tp.nation,
                                    city: tp.city,
                                    type: tp.type,
                                    role: tp.role,
                                    budget: 0
                                }
                            });
                            newPartnerId = newP.id;
                        }
                        newPartnersMap.set(tp.id, newPartnerId);

                        // Capture Coordinator Partner ID
                        // Priority 1: Explicit COORDINATOR role
                        if (tp.role === 'COORDINATOR') {
                            coordinatorPartnerId = newPartnerId;
                        } 
                        // Priority 2: Use the first partner as fallback if none set yet
                        else if (!coordinatorPartnerId) {
                            coordinatorPartnerId = newPartnerId;
                        }
                    }
                    console.log("[CreateProject] CoordinatorPartnerId:", coordinatorPartnerId);
                    console.log("[CreateProject] Session User ID:", session?.user?.id);



                    // CREATE EXTRA PARTNERS
                    if (extraPartners && extraPartners.length > 0) {
                        for (const orgId of extraPartners) {
                            const org = await tx.organization.findUnique({ where: { id: orgId } });
                            if (org) {
                                await tx.partner.create({
                                    data: {
                                        projectId: project.id,
                                        organizationId: org.id,
                                        name: org.name,
                                        nation: org.nation || "IT",
                                        city: org.city || "City",
                                        type: org.type || "Other",
                                        role: "PARTNER", // Default role for extras
                                        budget: 0,
                                        email: org.email,
                                        website: org.website,
                                        logo: org.logoUrl
                                    }
                                });
                            }
                        }
                    }

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
                            
                           // Clone Work Partners
                           const workPartners = await tx.workPartner.findMany({ where: { workId: work.id } });
                           for (const wp of workPartners) {
                               if (newPartnersMap.has(wp.partnerId)) {
                                   await tx.workPartner.create({
                                       data: {
                                           workId: newWork.id,
                                           partnerId: newPartnersMap.get(wp.partnerId)!,
                                           role: wp.role,
                                           budget: 0
                                       }
                                   });
                               }
                           }

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

                                // Clone Task Partners
                                const taskPartners = await tx.taskPartner.findMany({ where: { taskId: task.id } });
                                for (const tp of taskPartners) {
                                    if (newPartnersMap.has(tp.partnerId)) {
                                        await tx.taskPartner.create({
                                            data: {
                                                taskId: newTask.id,
                                                partnerId: newPartnersMap.get(tp.partnerId)!,
                                                role: tp.role,
                                                budget: 0
                                            }
                                        });
                                    }
                                }

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
                            
                             // Clone Work Partners
                           const workPartners = await tx.workPartner.findMany({ where: { workId: work.id } });
                           for (const wp of workPartners) {
                               if (newPartnersMap.has(wp.partnerId)) {
                                   await tx.workPartner.create({
                                       data: {
                                           workId: newWork.id,
                                           partnerId: newPartnersMap.get(wp.partnerId)!,
                                           role: wp.role,
                                           budget: 0
                                       }
                                   });
                               }
                           }

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

                                 // Clone Task Partners
                                const taskPartners = await tx.taskPartner.findMany({ where: { taskId: task.id } });
                                for (const tp of taskPartners) {
                                    if (newPartnersMap.has(tp.partnerId)) {
                                        await tx.taskPartner.create({
                                            data: {
                                                taskId: newTask.id,
                                                partnerId: newPartnersMap.get(tp.partnerId)!,
                                                role: tp.role,
                                                budget: 0
                                            }
                                        });
                                    }
                                }

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

            // --- CATCH-ALL: Ensure Creator is a Project Member ---
            if (session?.user?.id) {
                // Check if already a member
                const membership = await tx.projectMember.findFirst({
                    where: { projectId: project.id, userId: session.user.id }
                });

                if (!membership) {
                    console.log("[CreateProject] No membership found. Catch-all creating one.");
                    // Find a suitable partner (Coordinator or first one)
                    let memberPartnerId = coordinatorPartnerId;
                    
                    if (!memberPartnerId) {
                         const firstPartner = await tx.partner.findFirst({
                            where: { projectId: project.id }
                         });
                         if (firstPartner) {
                             memberPartnerId = firstPartner.id;
                         } else {
                             // CRITICAL FIX: If NO partners exist (e.g. no template), create a placeholder "Applicant" partner
                             // Check if user has a personal organization/affiliation to use? 
                             // For now, create a generic one to satisfy the schema constraints.
                             console.log("[CreateProject] No partners found. Creating default Applicant partner.");
                             const defaultPartner = await tx.partner.create({
                                 data: {
                                     projectId: project.id,
                                     name: "Applicant Organisation",
                                     nation: nationalAgency.substring(0, 2) || "IT", // Guess from NA
                                     city: "Headquarters",
                                     type: "NGO",
                                     role: "COORDINATOR",
                                     budget: 0
                                 }
                             });
                             memberPartnerId = defaultPartner.id;
                         }
                    }

                    if (memberPartnerId) {
                         // Check affiliation
                         const partner = await tx.partner.findUnique({ where: { id: memberPartnerId } });
                         let affiliationId = null;
                        
                         if (partner?.organizationId) {
                            const affiliation = await tx.userAffiliation.findFirst({
                                where: { 
                                    userId: session.user.id,
                                    organizationId: partner.organizationId
                                }
                            });
                            affiliationId = affiliation?.id;
                         }

                         await tx.projectMember.create({
                            data: {
                                projectId: project.id,
                                userId: session.user.id,
                                partnerId: memberPartnerId,
                                role: "COORDINATOR",
                                projectRole: "Project Coordinator",
                                userAffiliationId: affiliationId
                            }
                        });
                        console.log("[CreateProject] Membership forcefully created via Catch-All.");
                    } else {
                        console.error("[CreateProject] CRITICAL: Could not create membership. No partners found for project.");
                    }
                }
            }
        });

    } catch (error) {
        console.error("Failed to create project - ERROR DETAILS:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
        return { error: `Failed to create project: ${error}` };
    }
  
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
