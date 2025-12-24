"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { PieChart, Loader2, Download } from "lucide-react"
import { generateBudgetCSV } from "@/app/actions/export-actions"
import { toast } from "sonner"

export function BudgetExportCard({ project }: { project: any }) {
    const [loading, setLoading] = useState(false)

    const handleDownload = async () => {
        setLoading(true)
        try {
            const res = await generateBudgetCSV(project.id)
            if (res.success && res.csv) {
                // Create CSV blob
                const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `Budget_${project.acronym}_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success("Budget exported!")
            } else {
                 toast.error("Failed to export budget")
            }
        } catch (e) {
            toast.error("Error exporting budget")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col hover:border-emerald-300 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
                <PieChart className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Budget Overview</h3>
            <p className="text-sm text-slate-500 mb-6 flex-1">
                Export financial data including partner budgets, allocated costs, and remaining funds.
            </p>
            
            <div className="mt-auto">
                 <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                    onClick={handleDownload}
                    disabled={loading}
                 >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Export to CSV
                 </Button>
            </div>
        </div>
    )
}
