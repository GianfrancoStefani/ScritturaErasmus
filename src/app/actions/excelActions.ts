"use server";

import prisma from "@/lib/prisma";
import ExcelJS from "exceljs";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

import { PDFConfig } from "@/lib/pdf-generator";

/**
 * Exports the entire project structure to a multi-sheet Excel file.
 */
export async function exportProjectToExcel(projectId: string, config: PDFConfig) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                partners: true,
                members: {
                    include: {
                        user: true,
                        partner: true
                    }
                },
                sections: {
                    orderBy: { order: 'asc' },
                    include: {
                        modules: { 
                            orderBy: { order: 'asc' },
                            include: { 
                                members: { include: { user: true } }
                            }
                        },
                        works: {
                            orderBy: { startDate: 'asc' },
                            include: {
                                modules: { 
                                    orderBy: { order: 'asc' },
                                    include: { members: { include: { user: true } } }
                                },
                                partners: true,
                                assignments: { include: { user: true } },
                                tasks: {
                                    orderBy: { startDate: 'asc' },
                                    include: {
                                        modules: { 
                                            orderBy: { order: 'asc' },
                                            include: { members: { include: { user: true } } }
                                        },
                                        partners: true,
                                        assignments: { include: { user: true } },
                                        activities: {
                                            orderBy: { estimatedStartDate: 'asc' },
                                            include: { 
                                                modules: { 
                                                    orderBy: { order: 'asc' },
                                                    include: { members: { include: { user: true } } }
                                                },
                                                assignments: { include: { user: true } }
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
                        modules: { 
                            orderBy: { order: 'asc' },
                            include: { members: { include: { user: true } } }
                        },
                        partners: true,
                        assignments: { include: { user: true } },
                        tasks: {
                            orderBy: { startDate: 'asc' },
                            include: {
                                modules: { 
                                    orderBy: { order: 'asc' },
                                    include: { members: { include: { user: true } } }
                                },
                                partners: true,
                                assignments: { include: { user: true } },
                                activities: {
                                    orderBy: { estimatedStartDate: 'asc' },
                                    include: { 
                                        modules: { 
                                            orderBy: { order: 'asc' },
                                            include: { members: { include: { user: true } } }
                                        },
                                        assignments: { include: { user: true } }
                                    }
                                }
                            }
                        }
                    }
                },
                modules: {
                    where: { sectionId: null, workId: null, taskId: null, activityId: null },
                    orderBy: { order: 'asc' },
                    include: { 
                        members: { include: { user: true } }
                    }
                }
            }
        });

        if (!project) {
            throw new Error("Project not found");
        }

        const workbook = new ExcelJS.Workbook();
        workbook.creator = "Scrittura Erasmus";
        workbook.created = new Date();

        // 1. PROJECT INFO SHEET
        const infoSheet = workbook.addWorksheet("Project Info");
        infoSheet.columns = [
            { header: "Field", key: "field", width: 20 },
            { header: "Value", key: "value", width: 50 },
        ];
        infoSheet.addRows([
            { field: "Title", value: project.title },
            { field: "Acronym", value: project.acronym },
            ...(config.options.includeDates ? [
                { field: "Start Date", value: project.startDate },
                { field: "End Date", value: project.endDate },
                { field: "Duration (months)", value: project.duration },
            ] : []),
            { field: "National Agency", value: project.nationalAgency },
            { field: "Language", value: project.language },
        ]);

        // 2. PARTNERS SHEET
        const filteredPartners = project.partners.filter((p: any) => {
            const role = (p.role || "").toUpperCase();
            if (role === 'COORDINATOR') return config.options.includePartnership.coordinator;
            if (role === 'PARTNER') return config.options.includePartnership.partners;
            return config.options.includePartnership.others;
        });

        if (filteredPartners.length > 0) {
            const partnerSheet = workbook.addWorksheet("Partners");
            partnerSheet.columns = [
                { header: "ID", key: "id", width: 15 },
                { header: "Name", key: "name", width: 30 },
                { header: "Role", key: "role", width: 15 },
                { header: "Nation", key: "nation", width: 10 },
                { header: "City", key: "city", width: 20 },
                { header: "Type", key: "type", width: 15 },
                { header: "Email", key: "email", width: 25 },
            ];
            filteredPartners.forEach((p: any) => {
                partnerSheet.addRow({
                    id: p.id,
                    name: p.name,
                    role: p.role,
                    nation: p.nation,
                    city: p.city,
                    type: p.type,
                    email: p.email
                });
            });
        }

        // 2b. PROJECT TEAM SHEET
        const teamSheet = workbook.addWorksheet("Project Team");
        teamSheet.columns = [
            { header: "User Name", key: "userName", width: 25 },
            { header: "Email", key: "email", width: 30 },
            { header: "Role", key: "role", width: 15 },
            { header: "Partner", key: "partner", width: 30 },
            { header: "Expertise", key: "expertise", width: 20 },
        ];

        project.members.forEach((m: any) => {
            teamSheet.addRow({
                userName: m.user.name || m.user.email,
                email: m.user.email,
                role: m.role,
                partner: m.partner?.name || "N/A",
                expertise: m.expertise || ""
            });
        });

        // 3. STRUCTURE SHEET (WPs, Tasks, Activities)
        if (config.options.includeContent) {
            const structSheet = workbook.addWorksheet("Structure");
            structSheet.columns = [
                { header: "Type", key: "type", width: 12 },
                { header: "Section", key: "section", width: 15 },
                { header: "Parent", key: "parent", width: 15 },
                { header: "Title", key: "title", width: 35 },
                { header: "Assignees", key: "assignees", width: 25 },
                ...(config.options.includeDates ? [
                    { header: "Start Date", key: "start", width: 12 },
                    { header: "End Date", key: "end", width: 12 },
                ] : []),
                ...(config.options.includeBudget ? [
                    { header: "Budget", key: "budget", width: 10 },
                ] : []),
            ];

            // Helper to add recursive structure
            const addProjectItems = () => {
                 // 0. Root modules
                 project.modules?.forEach((m: any) => {
                     const mRow = structSheet.addRow({ type: "MODULE", title: m.title });
                     mRow.font = { italic: true, color: { argb: 'FF64748B' } };
                 });

                 // 1. Sections & their content
                 project.sections.forEach((s: any) => {
                     const sectionRow = structSheet.addRow({ type: "SECTION", title: s.title });
                     sectionRow.font = { bold: true };
                     sectionRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F3F5' } };

                     // Section modules
                     s.modules?.forEach((m: any) => {
                         const mRow = structSheet.addRow({ type: "MODULE", section: s.title, title: m.title });
                         mRow.font = { italic: true, color: { argb: 'FF64748B' } };
                     });

                     s.works.forEach((w: any) => {
                         const assignees = w.assignments?.map((a: any) => a.user.name || a.user.email).join(", ") || "";
                         structSheet.addRow({ 
                            type: "WORK", 
                            section: s.title, 
                            title: w.title, 
                            assignees,
                            ...(config.options.includeDates ? { start: w.startDate, end: w.endDate } : {}),
                            ...(config.options.includeBudget ? { budget: w.budget } : {})
                        });
                        
                        // Work modules
                        w.modules?.forEach((m: any) => {
                            const mRow = structSheet.addRow({ type: "MODULE", section: s.title, parent: w.title, title: m.title });
                            mRow.font = { italic: true, color: { argb: 'FF64748B' } };
                        });

                         w.tasks.forEach((t: any) => {
                             const tAssignees = t.assignments?.map((a: any) => a.user.name || a.user.email).join(", ") || "";
                             structSheet.addRow({ 
                                type: "TASK", 
                                section: s.title, 
                                parent: w.title, 
                                title: t.title, 
                                assignees: tAssignees,
                                ...(config.options.includeDates ? { start: t.startDate, end: t.endDate } : {}),
                                ...(config.options.includeBudget ? { budget: t.budget } : {})
                            });
                            
                            // Task modules
                            t.modules?.forEach((m: any) => {
                                const mRow = structSheet.addRow({ type: "MODULE", section: s.title, parent: t.title, title: m.title });
                                mRow.font = { italic: true, color: { argb: 'FF64748B' } };
                            });

                             t.activities.forEach((a: any) => {
                                 const aAssignees = a.assignments?.map((as: any) => as.user.name || as.user.email).join(", ") || "";
                                 structSheet.addRow({ 
                                    type: "ACTIVITY", 
                                    section: s.title, 
                                    parent: t.title, 
                                    title: a.title, 
                                    assignees: aAssignees,
                                    ...(config.options.includeDates ? { start: a.estimatedStartDate, end: a.estimatedEndDate } : {}),
                                    ...(config.options.includeBudget ? { budget: a.allocatedAmount } : {})
                                });

                                // Activity modules
                                a.modules?.forEach((m: any) => {
                                    const mRow = structSheet.addRow({ type: "MODULE", section: s.title, parent: a.title, title: m.title });
                                    mRow.font = { italic: true, color: { argb: 'FF64748B' } };
                                });
                             });
                         });
                     });
                 });

                 // 2. Unassigned works
                 project.works.forEach((w: any) => {
                     const assignees = w.assignments?.map((a: any) => a.user.name || a.user.email).join(", ") || "";
                     structSheet.addRow({ 
                        type: "WORK", 
                        title: w.title, 
                        assignees,
                        ...(config.options.includeDates ? { start: w.startDate, end: w.endDate } : {}),
                        ...(config.options.includeBudget ? { budget: w.budget } : {})
                    });

                    w.modules?.forEach((m: any) => {
                        const mRow = structSheet.addRow({ type: "MODULE", parent: w.title, title: m.title });
                        mRow.font = { italic: true, color: { argb: 'FF64748B' } };
                    });

                     w.tasks.forEach((t: any) => {
                         const tAssignees = t.assignments?.map((a: any) => a.user.name || a.user.email).join(", ") || "";
                         structSheet.addRow({ 
                            type: "TASK", 
                            parent: w.title, 
                            title: t.title, 
                            assignees: tAssignees,
                            ...(config.options.includeDates ? { start: t.startDate, end: t.endDate } : {}),
                            ...(config.options.includeBudget ? { budget: t.budget } : {})
                        });

                        t.modules?.forEach((m: any) => {
                            const mRow = structSheet.addRow({ type: "MODULE", parent: t.title, title: m.title });
                            mRow.font = { italic: true, color: { argb: 'FF64748B' } };
                        });

                         t.activities.forEach((a: any) => {
                             const aAssignees = a.assignments?.map((as: any) => as.user.name || as.user.email).join(", ") || "";
                             structSheet.addRow({ 
                                type: "ACTIVITY", 
                                parent: t.title, 
                                title: a.title, 
                                assignees: aAssignees,
                                ...(config.options.includeDates ? { start: a.estimatedStartDate, end: a.estimatedEndDate } : {}),
                                ...(config.options.includeBudget ? { budget: a.allocatedAmount } : {})
                            });

                            a.modules?.forEach((m: any) => {
                                const mRow = structSheet.addRow({ type: "MODULE", parent: a.title, title: m.title });
                                mRow.font = { italic: true, color: { argb: 'FF64748B' } };
                            });
                         });
                    });
                });
            };
            addProjectItems();
        }

        // 4. MODULES (Text Content)
        if (config.options.includeContributions || config.options.includeMetadata) {
            const moduleSheet = workbook.addWorksheet("Text Modules");
            moduleSheet.columns = [
                { header: "Level", key: "parentType", width: 10 },
                { header: "Context", key: "parentTitle", width: 20 },
                { header: "Module Title", key: "title", width: 25 },
                { header: "Writers", key: "writers", width: 20 },
                { header: "Status", key: "status", width: 12 },
                { header: "Chars", key: "chars", width: 8 },
                { header: "Max", key: "maxChars", width: 8 },
                { header: "Content", key: "content", width: 50 },
            ];

            const addModulesToSheet = (modules: any[], parentType: string, parentTitle: string) => {
                modules.forEach(m => {
                    const charCount = m.officialText ? m.officialText.replace(/<[^>]+>/g, '').length : 0;
                    const writers = m.members?.map((mem: any) => mem.user.name || mem.user.email).join(", ") || "";
                    moduleSheet.addRow({
                        parentType,
                        parentTitle,
                        title: m.title,
                        writers,
                        status: m.status,
                        chars: charCount,
                        maxChars: m.maxChars,
                        content: config.options.includeContributions ? m.officialText?.replace(/<[^>]+>/g, '') : "(Excluded)"
                    });
                });
            };

            // Root modules
            addModulesToSheet(project.modules || [], "PROJECT", project.acronym || "Root");

            // Assigned to Sections
            project.sections.forEach((s: any) => {
                addModulesToSheet(s.modules || [], "SECTION", s.title);
                s.works.forEach((w: any) => {
                    addModulesToSheet(w.modules || [], "WP", w.title);
                    w.tasks.forEach((t: any) => {
                        addModulesToSheet(t.modules || [], "TASK", t.title);
                        t.activities.forEach((a: any) => {
                            addModulesToSheet(a.modules || [], "ACTIVITY", a.title);
                        });
                    });
                });
            });

            // Unassigned Works
            project.works.forEach((w: any) => {
                addModulesToSheet(w.modules || [], "WP", w.title);
                w.tasks.forEach((t: any) => {
                    addModulesToSheet(t.modules || [], "TASK", t.title);
                    t.activities.forEach((a: any) => {
                        addModulesToSheet(a.modules || [], "ACTIVITY", a.title);
                    });
                });
            });

            // Styling for A4 print and readability
            const sheets = [
                infoSheet, 
                workbook.getWorksheet("Partners"), 
                workbook.getWorksheet("Structure"), 
                workbook.getWorksheet("Text Modules")
            ].filter(Boolean);

            sheets.forEach((sheet: any) => {
                sheet.getRow(1).font = { bold: true };
                sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9ECEF' } };
                sheet.eachRow((row: any) => {
                    row.alignment = { vertical: 'middle', wrapText: true };
                });
                sheet.pageSetup = {
                    paperSize: 9, // A4
                    orientation: 'portrait',
                    fitToPage: true,
                    fitToWidth: 1,
                    fitToHeight: 0,
                    margins: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 }
                };
            });
        }
        
        // Return as base64 for the client to download
        const buffer = await workbook.xlsx.writeBuffer();
        return { 
            success: true, 
            data: Buffer.from(buffer as any).toString('base64'),
            filename: `${project.acronym || 'Project'}_Export_${new Date().toISOString().split('T')[0]}.xlsx`
        };
    } catch (error) {
        console.error("[ExportExcel] Error:", error);
        return { error: `Failed to export Excel: ${error}` };
    }
}

/**
 * Imports project data from Excel.
 * Currently focus on basic info and partners. Structure import is very complex.
 */
export async function importProjectFromExcel(projectId: string, base64Data: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    try {
        const buffer = Buffer.from(base64Data, 'base64');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer as any);

        const infoSheet = workbook.getWorksheet("Project Info");
        if (!infoSheet) throw new Error("Invalid Excel format: missing 'Project Info' sheet");

        // Update Project Info
        const updates: any = {};
        infoSheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const field = row.getCell(1).value;
            const value = row.getCell(2).value;

            if (field === "Title") updates.title = value;
            if (field === "Acronym") updates.acronym = value;
            if (field === "Language") updates.language = value;
            if (field === "National Agency") updates.nationalAgency = value;
        });

        await prisma.project.update({
            where: { id: projectId },
            data: updates
        });

        revalidatePath(`/dashboard/projects/${projectId}`);
        return { success: true };
    } catch (error) {
        console.error("[ImportExcel] Error:", error);
        return { error: `Failed to import Excel: ${error}` };
    }
}
/**
 * Export project structure to CSV
 */
export async function exportProjectToCSV(projectId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                sections: {
                    include: {
                        works: {
                            include: { tasks: true }
                        }
                    }
                }
            }
        });

        if (!project) throw new Error("Project not found");

        let csv = "Type,Title,Start Date,End Date,Budget\n";
        
        // Project
        csv += `Project,"${project.title}",${project.startDate.toISOString().split("T")[0]},${project.endDate.toISOString().split("T")[0]},${project.budget || 0}\n`;

        // Sections -> WPs -> Tasks
        project.sections.forEach((s: any) => {
            csv += `Section,"${s.title}",,, \n`;
            s.works.forEach((w: any) => {
                csv += `Work Package,"${w.title}",${w.startDate.toISOString().split("T")[0]},${w.endDate.toISOString().split("T")[0]},${w.budget}\n`;
                w.tasks.forEach((t: any) => {
                    csv += `Task,"${t.title}",${t.startDate.toISOString().split("T")[0]},${t.endDate.toISOString().split("T")[0]},${t.budget}\n`;
                });
            });
        });

        return {
            success: true,
            data: Buffer.from(csv).toString('base64'),
            filename: `${project.acronym || 'Project'}_Export.csv`
        };
    } catch (e) {
        return { error: `CSV Export failed: ${e}` };
    }
}
