
import { jsPDF } from "jspdf";
import { format } from "date-fns";

export interface PDFConfig {
    scope: {
        selectedIds: string[]; // Set of IDs (works, tasks, modules) to include
    };
    options: {
        includeComments: boolean;
        includeCover: boolean;
        includeTOC: boolean;
        includePartners: boolean;
    };
    style: {
        theme: 'modern' | 'classic' | 'minimal';
        customTitle?: string;
    };
}

export const generatePDF = (project: any, config: PDFConfig) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // Theme Config
    const themes = {
        modern: { primary: "#1e3a8a", secondary: "#3b82f6", text: "#334155", font: "helvetica" },
        classic: { primary: "#000000", secondary: "#4b5563", text: "#000000", font: "times" },
        minimal: { primary: "#000000", secondary: "#000000", text: "#444444", font: "courier" },
    };
    const theme = themes[config.style.theme];

    // Helper: Add Text
    const addText = (text: string, size: number, weight: "normal" | "bold" | "italic" = "normal", color: string = theme.text, indent: number = 0) => {
        doc.setFontSize(size);
        doc.setFont(theme.font, weight);
        doc.setTextColor(color);
        const lines = doc.splitTextToSize(text, contentWidth - indent);
        
        // Check Page Break
        if (y + lines.length * (size * 0.3527) + 5 > pageHeight - margin) {
            doc.addPage();
            y = margin;
        }

        doc.text(lines, margin + indent, y);
        y += lines.length * (size * 0.4) + 2; // Line height approx
    };

    // Helper: HTML to Text simple converter
    const stripHtml = (html: string) => {
        if (!html) return "";
        let text = html
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<\/div>/gi, '\n')
            .replace(/<li>/gi, '\n• ')
            .replace(/<\/li>/gi, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/<[^>]+>/g, ''); // Strip remaining tags
        
        // Decode basic entities (could be expanded)
        text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        return text.trim();
    };

    // --- COVER PAGE ---
    if (config.options.includeCover) {
        y = pageHeight / 3;
        doc.setFont(theme.font, "bold");
        doc.setFontSize(24);
        doc.setTextColor(theme.primary);
        doc.text(config.style.customTitle || project.title, pageWidth / 2, y, { align: "center" });
        y += 15;

        if (project.acronym) {
            doc.setFontSize(16);
            doc.setTextColor(theme.secondary);
            doc.text(`(${project.acronym})`, pageWidth / 2, y, { align: "center" });
            y += 20;
        }
        
        doc.setFontSize(12);
        doc.setTextColor(theme.text);
        doc.text(`Generated: ${format(new Date(), "dd MMMM yyyy")}`, pageWidth / 2, y, { align: "center" });

        doc.addPage();
        y = margin;
    }

    // --- TOC ---
    // (Simplified: Just listing works for now, calculating pages is hard before rendering)
    // Skipped complex TOC for MVP, can add "Structure" page.
    if (config.options.includeTOC) {
        addText("Table of Contents", 18, "bold", theme.primary);
        y += 10;
        project.works?.forEach((work: any) => {
            if (config.scope.selectedIds.includes(work.id)) {
                 addText(work.title, 12, "normal", theme.text);
            }
        });
        doc.addPage();
        y = margin;
    }

    // --- CONTENT LOOP ---
    // Iterate Works -> Tasks -> Modules
    // Also include Root Modules (Project level) if any, though model structure suggests Modules belong to Project directly usually? 
    // Wait, Schema says Module can handle parentId for Works/Tasks? 
    // In `getProject` we usually fetch nested.
    // Let's assume passed `project` object has `works` array and `modules` array (root).
    
    // 1. Root Modules
    if (project.modules && project.modules.length > 0) {
        const rootModules = project.modules.filter((m: any) => config.scope.selectedIds.includes(m.id));
        if (rootModules.length > 0) {
            addText("General Project Modules", 16, "bold", theme.primary);
            y += 5;
            rootModules.forEach((mod: any) => renderModule(mod));
        }
    }

    // 2. Works and Tasks
    if (project.works) {
        project.works.forEach((work: any) => {
             if (!config.scope.selectedIds.includes(work.id)) return;
             
             y += 5;
             addText(`Work Package: ${work.title}`, 16, "bold", theme.primary);
             y += 5;
             
             // Work Modules
             if (work.modules) {
                 work.modules.filter((m: any) => config.scope.selectedIds.includes(m.id))
                    .forEach((m: any) => renderModule(m));
             }

             // Tasks
             if (work.tasks) {
                 work.tasks.forEach((task: any) => {
                     if (!config.scope.selectedIds.includes(task.id)) return;
                     
                     addText(`Task: ${task.title}`, 14, "bold", theme.secondary, 5);
                     
                     if (task.modules) {
                         task.modules.filter((m: any) => config.scope.selectedIds.includes(m.id))
                            .forEach((m: any) => renderModule(m, 10));
                     }
                 });
             }
        });
    }

    function renderModule(module: any, indent: number = 0) {
        y += 5;
        addText(`${module.title}`, 12, "bold", theme.text, indent);
        
        if (module.officialText) {
            const plain = stripHtml(module.officialText);
            addText(plain, 10, "normal", theme.text, indent);
        } else {
            addText("(No content)", 10, "italic", "#9ca3af", indent);
        }

        // Comments
        if (config.options.includeComments && module.comments && module.comments.length > 0) {
             y += 2;
             addText("Comments:", 9, "bold", theme.secondary, indent + 5);
             module.comments.forEach((c: any) => {
                 const author = c.user ? `${c.user.name}: ` : "";
                 addText(`${author}${c.content}`, 9, "italic", "#64748b", indent + 5);
             });
             y += 2;
        }
        y += 5;
    }

    // Save
    doc.save(`${project.acronym || 'Project'}_Export.pdf`);
};
