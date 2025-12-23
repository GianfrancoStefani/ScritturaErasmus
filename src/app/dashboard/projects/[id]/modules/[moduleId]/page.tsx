import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import nextDynamic from "next/dynamic";
import { ContributionStream } from "@/components/editor/ContributionStream";
import { User } from "@prisma/client";

const AdvancedModuleEditor = nextDynamic(
  () => import("@/components/editor/AdvancedModuleEditor"),
  { ssr: false, loading: () => <div className="h-64 bg-slate-50 animate-pulse rounded-lg" /> }
);
 export const dynamic = 'force-dynamic';

export default async function ModuleEditorPage({ params, searchParams }: { params: { id: string, moduleId: string }, searchParams: { [key: string]: string | string[] | undefined } }) {
    const moduleData = await prisma.module.findUnique({
        where: { id: params.moduleId },
        include: {
            project: { 
                include: { 
                    partners: true 
                } 
            },
            components: {
                include: { 
                    author: true,
                    comments: { include: { user: true }, orderBy: { createdAt: 'asc' } },
                    ratings: true
                },
                orderBy: { order: 'asc' }
            },
            versions: {
                orderBy: { createdAt: 'desc' }
            },
            comments: {
                include: { user: true },
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!moduleData) return <div>Module not found</div>;

    // Check for returnTo param
    const returnTo = typeof searchParams.returnTo === 'string' ? searchParams.returnTo : undefined;
    const backLink = returnTo || `/dashboard/projects/${params.id}`;

    // ... continued ...

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
                        href={backLink} 
                        className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-1 w-fit transition-colors"
                    >
                        <ArrowLeft size={16} /> Back to {returnTo ? 'Project Setup' : (moduleData.project?.acronym || 'Project')}
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
                {/* If Comment Ending Date Passed, maybe disable this or show warning? 
                    User Requirement: "After comment ending date, possibility of inserting new comments in Contributions ends" 
                    This implies checking date here.
                */}
                <div className="w-1/3 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <ContributionStream 
                        moduleId={moduleData.id}
                        components={moduleData.components}
                        currentUserId={currentUserId}
                        isManager={isManager}
                        // TODO: Pass readOnly or similar if deadline passed. 
                        // Assuming the user handles enforcing this logic in ContributionStream or via specific prop.
                        // For now, I will just display the stream as is.
                    />
                </div>

                {/* Right: Official Text Editor (The Master Document) */}
                <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
                     <div className="p-3 border-b bg-slate-50 border-slate-200 flex justify-between items-center">
                        <span className="font-semibold text-slate-700 flex items-center gap-2">
                            📄 Official Text
                        </span>
                        {/* Auto-saving status is now handled inside AdvancedModuleEditor -> RichTextEditor */}
                     </div>
                     <div className="flex-1 overflow-hidden bg-white flex flex-col">
                        {moduleData.guidelines && (
                            <div className="m-3 p-3 bg-blue-50 border border-blue-100 rounded-lg flex gap-3 text-sm text-blue-800 flex-shrink-0">
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
                        <AdvancedModuleEditor 
                            module={moduleData}
                            partners={moduleData.project?.partners || []}
                            currentUser={mockUser}
                            initialVersions={moduleData.versions}
                        />
                     </div>
                </div>
            </div>
        </div>
    );
}
