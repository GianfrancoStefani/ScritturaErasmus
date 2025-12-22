import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import nextDynamic from "next/dynamic";
import { ContributionStream } from "@/components/editor/ContributionStream";
import { User } from "@prisma/client";

const RichTextEditor = nextDynamic(
  () => import("@/components/editor/RichTextEditor").then((mod) => mod.RichTextEditor),
  { ssr: false, loading: () => <div className="h-64 bg-slate-50 animate-pulse rounded-lg" /> }
);
 export const dynamic = 'force-dynamic';

export default async function ModuleEditorPage({ params }: { params: { id: string, moduleId: string } }) {
    const moduleData = await prisma.module.findUnique({
        where: { id: params.moduleId },
        include: {
            project: { select: { title: true, acronym: true } },
            components: {
                include: { 
                    author: true,
                    comments: { include: { user: true }, orderBy: { createdAt: 'asc' } },
                    ratings: true
                },
                orderBy: { order: 'asc' } // or createdAt desc
            }
        }
    });

    if (!moduleData) return <div>Module not found</div>;

    // MOCK AUTH: Get the first user found in the DB, preferably from this project
    // In a real app, this comes from session
    const mockUser = await prisma.user.findFirst({
        where: { partner: { projectId: moduleData.projectId || undefined } } // Try to get project user
    }) || await prisma.user.findFirst();

    const currentUserId = mockUser?.id || "unknown";
    const isManager = mockUser?.role === "Coordinator" || mockUser?.role === "Project Manager" || true; // Force true for demo

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)]">
             <div className="mb-4 flex-shrink-0 flex justify-between items-center">
                <div>
                    <Link 
                        href={`/dashboard/projects/${params.id}`} 
                        className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-1 w-fit transition-colors"
                    >
                        <ArrowLeft size={16} /> Back to {moduleData.project?.acronym || 'Project'}
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        {moduleData.title}
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs font-normal text-slate-500 border border-slate-200">
                            {moduleData.officialText ? "Drafting" : "Empty"}
                        </span>
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    {mockUser && (
                        <div className="text-xs text-slate-500 bg-amber-50 border border-amber-200 px-2 py-1 rounded">
                            Simulated User: <b>{mockUser.name} {mockUser.surname}</b> ({mockUser.role})
                        </div>
                    )}
                </div>
             </div>

            <div className="flex-1 min-h-0 flex gap-4">
                {/* Left: Contribution Stream */}
                <div className="w-1/3 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <ContributionStream 
                        moduleId={moduleData.id}
                        components={moduleData.components}
                        currentUserId={currentUserId}
                        isManager={isManager}
                    />
                </div>

                {/* Right: Official Text Editor (The Master Document) */}
                <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
                     <div className="p-3 border-b bg-slate-50 border-slate-200 flex justify-between items-center">
                        <span className="font-semibold text-slate-700 flex items-center gap-2">
                            📄 Official Text
                        </span>
                        <span className="text-xs text-slate-400">
                            Auto-saving...
                        </span>
                     </div>
                     <div className="flex-1 overflow-y-auto bg-white">
                        {moduleData.guidelines && (
                            <div className="m-3 p-3 bg-blue-50 border border-blue-100 rounded-lg flex gap-3 text-sm text-blue-800">
                                <div className="flex-shrink-0 mt-0.5">
                                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="space-y-1">
                                    <p className="font-semibold">Guidelines from Funding Body</p>
                                    <p className="text-blue-700/80 whitespace-pre-wrap">{moduleData.guidelines}</p>
                                </div>
                            </div>
                        )}
                        <RichTextEditor 
                            moduleId={moduleData.id} 
                            initialContent={moduleData.officialText || ""} 
                            maxChars={moduleData.maxChars || undefined}
                        />
                     </div>
                </div>
            </div>
        </div>
    );
}
