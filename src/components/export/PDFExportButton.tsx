"use client";

import { Button } from "@/components/ui/Button";
import { Download, FileText } from "lucide-react";
import { useState } from "react";
import { generatePDF, PDFConfig } from "@/lib/pdf-generator";
import { toast } from "sonner";
import { ExportConfigModal } from "./ExportConfigModal";

interface PDFExportButtonProps {
  project: any;
  partners: any[];
  modules: any[];
}

export function PDFExportButton({ project, partners, modules }: PDFExportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGenerate = async (config: PDFConfig) => {
    setIsGenerating(true);
    try {
      // Ensure the project object passed to generator has the partners and modules we prepared
      const enrichedProject = {
          ...project,
          partners: partners,
      };

      await generatePDF(enrichedProject, config);
      toast.success("PDF generated successfully");
    } catch (e) {
      console.error("Error generating PDF:", e);
      toast.error("Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Button 
          onClick={() => setIsModalOpen(true)} 
          disabled={isGenerating}
          variant="primary"
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
      >
        {isGenerating ? (
          <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
              Generating...
          </div>
        ) : (
          <>
              <FileText size={18} />
              Download PDF Report
          </>
        )}
      </Button>

      <ExportConfigModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleGenerate}
        title="PDF Export Configuration"
      />
    </>
  );
}
