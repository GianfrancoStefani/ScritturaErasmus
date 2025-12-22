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
    const createModulesForParent = async (tx: any, parentId: string, parentType: 'WORK' | 'SECTION', sheetName: string) => {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) return;

        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: "A", range: 0, defval: "" });
        // Filter rows with Max Chars in Column D OR specific Popup Titles
        const popupTitles = ["most relevant priority", "select up to two", "select up to three"]; // Keywords
        const moduleRows = rows.filter(r => {
             const hasChars = r["D"] && !isNaN(parseInt(r["D"]));
             const title = r["A"] ? r["A"].toString() : "";
             const isPopup = popupTitles.some(k => title.toLowerCase().includes(k.toLowerCase()));
             
             if (isPopup) {
                 fs.appendFileSync(path.join(process.cwd(), "public/import-log.txt"), `[DEBUG] Found Popup Module: ${title}\n`);
             }
             
             return hasChars || isPopup;
        });

        let order = 0;
        for (const row of moduleRows) {
            const encodedGuidelines = row["E"] ? row["E"].toString() : null;
            // Hack to avoid stale client error if needed, but we try to include it.
            // If previous error persists, we might need to omit guidelines again or restart dev server.
            
            const title = row["A"] ? row["A"].toString() : "Untitled Module";
            
            // Logic for Popup Modules (Mocked Options)
            let type = "TEXT";
            let options = null;
            let maxSelections = null;

            const titleLower = title.toLowerCase();

            if (titleLower.includes("most relevant priority")) {
                type = "POPUP";
                options = JSON.stringify([
                    { label: "Inclusion and diversity", value: "inclusion_diversity" },
                    { label: "Digital transformation", value: "digital_transformation" },
                    { label: "Environment and fight against climate change", value: "environment_climate" },
                    { label: "Participation in democratic life", value: "democratic_participation" }
                ]);
                maxSelections = 1;
            } else if (titleLower.includes("select up to two additional")) {
                type = "POPUP";
                options = JSON.stringify([
                    { label: "Inclusion and diversity", value: "inclusion_diversity" },
                    { label: "Digital transformation", value: "digital_transformation" },
                    { label: "Environment and fight against climate change", value: "environment_climate" },
                    { label: "Participation in democratic life", value: "democratic_participation" }
                ]);
                maxSelections = 2; // "up to two"
            } else if (titleLower.includes("select up to three topics")) {
                type = "POPUP";
                 options = JSON.stringify([
                    { label: "Topic 1", value: "topic_1" },
                    { label: "Topic 2", value: "topic_2" },
                    { label: "Topic 3", value: "topic_3" },
                    { label: "Topic 4", value: "topic_4" },
                    { label: "Topic 5", value: "topic_5" }
                ]);
                maxSelections = 3; // "up to three"
            }

            let data: any = {
                title: title,
                officialText: "",
                maxChars: isNaN(parseInt(row["D"])) ? null : parseInt(row["D"]),
                guidelines: encodedGuidelines,
                status: "TO_DONE",
                order: order++,
                type: type,
                options: options || undefined,
                maxSelections: maxSelections || undefined
            };

            if (parentType === 'SECTION') {
                data.section = { connect: { id: parentId } };
            } else if (parentType === 'WORK') {
                data.work = { connect: { id: parentId } };
            }

            await tx.module.create({ data });
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
        // "Form" & "Impact" -> Sections
        // "WP..." -> Work Packages
        
        const sheetsToProcess = [
            { name: "Form", type: "SECTION", title: "Project Design & Context", order: 0 },
            { name: "WP1", type: "WORK", title: "Work Package 1", order: 1 },
            { name: "WP2", type: "WORK", title: "Work Package 2", order: 2 },
            { name: "WP3", type: "WORK", title: "Work Package 3", order: 3 },
            { name: "WP4", type: "WORK", title: "Work Package 4", order: 4 },
            { name: "WP5", type: "WORK", title: "Work Package 5", order: 5 },
            { name: "Other WP", type: "WORK", title: "Other Work Packages", order: 6 },
            { name: "Impact", type: "SECTION", title: "Impact & Follow-up", order: 7 }
        ];

        for (const item of sheetsToProcess) {
            const sheet = workbook.Sheets[item.name];
            if (!sheet) continue;

            const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: "A", range: 0, defval: "" });
            const hasModules = rows.some(r => r["D"] && !isNaN(parseInt(r["D"])));

            if (hasModules) {
                 if (item.type === "SECTION") {
                    const section = await tx.section.create({
                        data: {
                            projectId: newProject.id,
                            title: item.title,
                            order: item.order
                        }
                    });
                    await createModulesForParent(tx, section.id, 'SECTION', item.name);
                } else {
                    // WORK
                    const work = await tx.work.create({
                        data: {
                            projectId: newProject.id,
                            title: item.title,
                            startDate: projectData.startDate,
                            endDate: projectData.endDate,
                            budget: 0
                        }
                    });
                    await createModulesForParent(tx, work.id, 'WORK', item.name);
                }
            }
        }
        return newProject;
    });

    revalidatePath("/dashboard/projects");
    fs.writeFileSync(path.join(process.cwd(), "public/import-log.txt"), `[${new Date().toISOString()}] SUCCESS: Imported project "${projectData.title}" with ID ${project.id}\n`);
    const logs = fs.readFileSync(path.join(process.cwd(), "public/import-log.txt"), "utf-8");
    return { success: true, logs };

  } catch (error) {
    const errorMsg = "Failed to import project: " + (error as Error).message;
    console.error("Import failed:", error);
    fs.writeFileSync(path.join(process.cwd(), "public/import-log.txt"), `[${new Date().toISOString()}] ERROR: ${errorMsg}\n`);
    const logs = fs.existsSync(path.join(process.cwd(), "public/import-log.txt")) ? fs.readFileSync(path.join(process.cwd(), "public/import-log.txt"), "utf-8") : "";
    return { error: errorMsg, logs: logs + "\nError: " + errorMsg };
  }
}
