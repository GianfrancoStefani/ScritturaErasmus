
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

export interface PDFConfig {
    options: {
        includeCover: boolean;
        includePartnership: {
            coordinator: boolean;
            partners: boolean;
            others: boolean;
        };
        includeContributions: boolean;
        includeMetadata: boolean;
        includeDates: boolean;
        includeBudget: boolean;
        includeContent: boolean;
        includeGantt?: boolean; // Reserved for future
    };
    style: {
        theme: 'modern' | 'classic' | 'minimal';
    };
}

const THEMES = {
    modern: { primary: "#1e3a8a", secondary: "#3b82f6", text: "#334155", font: "helvetica" },
    classic: { primary: "#000000", secondary: "#4b5563", text: "#000000", font: "times" },
    minimal: { primary: "#000000", secondary: "#000000", text: "#444444", font: "courier" },
};

export const generatePDF = async (project: any, config: PDFConfig) => {
    const doc = new jsPDF();
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = width - margin * 2;
    let y = margin;
    
    const theme = THEMES[config.style.theme];

    // Helper: Add wrapping text with page break handling
    const addWrappedText = (text: string, size: number, weight: "normal" | "bold" | "italic" = "normal", color: string = theme.text, indent: number = 0) => {
        if (!text) return;
        doc.setFontSize(size);
        doc.setFont(theme.font, weight);
        doc.setTextColor(color);
        
        const lines = doc.splitTextToSize(text, contentWidth - indent);
        
        lines.forEach((line: string) => {
            if (y + (size * 0.5) > height - margin) {
                doc.addPage();
                y = margin;
                // Re-apply style after page add
                doc.setFontSize(size);
                doc.setFont(theme.font, weight);
                doc.setTextColor(color);
            }
            doc.text(line, margin + indent, y);
            y += (size * 0.4) + 1.5;
        });
        y += 1.5; // Extra space after block
    };

    const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > height - margin) {
            doc.addPage();
            y = margin;
        }
    };

    // --- 1. COVER PAGE ---
    if (config.options.includeCover) {
        if (config.style.theme === 'modern') {
            doc.setFillColor(theme.primary);
            doc.rect(0, 0, 20, height, "F");
        }

        y = height / 3;
        doc.setFont(theme.font, "bold");
        doc.setFontSize(28);
        doc.setTextColor(theme.primary);
        doc.text(project.title, width / 2 + (config.style.theme === 'modern' ? 10 : 0), y, { align: "center", maxWidth: contentWidth });
        y += 15;

        if (project.acronym) {
            doc.setFontSize(20);
            doc.setTextColor(theme.secondary);
            doc.text(`(${project.acronym})`, width / 2 + (config.style.theme === 'modern' ? 10 : 0), y, { align: "center" });
            y += 25;
        }
        
        doc.setFontSize(14);
        doc.setFont(theme.font, "normal");
        doc.setTextColor(theme.text);
        if (config.options.includeDates && project.startDate && project.endDate) {
            doc.text(`Project Duration: ${format(new Date(project.startDate), "MM/yyyy")} - ${format(new Date(project.endDate), "MM/yyyy")}`, width / 2, y, { align: "center" });
            y += 10;
        }
        doc.text(`Generated on: ${format(new Date(), "PPpp")}`, width / 2, y, { align: "center" });

        doc.addPage();
        y = margin;
    }

    // --- 2. PARTNERSHIP & TEAM ---
    // Filter partners based on config
    const filteredPartners = project.partners?.filter((p: any) => {
        const role = (p.role || "").toUpperCase();
        if (role === 'COORDINATOR') return config.options.includePartnership.coordinator;
        if (role === 'PARTNER') return config.options.includePartnership.partners;
        return config.options.includePartnership.others;
    }) || [];

    if (filteredPartners.length > 0) {
        addWrappedText("1. Partnership Composition", 18, "bold", theme.primary);
        y += 5;

        const partnerBody = filteredPartners.map((p: any) => [
            p.name,
            p.role || "Partner",
            p.nation || "-",
            p.city || "-",
            p.type || "-"
        ]);

        autoTable(doc, {
            startY: y,
            head: [["Organization", "Role", "Country", "City", "Type"]],
            body: partnerBody,
            theme: 'grid',
            headStyles: { fillColor: theme.primary },
            styles: { font: theme.font as any, fontSize: 9 },
            margin: { left: margin, right: margin }
        });
        y = (doc as any).lastAutoTable.finalY + 10;

        // --- 2b. TEAM ROLES ---
        filteredPartners.forEach((p: any) => {
            if (p.team && p.team.length > 0) {
                checkPageBreak(30);
                addWrappedText(`${p.name} Team:`, 11, "bold", theme.secondary, 5);
                p.team.forEach((m: any) => {
                    checkPageBreak(12);
                    addWrappedText(`• ${m.name} - ${m.role}`, 10, "normal", theme.text, 10);
                });
            }
        });
        y += 5;
    }

    // --- 3. BUDGET (If enabled) ---
    if (config.options.includeBudget && project.partners && project.partners.length > 0) {
        checkPageBreak(30);
        addWrappedText("2. Budget Overview", 18, "bold", theme.primary);
        
        const budgetBody = project.partners.map((p: any) => [
            p.name,
            `€ ${p.budget?.toLocaleString() || '0'}`
        ]);

        autoTable(doc, {
            startY: y,
            head: [["Partner", "Allocated Budget"]],
            body: budgetBody,
            theme: 'striped',
            headStyles: { fillColor: theme.secondary },
            styles: { font: theme.font as any },
            margin: { left: margin, right: margin }
        });
        y = (doc as any).lastAutoTable.finalY + 15;
    }

    // --- 4. PROJECT CONTENT ---
    if (config.options.includeContent) {
        checkPageBreak(30);
        addWrappedText("3. Project Structure & Workplan", 18, "bold", theme.primary);
        y += 5;

        const renderModules = (modules: any[], indent: number) => {
            modules.forEach(mod => {
                checkPageBreak(25);
                // Module Title - ALWAYS SHOW
                addWrappedText(mod.title, 12, "bold", theme.text, indent);
                
                // Metadata: Status and Chars
                if (config.options.includeMetadata) {
                    const charCount = mod.officialText ? mod.officialText.replace(/<[^>]+>/g, '').length : 0;
                    const metaStr = `[Status: ${mod.status?.replace('_', ' ') || 'DRAFT'}] [Chars: ${charCount}${mod.maxChars ? '/' + mod.maxChars : ''}]`;
                    addWrappedText(metaStr, 8, "italic", theme.secondary, indent + 2);
                }

                // Contributions (Official Text)
                if (config.options.includeContributions) {
                    if (mod.officialText && mod.officialText.trim() !== "") {
                        const plainText = mod.officialText
                            .replace(/<p>/g, '\n')
                            .replace(/<\/p>/g, '\n')
                            .replace(/<br\s*\/?>/g, '\n')
                            .replace(/<[^>]+>/g, '')
                            .replace(/&nbsp;/g, ' ')
                            .trim();
                        addWrappedText(plainText, 10, "normal", theme.text, indent + 5);
                    } else {
                        addWrappedText("(Content pending)", 10, "italic", "#94a3b8", indent + 5);
                    }
                }
                y += 3;
            });
        };

        // Top level project modules
        if (project.modules && project.modules.length > 0) {
            checkPageBreak(20);
            addWrappedText("Project General Modules", 14, "bold", theme.secondary);
            renderModules(project.modules, 5);
        }

        // Project Sections
        project.sections?.forEach((section: any) => {
            checkPageBreak(30);
            addWrappedText(`Section: ${section.title}`, 16, "bold", theme.primary);
            if (section.modules) renderModules(section.modules, 5);

            section.works?.forEach((work: any) => {
                checkPageBreak(25);
                const dateStr = config.options.includeDates && work.startDate ? ` (${format(new Date(work.startDate), 'MM/yy')} - ${format(new Date(work.endDate), 'MM/yy')})` : "";
                const budgetStr = config.options.includeBudget && work.budget ? ` [Budget: €${work.budget.toLocaleString()}]` : "";
                addWrappedText(`Work Package: ${work.title}${dateStr}${budgetStr}`, 14, "bold", theme.secondary, 5);
                if (work.modules) renderModules(work.modules, 10);

                work.tasks?.forEach((task: any) => {
                    checkPageBreak(20);
                    const taskDateStr = config.options.includeDates && task.startDate ? ` (${format(new Date(task.startDate), 'MM/yy')} - ${format(new Date(task.endDate), 'MM/yy')})` : "";
                    const taskBudgetStr = config.options.includeBudget && task.budget ? ` [Budget: €${task.budget.toLocaleString()}]` : "";
                    addWrappedText(`Task: ${task.title}${taskDateStr}${taskBudgetStr}`, 12, "bold", "#475569", 10);
                    if (task.modules) renderModules(task.modules, 15);
                });
            });
        });

        // Unassigned Works
        const unassignedWorks = project.works?.filter((w: any) => !w.sectionId);
        if (unassignedWorks && unassignedWorks.length > 0) {
            checkPageBreak(20);
            addWrappedText("Other Work Packages", 16, "bold", theme.primary);
            unassignedWorks.forEach((work: any) => {
                checkPageBreak(25);
                const dateStr = config.options.includeDates && work.startDate ? ` (${format(new Date(work.startDate), 'MM/yy')} - ${format(new Date(work.endDate), 'MM/yy')})` : "";
                const budgetStr = config.options.includeBudget && work.budget ? ` [Budget: €${work.budget.toLocaleString()}]` : "";
                addWrappedText(`WP: ${work.title}${dateStr}${budgetStr}`, 14, "bold", theme.secondary, 5);
                if (work.modules) renderModules(work.modules, 10);
            });
        }
    }

    doc.save(`${project.acronym || 'Project'}_Official_Export.pdf`);
};
