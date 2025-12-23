import prisma from "@/lib/prisma";
import { ExportConfigurator } from "@/components/export/ExportConfigurator";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function ExportSetupPage({ params }: { params: { id: string } }) {
    const project = await prisma.project.findUnique({
        where: { id: params.id },
        include: {
            partners: true,
            modules: { 
                include: { 
                    comments: { include: { user: true } } 
                },
                orderBy: { order: 'asc' }
            },
            works: {
                include: {
                    modules: { 
                        include: { comments: { include: { user: true } } },
                        orderBy: { order: 'asc' }
                    },
                    tasks: {
                        include: {
                            modules: { 
                                include: { comments: { include: { user: true } } },
                                orderBy: { order: 'asc' }
                            },
                            activities: {
                                include: {
                                    modules: {
                                         include: { comments: { include: { user: true } } },
                                         orderBy: { order: 'asc' }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: { order: 'asc' }
            }
        }
    });

    if (!project) return <div>Project not found</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)]">
            <div className="mb-4">
                <Link 
                    href={`/dashboard/projects/${params.id}`} 
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-2 w-fit"
                >
                    <ArrowLeft size={16} /> Back to Project
                </Link>
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-slate-900">PDF Export Setup</h1>
                    <div className="text-sm text-slate-500">Configure your document structure</div>
                </div>
            </div>

            <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <ExportConfigurator project={project} />
            </div>
        </div>
    );
}
