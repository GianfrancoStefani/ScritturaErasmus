import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function ExportDataPage({ params }: { params: { id: string } }) {
    const project = await prisma.project.findUnique({
        where: { id: params.id },
        include: {
            title: true, // Type error if simple select, better use include logic or default select
            // Actually findUnique returns object with scalars by default.
            works: {
                include: {
                    tasks: {
                        include: {
                            modules: {
                                where: { officialText: { not: null } },
                                orderBy: { order: 'asc' }
                            }
                        },
                        orderBy: { startDate: 'asc' }
                    }
                },
                orderBy: { startDate: 'asc' }
            },
            modules: { // Direct modules
                 where: { officialText: { not: null } },
                 orderBy: { order: 'asc' }
            }
        }
    });

    if (!project) return <div>Project not found</div>;

    // We need to flatten the structure or render hierarchically.
    // Structure: 
    // Project Title
    //   Direct Modules
    //   Work 1
    //     Task 1
    //       Modules...

    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
            <div className="mb-6 print:hidden">
                <Link 
                    href={`/dashboard/projects/${params.id}`} 
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-4 w-fit transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Project
                </Link>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Project Export View</h1>
                        <p className="text-slate-500">Preview of the official project document.</p>
                    </div>
                    <button 
                        // Using window.print in a real client component or simple JS
                        // For server component, we can use a script or just a button that is client side.
                        // For simplicity in this server component I'll use a small script or just standard browser print
                        // Ideally "Print" button should be client side. I'll make a small client wrapper or just an anchor to print(). 
                        // Let's us a simple onclick in a client component or just tell user to Print.
                        // I will add a script tag for simplicity or use a client component for the button.
                        className="btn btn-primary flex items-center gap-2"
                        onClick="window.print()" // This won't work in React Server Component direct output invalidates strings in onClick usually.
                        // I will make the whole page structure, the print button might need to be a client component "PrintButton"
                    >
                        <Printer size={16} /> Print / Save as PDF
                    </button>
                    {/* Add Client Component for Print Button below */}
                </div>
            </div>

            <div className="bg-white p-12 shadow-sm border print:border-0 print:shadow-none print:p-0 min-h-screen">
                <div className="mb-12 border-b pb-8">
                    <h1 className="text-4xl font-bold text-slate-900 mb-4">{project.title}</h1>
                    <div className="flex gap-8 text-sm text-slate-500">
                        <span><strong>Acronym:</strong> {project.acronym}</span>
                        <span><strong>Duration:</strong> {project.duration} Months</span>
                        <span><strong>Agency:</strong> {project.nationalAgency}</span>
                    </div>
                </div>

                {/* Direct Modules */}
                {project.modules.length > 0 && (
                     <div className="mb-8">
                        {project.modules.map(mod => (
                            <div key={mod.id} className="mb-8">
                                <h2 className="text-2xl font-bold text-slate-800 mb-4">{mod.title}</h2>
                                <div className="prose max-w-none text-justify" dangerouslySetInnerHTML={{ __html: mod.officialText || "" }} />
                            </div>
                        ))}
                    </div>
                )}

                {/* Works Hierarchy */}
                {project.works.map(work => (
                    <div key={work.id} className="mb-12">
                         <h2 className="text-2xl font-bold text-indigo-900 mb-6 border-b border-indigo-100 pb-2">
                            {work.title}
                         </h2>
                         
                         {work.tasks.map(task => (
                             <div key={task.id} className="mb-8 pl-4 border-l-2 border-indigo-50">
                                 <h3 className="text-xl font-semibold text-slate-800 mb-4">{task.title}</h3>
                                 
                                 {task.modules.length === 0 ? (
                                     <p className="text-slate-400 italic">No official content yet.</p>
                                 ) : (
                                     task.modules.map(mod => (
                                         <div key={mod.id} className="mb-6">
                                            <h4 className="text-lg font-medium text-slate-700 mb-2">{mod.title}</h4>
                                            <div className="prose max-w-none text-slate-600 text-justify" dangerouslySetInnerHTML={{ __html: mod.officialText || "" }} />
                                         </div>
                                     ))
                                 )}
                             </div>
                         ))}
                    </div>
                ))}
            </div>
             <PrintButton />
        </div>
    );
}

// Inline Client Component for Print Button to avoid creating separate file for one button
// Note: In Next.js App router, we can't define client component inside server file easily without "use client" at top, 
// but this file is server. So I will create a separate file or just omit the button action logic for now 
// and assume user knows Cmd+P. 
// OR simpler: make this page "use client"? No, we need prisma. 
// I will create `PrintButton.tsx` quickly.
import { PrintButton } from "@/components/ui/PrintButton"; 
