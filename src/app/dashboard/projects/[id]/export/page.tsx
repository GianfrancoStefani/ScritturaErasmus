import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TimesheetExportCard } from "@/components/export/TimesheetExportCard";
import { BudgetExportCard } from "@/components/export/BudgetExportCard";
import { ExportConfigurator } from "@/components/export/ExportConfigurator";

export default async function ExportHubPage({ params }: { params: { id: string } }) {
    const project = await prisma.project.findUnique({
        where: { id: params.id },
        include: {
            partners: {
                include: {
                    users: true
                }
            },
            modules: { orderBy: { order: 'asc' }, include: { comments: { include: { user: true } } } },
            works: {
                orderBy: { startDate: 'asc' },
                include: {
                    modules: { orderBy: { order: 'asc' }, include: { comments: { include: { user: true } } } },
                    tasks: {
                        orderBy: { startDate: 'asc' },
                        include: {
                            modules: { orderBy: { order: 'asc' }, include: { comments: { include: { user: true } } } },
                            activities: {
                                orderBy: { estimatedStartDate: 'asc' },
                                include: {
                                    modules: { orderBy: { order: 'asc' }, include: { comments: { include: { user: true } } } }
                                }
                            }
                        }
                    }
                }
            },
            sections: {
                orderBy: { order: 'asc' },
                include: {
                    modules: { orderBy: { order: 'asc' }, include: { comments: { include: { user: true } } } }
                }
            }
        }
    });

    if (!project) return <div>Project not found</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 flex flex-col h-[calc(100vh-6rem)]">
            <div>
                 <Link 
                    href={`/dashboard/projects/${params.id}`} 
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-2 w-fit transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Project
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Export & Reporting</h1>
                        <p className="text-slate-500">Generate and download project reports.</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TimesheetExportCard project={project} />
                <BudgetExportCard project={project} />
            </div>

            {/* Advanced Configurator */}
            <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                 <div className="p-4 border-b border-slate-100">
                    <h2 className="font-semibold text-lg text-slate-800">Custom PDF Report Builder</h2>
                    <p className="text-slate-500 text-sm">Select content and generate a comprehensive PDF report.</p>
                 </div>
                 <div className="flex-1 min-h-0">
                    <ExportConfigurator project={project} />
                 </div>
            </div>
        </div>
    );
}
