
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { format, differenceInMonths, addMonths } from "date-fns";
import { loadLogoBase64, hexToRgb } from "./pdf-utils";

export interface PDFConfig {
    scope: {
        selectedIds: string[];
    };
    options: {
        includeComments: boolean;
        includeCover: boolean;
        includeTOC: boolean;
        includeBudget: boolean;
        includeGantt: boolean;
        includeContent: boolean;
    };
    style: {
        theme: 'modern' | 'classic' | 'minimal';
        customTitle?: string;
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

    // Helper: Add Text
    const addText = (text: string, size: number, weight: "normal" | "bold" | "italic" = "normal", color: string = theme.text, indent: number = 0) => {
        doc.setFontSize(size);
        doc.setFont(theme.font, weight);
        doc.setTextColor(color);
        const lines = doc.splitTextToSize(text, contentWidth - indent);
        
        // Check Page Break
        if (y + lines.length * (size * 0.3527) + 5 > height - margin) {
            doc.addPage();
            y = margin;
        }

        doc.text(lines, margin + indent, y);
        y += lines.length * (size * 0.4) + 2;
    };

    // Helper: Add Page Break
    const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > height - margin) {
            doc.addPage();
            y = margin;
        }
    };

    // --- 1. COVER PAGE ---
    if (config.options.includeCover) {
        // Background Strip (Modern Theme)
        if (config.style.theme === 'modern') {
            doc.setFillColor(theme.primary);
            doc.rect(0, 0, 20, height, "F");
        }

        // Logo
        /* 
        const logoUrl = project.logo || "/placeholder-logo.png";
        const logoBase64 = await loadLogoBase64(logoUrl);
        if (logoBase64) {
             doc.addImage(logoBase64, 'PNG', width / 2 - 30, 60, 60, 60);
        }
        */

        y = height / 3;
        doc.setFont(theme.font, "bold");
        doc.setFontSize(28);
        doc.setTextColor(config.style.theme === 'modern' ? theme.primary : "#000000");
        doc.text(config.style.customTitle || project.title, width / 2, y, { align: "center", maxWidth: contentWidth });
        y += 20;

        if (project.acronym) {
            doc.setFontSize(18);
            doc.setTextColor(theme.secondary);
            doc.text(`(${project.acronym})`, width / 2, y, { align: "center" });
            y += 30;
        }
        
        doc.setFontSize(12);
        doc.setFont(theme.font, "normal");
        doc.setTextColor(theme.text);
        doc.text(`Project Duration: ${format(new Date(project.startDate), "MMM yyyy")} - ${format(new Date(project.endDate), "MMM yyyy")}`, width / 2, y, { align: "center" });
        y += 10;
        doc.text(`Generated: ${format(new Date(), "dd MMMM yyyy")}`, width / 2, y, { align: "center" });

        doc.addPage();
        y = margin;
    }

    // --- 2. BUDGET TABLE ---
    if (config.options.includeBudget) {
        addText("Budget Overview", 18, "bold", theme.primary);
        y += 5;

        // Prepare Data
        // Columns: Partner, Staff, Travel, Equipment, Other, Indirect, Total
        // Mocking calculation logic for now (assuming project.partners has budget info or calculating from standardCosts? 
        // Real app should pass pre-calculated stats. Using placeholders).
        
        const head = [["Partner", "Role", "Staff Cost", "Total Budget"]];
        const body = project.partners?.map((p: any) => [
            p.name,
            p.role,
            "€ 0.00", // Would need real calculation logic
            p.budget ? `€ ${p.budget.toFixed(2)}` : "€ 0.00"
        ]) || [];

        autoTable(doc, {
            startY: y,
            head: head,
            body: body,
            theme: 'grid',
            headStyles: { fillColor: theme.primary },
            styles: { font: theme.font as any },
            margin: { left: margin, right: margin }
        });

        y = (doc as any).lastAutoTable.finalY + 15;
        checkPageBreak(20);
    }

    // --- 3. GANTT CHART ---
    if (config.options.includeGantt) {
        addText("Project Workplan (Gantt)", 18, "bold", theme.primary);
        y += 10;
        
        const startDate = new Date(project.startDate);
        const endDate = new Date(project.endDate);
        const totalMonths = differenceInMonths(endDate, startDate) + 1;
        const chartWidth = contentWidth - 40; // 40 for label
        const monthWidth = chartWidth / totalMonths;

        // Draw Header
        doc.setFontSize(8);
        doc.setTextColor(theme.text);
        for(let i=0; i < totalMonths; i++) {
            const mDate = addMonths(startDate, i);
            if (i % 3 === 0) { // Label every 3 months
                doc.text(format(mDate, "MMM"), 60 + (i * monthWidth), y);
            }
        }
        y += 5;

        // Draw Bars
        project.works?.forEach((work: any) => {
             checkPageBreak(15);
             if(!config.scope.selectedIds.includes(work.id)) return;
             
             doc.setFontSize(10);
             doc.setTextColor(theme.primary);
             doc.text(work.title.substring(0, 15) + "...", margin, y + 4);

             const workStart = new Date(work.startDate);
             const workEnd = new Date(work.endDate);
             const offsetStart = differenceInMonths(workStart, startDate);
             const duration = differenceInMonths(workEnd, workStart) + 1;

             doc.setFillColor(theme.secondary);
             doc.roundedRect(60 + (offsetStart * monthWidth), y, duration * monthWidth, 6, 1, 1, "F");
             y += 10;
        });

        doc.addPage();
        y = margin;
    }

    // --- 4. CONTENT (Modules) with HTML Rendering ---
    if (config.options.includeContent) {
        // Iterate Works -> Tasks
        // We need an async loop for HTML rendering
        
        const renderModules = async (modules: any[], indent: number) => {
             for (const mod of modules) {
                 if (!config.scope.selectedIds.includes(mod.id)) continue;

                 checkPageBreak(30);
                 
                 // Title
                 doc.setFontSize(12);
                 doc.setFont(theme.font, "bold");
                 doc.setTextColor(theme.text);
                 doc.text(mod.title, margin + indent, y);
                 y += 6;

                 // Content (HTML)
                 if (mod.officialText && mod.officialText.length > 10) {
                     // METHOD 1: doc.html implementation (Complex)
                     // METHOD 2: html2canvas snapshot of a temporary container
                     
                     // We will use a mixed approach: Create a temporary div, mount it, snapshot, remove.
                     // IMPORTANT: This runs in browser context.
                     
                     const div = document.createElement("div");
                     div.innerHTML = mod.officialText;
                     div.style.width = `${600}px`; // Fixed print width
                     div.style.padding = "20px";
                     div.style.fontFamily = "Arial, sans-serif";
                     div.style.fontSize = "12px";
                     div.style.lineHeight = "1.5";
                     div.style.color = "#333";
                     div.style.position = "absolute";
                     div.style.top = "-9999px";
                     div.style.left = "-9999px";
                     div.style.background = "white";
                     document.body.appendChild(div);

                     try {
                         const canvas = await html2canvas(div, { scale: 2 });
                         const imgData = canvas.toDataURL("image/png");
                         const imgProps = doc.getImageProperties(imgData);
                         const pdfWidth = contentWidth - indent;
                         const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                         // Check space
                         checkPageBreak(pdfHeight);
                         
                         doc.addImage(imgData, "PNG", margin + indent, y, pdfWidth, pdfHeight);
                         y += pdfHeight + 5;
                     } catch(e) {
                         console.error("HTML Render Error", e);
                         addText("(Content Render Error)", 10, "italic", "red", indent);
                     } finally {
                         document.body.removeChild(div);
                     }

                 } else {
                     addText("(No content)", 10, "italic", "#9ca3af", indent);
                 }
                 y += 5;
             }
        };

        if (project.works) {
            for (const work of project.works) {
                if (!config.scope.selectedIds.includes(work.id)) continue;
                
                checkPageBreak(25);
                addText(`WP: ${work.title}`, 16, "bold", theme.primary);
                y += 8;

                if (work.modules) await renderModules(work.modules, 0);

                if (work.tasks) {
                    for (const task of work.tasks) {
                         if (!config.scope.selectedIds.includes(task.id)) continue;
                         checkPageBreak(20);
                         addText(`Task: ${task.title}`, 14, "bold", theme.secondary, 5);
                         y += 6;
                         if (task.modules) await renderModules(task.modules, 8);
                    }
                }
            }
        }
    }

    return doc.save(`${project.acronym || 'Project'}_Export.pdf`); // Return Promise<void> effectively
};
