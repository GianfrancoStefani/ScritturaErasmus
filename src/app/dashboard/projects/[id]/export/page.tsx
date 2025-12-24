import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, FileText, PieChart, CalendarCheck } from "lucide-react";
import { TimesheetExportCard } from "@/components/export/TimesheetExportCard";
import { BudgetExportCard } from "@/components/export/BudgetExportCard";
import { WorkplanExportCard } from "@/components/export/WorkplanExportCard";

export default async function ExportHubPage({ params }: { params: { id: string } }) {
    const project = await prisma.project.findUnique({
        where: { id: params.id },
        include: {
            partners: {
                include: {
                    users: true
                }
            }
        }
    });

    if (!project) return <div>Project not found</div>;

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div>
                 <Link 
                    href={`/dashboard/projects/${params.id}`} 
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-2 w-fit transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Project
                </Link>
                <h1 className="text-3xl font-bold text-slate-900">Export & Reporting</h1>
                <p className="text-slate-500">Generate and download project reports.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <TimesheetExportCard project={project} />
                <BudgetExportCard project={project} />
                <WorkplanExportCard project={project} />
            </div>
        </div>
    );
}
