"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { CalendarCheck, Loader2, Download } from "lucide-react"
import { generateTimesheetPDF } from "@/app/actions/export-actions" // We need to create this
import { toast } from "sonner"

export function TimesheetExportCard({ project }: { project: any }) {
    const [loading, setLoading] = useState(false)
    const [selectedPartnerId, setSelectedPartnerId] = useState("")
    
    // Simple download handler (mock for now until action is ready)
    const handleDownload = async () => {
        setLoading(true)
        try {
            // In a real app, this would trigger a download.
            // Since server actions return data, we might need a route handler for file download 
            // OR return a base64 string/blob url from the server action.
            // For simplicity, let's assume the action returns a success message or URL.
            
            const res = await generateTimesheetPDF(project.id, selectedPartnerId)
            
            if (res.success && res.url) {
                // Determine filename
                const link = document.createElement('a');
                link.href = res.url;
                link.download = `Timesheet_${project.acronym}_${new Date().toISOString().split('T')[0]}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success("Timesheet generated!")
            } else {
                toast.error("Failed to generate timesheet")
            }
        } catch (e) {
            toast.error("Error generating report")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col hover:border-indigo-300 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
                <CalendarCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Timesheets</h3>
            <p className="text-sm text-slate-500 mb-6 flex-1">
                Generate monthly timesheets for all partners or specific ones. Includes assigned active days.
            </p>
            
            <div className="space-y-3">
                 <select 
                    className="w-full text-sm border-slate-200 rounded-md p-2"
                    value={selectedPartnerId}
                    onChange={(e) => setSelectedPartnerId(e.target.value)}
                    aria-label="Select Partner for Timesheet"
                >
                    <option value="">All Partners</option>
                    {project.partners.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                 </select>

                 <Button 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
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
