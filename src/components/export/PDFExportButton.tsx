"use client";

import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/Button";
import { Download } from "lucide-react";
import { useState } from "react";

interface PDFExportButtonProps {
  project: {
    title: string;
    acronym?: string;
    startDate: Date;
    endDate: Date;
    description?: string | null;
  };
  partners: {
    name: string;
    country: string;
  }[];
  modules: {
    title: string;
    officialText?: string | null;
  }[];
}

export function PDFExportButton({ project, partners, modules }: PDFExportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = () => {
    setIsGenerating(true);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    // Helper to add text and advance Y
    const addText = (text: string, fontSize: number, fontWeight: "normal" | "bold" = "normal", color: string = "#000000") => {
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", fontWeight);
      doc.setTextColor(color);
      
      const lines = doc.splitTextToSize(text, contentWidth);
      doc.text(lines, margin, y);
      y += lines.length * (fontSize * 0.4) + 5;
    };

    // Helper to check page break
    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = 20;
      }
    };

    try {
      // Title
      addText(project.title, 22, "bold", "#1e293b"); // Slate 900
      if (project.acronym) {
        addText(`(${project.acronym})`, 16, "normal", "#64748b");
      }
      y += 5;

      // Project Info
      addText(`Duration: ${project.startDate.toLocaleDateString()} - ${project.endDate.toLocaleDateString()}`, 12);
      y += 10;

      // Description
      if (project.description) {
         addText("Project Summary", 14, "bold", "#334155");
         addText(project.description, 11, "normal", "#475569");
         y += 10;
      }

      // Partners
      if (partners.length > 0) {
        checkPageBreak(30);
        addText("Partners", 14, "bold", "#334155");
        partners.forEach(partner => {
          checkPageBreak(15);
          addText(`• ${partner.name} (${partner.country})`, 11);
        });
        y += 10;
      }

      // Modules
      if (modules.length > 0) {
        doc.addPage();
        y = 20;
        addText("Project Modules", 18, "bold", "#1e293b");
        y += 10;

        modules.forEach((module, index) => {
            checkPageBreak(40);
            addText(`${index + 1}. ${module.title}`, 14, "bold", "#334155");
            
            if (module.officialText) {
                // Strip HTML tags for basic text PDF export
                // A regex is simple but not perfect. For better results, we might need a parser 
                // or use doc.html() (which is async and canvas-based, slightly more complex).
                // Staying simple for now: regex strip.
                const plainText = module.officialText.replace(/<[^>]+>/g, '\n').replace(/\n+/g, '\n').trim();
                addText(plainText, 11, "normal", "#475569");
            } else {
                addText("(No content yet)", 11, "normal", "#94a3b8");
            }
            y += 10;
        });
      }

      doc.save(`${project.acronym || 'Project'}_Report.pdf`);
    } catch (e) {
      console.error("Error generating PDF:", e);
      alert("Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
        onClick={generatePDF} 
        disabled={isGenerating}
        variant="secondary"
        className="flex items-center gap-2"
    >
      <Download size={16} />
      {isGenerating ? "Generating..." : "Export PDF"}
    </Button>
  );
}
