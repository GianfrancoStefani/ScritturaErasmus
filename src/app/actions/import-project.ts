"use server";

import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";
import { revalidatePath } from "next/cache";

export async function importProjectFromExcel() {
  try {
    const filePath = path.join(process.cwd(), "KA220-E_AppForm.xlsx");
    if (!fs.existsSync(filePath)) {
        return { error: "File KA220-E_AppForm.xlsx not found" };
    }
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });

    // 1. Extract Project Info from "Form"
    const formSheet = workbook.Sheets["Form"];
    let projectData: any = {
        title: "Imported Erasmus Project",
        titleEn: "Imported Erasmus Project",
        acronym: "IMPORT",
        nationalAgency: "IT02", // Default agency
        startDate: new Date(),
        duration: 24,
        language: "English"
    };

    if (formSheet) {
        const json: any[] = XLSX.utils.sheet_to_json(formSheet, { header: "A", range: 0, defval: "" });
        // Find rows for metadata
        const findValue = (keyStart: string) => {
            const row = json.find(r => r["A"] && r["A"].toString().toLowerCase().includes(keyStart.toLowerCase()));
            return row ? row["B"] : null;
        };

        const title = findValue("Project Title");
        if (title) {
            projectData.title = title;
            projectData.titleEn = title; // Default titleEn to title
        }

        const titleEn = findValue("Project Title in English");
        if (titleEn) projectData.titleEn = titleEn;

        const acronym = findValue("Acronym"); // "Projec Acronym" typo in log?
        if (acronym) projectData.acronym = acronym;

        const startDate = findValue("Start Date");
        if (startDate && startDate instanceof Date) projectData.startDate = startDate;
        
        const duration = findValue("Duration");
        if (duration) projectData.duration = parseInt(duration) || 24;

        const agency = findValue("National Agency");
        if (agency) projectData.nationalAgency = agency;
        
        const lang = findValue("Language");
        if (lang) projectData.language = lang;
    }

    projectData.endDate = new Date(projectData.startDate);
    projectData.endDate.setMonth(projectData.endDate.getMonth() + projectData.duration);

    // Helper to create modules
    const createModulesForParent = async (tx: any, parentId: string, parentType: 'WORK', sheetName: string) => {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) return;

        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: "A", range: 0, defval: "" });
        // Filter rows with Max Chars in Column D
        const moduleRows = rows.filter(r => r["D"] && !isNaN(parseInt(r["D"])));

        let order = 0;
        for (const row of moduleRows) {
            await tx.module.create({
                data: {
                    title: row["A"] ? row["A"].toString() : "Untitled Module",
                    // subtitle?
                    officialText: "", // Empty for now
                    maxChars: parseInt(row["D"]),
                    // guidelines: row["E"] ? row["E"].toString() : null, // Removed due to stale client
                    status: "TO_DONE",
                    order: order++,
                    workId: parentId // Assuming attached to Work
                }
            });
        }
    };

    // TRANSACTION
    const project = await prisma.$transaction(async (tx) => {
        // Create Project
        const newProject = await tx.project.create({
            data: projectData
        });

        // ... (rest of logic using newProject)


        // Define Sheets and Mapping
        // "Form" contain General Questions -> Map to a "Project Design" Work Package?
        // "WP1", "WP2", ... -> Work Packages.
        
        const sheetsToProcess = [
            { name: "Form", workTitle: "Project Design & Context" },
            { name: "WP1", workTitle: "Work Package 1" },
            { name: "WP2", workTitle: "Work Package 2" },
            { name: "WP3", workTitle: "Work Package 3" },
            { name: "WP4", workTitle: "Work Package 4" },
            { name: "WP5", workTitle: "Work Package 5" },
            { name: "Other WP", workTitle: "Other Work Packages" },
            { name: "Impact", workTitle: "Impact & Follow-up" }
        ];

        let workOrder = 0;
        for (const item of sheetsToProcess) {
            const sheet = workbook.Sheets[item.name];
            if (!sheet) continue;

            // Check if sheet has any modules
            const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: "A", range: 0, defval: "" });
            const hasModules = rows.some(r => r["D"] && !isNaN(parseInt(r["D"])));

            if (hasModules) {
                // Create Work Package
                const work = await tx.work.create({
                    data: {
                        projectId: newProject.id,
                        title: item.workTitle,
                        // order: workOrder++, // Work model doesn't support order yet
                        startDate: projectData.startDate, // Default dates
                        endDate: projectData.endDate,
                        budget: 0
                    }
                });

                // Create Modules
                await createModulesForParent(tx, work.id, 'WORK', item.name);
            }
        }
        return newProject;
    });

    revalidatePath("/dashboard/projects");
    fs.writeFileSync(path.join(process.cwd(), "public/import-log.txt"), `[${new Date().toISOString()}] SUCCESS: Imported project "${projectData.title}" with ID ${project.id}\n`);
    return { success: true };

  } catch (error) {
    const errorMsg = "Failed to import project: " + (error as Error).message;
    console.error("Import failed:", error);
    fs.writeFileSync(path.join(process.cwd(), "public/import-log.txt"), `[${new Date().toISOString()}] ERROR: ${errorMsg}\n`);
    return { error: errorMsg };
  }
}
