import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { 
    FileDown, 
    FileSpreadsheet, 
    History, 
    ArrowLeft,
    FileText,
    Users,
    Settings
} from "lucide-react";
import Link from "next/link";
import { ExcelTools } from "@/components/project/ExcelTools";
import { VersionHistory } from "@/components/project/VersionHistory";
import { PDFExportButton } from "@/components/export/PDFExportButton";

export default async function ProjectToolsPage({ params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const project = await prisma.project.findUnique({
        where: { id: params.id },
        include: {
            partners: {
                include: {
                    projectMembers: {
                        include: { user: true }
                    }
                }
            },
            sections: {
                orderBy: { order: 'asc' },
                include: {
                    modules: { orderBy: { order: 'asc' } },
                    works: {
                        orderBy: { startDate: 'asc' },
                        include: {
                            modules: { orderBy: { order: 'asc' } },
                            tasks: {
                                orderBy: { startDate: 'asc' },
                                include: {
                                    modules: { orderBy: { order: 'asc' } },
                                    activities: {
                                        orderBy: { estimatedStartDate: 'asc' },
                                        include: { modules: { orderBy: { order: 'asc' } } }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            works: {
                where: { sectionId: null },
                orderBy: { startDate: 'asc' },
                include: {
                    modules: { orderBy: { order: 'asc' } },
                    tasks: {
                        orderBy: { startDate: 'asc' },
                        include: {
                            modules: { orderBy: { order: 'asc' } },
                            activities: {
                                orderBy: { estimatedStartDate: 'asc' },
                                include: { modules: { orderBy: { order: 'asc' } } }
                            }
                        }
                    }
                }
            },
            modules: {
                where: { sectionId: null, workId: null, taskId: null },
                orderBy: { order: 'asc' }
            }
        }
    });

    if (!project) redirect("/dashboard/projects");

    // Flatten all modules for the simple PDF exporter
    const flattenedModules: any[] = [];
    
    // Top level
    project.modules?.forEach((m: any) => flattenedModules.push(m));

    project.sections.forEach((s: any) => {
        s.modules?.forEach((m: any) => flattenedModules.push(m));
        s.works.forEach((w: any) => {
            w.modules?.forEach((m: any) => flattenedModules.push(m));
            w.tasks?.forEach((t: any) => {
                t.modules?.forEach((m: any) => flattenedModules.push(m));
                t.activities?.forEach((a: any) => {
                    a.modules?.forEach((m: any) => flattenedModules.push(m));
                });
            });
        });
    });
    project.works.forEach((w: any) => {
        w.modules?.forEach((m: any) => flattenedModules.push(m));
        w.tasks?.forEach((t: any) => {
             t.modules?.forEach((m: any) => flattenedModules.push(m));
             t.activities?.forEach((a: any) => {
                a.modules?.forEach((m: any) => flattenedModules.push(m));
             });
        });
    });

    const pdfPartners = project.partners.map((p: any) => ({
        name: p.name,
        country: p.nation || "N/A",
        role: p.role,
        city: p.city,
        type: p.type,
        budget: p.budget,
        team: p.projectMembers?.map((m: any) => ({
            name: `${m.user.name} ${m.user.surname}`,
            role: m.projectRole || m.role
        }))
    }));

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <Link 
                href={`/dashboard/projects/${project.id}`} 
                className="flex items-center text-slate-500 hover:text-slate-800 mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to {project.acronym || "Project"}
            </Link>

            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                    <Settings className="text-indigo-600" />
                    Project Tools & Exports
                </h1>
                <p className="text-slate-500 mt-2">
                    Manage project versions, export to various formats, and import external data.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* PDF Export Section */}
                <Card className="p-6 transition-all hover:shadow-md">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                            <FileDown size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">PDF Document</h2>
                            <p className="text-sm text-slate-500">Generate a professional PDF for submission or review.</p>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg mb-4 text-xs text-slate-600 space-y-1">
                        <p>• Includes Project Structure & WPs</p>
                        <p>• Includes Partnership & Team Roles</p>
                        <p>• Custom themes and cover page</p>
                    </div>
                    <PDFExportButton 
                        project={project} 
                        partners={pdfPartners}
                        modules={flattenedModules}
                    />
                </Card>

                {/* Excel Section */}
                <Card className="p-6 transition-all hover:shadow-md">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                            <FileSpreadsheet size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Excel / CVS</h2>
                            <p className="text-sm text-slate-500">Export structure to Excel for budgeting and calculations.</p>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg mb-4 text-xs text-slate-600 space-y-1">
                        <p>• Full structure export (.xlsx)</p>
                        <p>• Partnership contacts list</p>
                        <p>• Import basic info back from Excel</p>
                    </div>
                    <div className="flex gap-2">
                        <ExcelTools projectId={project.id} />
                        <span className="text-xs text-slate-400 self-center ml-2">Click icons to export/import</span>
                    </div>
                </Card>

                {/* Versioning Section */}
                <Card className="p-6 transition-all hover:shadow-md md:col-span-2">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                            <History size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Project Snapshots</h2>
                            <p className="text-sm text-slate-500">Create point-in-time backups and restore them if needed.</p>
                        </div>
                    </div>
                    <div className="bg-amber-50/50 p-4 rounded-lg mb-4 text-xs text-amber-800 border border-amber-100 italic">
                        "Snapshots allow you to experiment with structures and revert back easily. 
                        Useful before major revisions or importing external data."
                    </div>
                    <div className="flex items-center gap-4">
                        <VersionHistory projectId={project.id} />
                        <p className="text-sm text-slate-600 font-medium">Open Snapshot History</p>
                    </div>
                </Card>

                {/* Partnership Overview Tool (Quick View) */}
                <Card className="p-6 transition-all hover:shadow-md md:col-span-2 border-dashed border-slate-200 bg-slate-50/30">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Users size={24} />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-slate-800">Partnership Overview</h2>
                            <p className="text-sm text-slate-500 mb-4">Manage your project partners and internal team roles.</p>
                            <Link 
                                href={`/dashboard/projects/${project.id}/partners`}
                                className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 group"
                            >
                                Open Partnership Management
                                <ArrowLeft className="w-4 h-4 ml-1 rotate-180 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
