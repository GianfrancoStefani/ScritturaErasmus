"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { FileText, Loader2, Download } from "lucide-react"
import { generateWorkplanPDF } from "@/app/actions/export-actions"
import { toast } from "sonner"

export function WorkplanExportCard({ project }: { project: any }) {
    const [loading, setLoading] = useState(false)

    const handleDownload = async () => {
        setLoading(true)
        try {
            const res = await generateWorkplanPDF(project.id)
            if (res.success && res.url) {
                const link = document.createElement('a');
                link.href = res.url;
                link.download = `Workplan_${project.acronym}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success("Workplan generated!")
            } else {
                 toast.error("Failed to generate workplan")
            }
        } catch (e) {
            toast.error("Error generating workplan")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col hover:border-amber-300 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 mb-4">
                <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Detailed Workplan</h3>
            <p className="text-sm text-slate-500 mb-6 flex-1">
                Full project structure export including Work Packages, Tasks, Activities, and Timeline.
            </p>
            
            <div className="mt-auto">
                 <Button 
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white gap-2"
                    onClick={handleDownload}
                    disabled={loading}
                 >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Download PDF
                 </Button>
            </div>
        </div>
    )
}
