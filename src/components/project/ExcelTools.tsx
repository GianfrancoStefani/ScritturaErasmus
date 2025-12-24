"use client";

import React, { useState } from "react";
import { 
    FileSpreadsheet, 
    Upload, 
    Download, 
    AlertCircle,
    CheckCircle2,
    FileText
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { exportProjectToExcel, importProjectFromExcel, exportProjectToCSV } from "@/app/actions/excelActions";
import { toast } from "sonner";
import { ExportConfigModal } from "@/components/export/ExportConfigModal";
import { PDFConfig } from "@/lib/pdf-generator";

interface ExcelToolsProps {
    projectId: string;
}

export function ExcelTools({ projectId }: ExcelToolsProps) {
    const [isExporting, setIsExporting] = useState(false);
    const [isCSVExporting, setIsCSVExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleExport = async (config: PDFConfig) => {
        setIsExporting(true);
        try {
            const result = await exportProjectToExcel(projectId, config);
            if (result.success && result.data && result.filename) {
                const link = document.createElement('a');
                link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${result.data}`;
                link.download = result.filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success("Excel exported successfully");
            } else {
                toast.error(result.error || "Failed to export Excel");
            }
        } catch (error) {
            toast.error("Export failed");
        }
        setIsExporting(false);
    };

    const handleCSVExport = async () => {
        // Simple CSV export doesn't use the full config yet, but could be added later
        setIsCSVExporting(true);
        try {
            const result = await exportProjectToCSV(projectId);
            if (result.success && result.data && result.filename) {
                const link = document.createElement('a');
                link.href = `data:text/csv;base64,${result.data}`;
                link.download = result.filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success("CSV exported successfully");
            } else {
                toast.error(result.error || "Failed to export CSV");
            }
        } catch (error) {
            toast.error("CSV Export failed");
        }
        setIsCSVExporting(false);
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm("WARNING: Importing from Excel will overwrite project info. Continue?")) return;

        setIsImporting(true);
        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const base64 = (event.target?.result as string).split(',')[1];
                const result = await importProjectFromExcel(projectId, base64);
                if (result.success) {
                    toast.success("Project updated from Excel");
                    window.location.reload();
                } else {
                    toast.error(result.error || "Failed to import Excel");
                }
                setIsImporting(false);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            toast.error("Import failed");
            setIsImporting(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Button 
                variant="secondary"
                onClick={() => setIsModalOpen(true)}
                disabled={isExporting}
                title="Export to Excel"
                className="w-9 h-9 p-0 flex items-center justify-center bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
            >
                <FileSpreadsheet size={16} />
            </Button>

            <Button 
                variant="secondary"
                onClick={handleCSVExport}
                disabled={isCSVExporting}
                title="Export to CSV"
                className="w-9 h-9 p-0 flex items-center justify-center bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
            >
                <FileText size={16} />
            </Button>

            <div className="relative">
                <input 
                    type="file" 
                    accept=".xlsx"
                    onChange={handleImport}
                    className="absolute inset-0 opacity-0 cursor-pointer w-9 h-9"
                    title="Import from Excel"
                    disabled={isImporting}
                />
                <Button 
                    variant="secondary"
                    className="w-9 h-9 p-0 flex items-center justify-center bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 pointer-events-none"
                >
                    <Upload size={16} />
                </Button>
            </div>

            <ExportConfigModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleExport}
                title="Excel Export Configuration"
            />
        </div>
    );
}
