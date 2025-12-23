"use client";

import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Users, Calendar, Coins } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useState, Fragment } from "react";

export function WorksTable({ projects }: { projects: any[] }) {
    const [showDetails, setShowDetails] = useState(false);

    return (
        <div className="card p-0 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h2 className="font-semibold text-slate-800">Budget Breakdown by Project</h2>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-slate-500 hover:text-indigo-600"
                >
                    {showDetails ? (
                        <>
                            <EyeOff size={16} className="mr-2" /> Hide Details
                        </>
                    ) : (
                        <>
                            <Eye size={16} className="mr-2" /> Show Quick View
                        </>
                    )}
                </Button>
            </div>
            <div className="table-container border-0 shadow-none rounded-none">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Project</th>
                            <th>Acronym</th>
                            <th className="text-center">Work Packages</th>
                            <th className="text-right">Allocated Budget</th>
                            <th className="text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map((project) => {
                             const projectAllocated = project.works.reduce((acc: number, w: any) => acc + w.budget, 0);
                             
                             return (
                                <Fragment key={project.id}>
                                    <tr className={showDetails ? "bg-slate-50/30 border-b-0" : ""}>
                                        <td className="font-medium">
                                            {project.title}
                                            {showDetails && (
                                                <div className="mt-2 text-xs text-slate-500 space-y-1 animate-in slide-in-from-top-1">
                                                    {project.deadline && (
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar size={12} /> 
                                                            Deadline: {new Date(project.deadline).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                    {project.partners.length > 0 && (
                                                        <div className="flex items-center gap-1.5">
                                                            <Users size={12} /> 
                                                            {project.partners.length} Partners
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="align-top">
                                            <span className="px-2 py-1 rounded text-xs font-bold bg-slate-100 text-slate-600">
                                                {project.acronym}
                                            </span>
                                        </td>
                                        <td className="text-center align-top">{project.works.length}</td>
                                        <td className="text-right font-mono text-slate-700 align-top">€{projectAllocated.toLocaleString()}</td>
                                        <td className="text-right align-top">
                                            <Link href={`/dashboard/projects/${project.id}`}>
                                                <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                                                    Manage <ArrowRight size={14} className="ml-1" />
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                    {showDetails && (
                                        <tr className="bg-slate-50/30 border-t-0">
                                            <td colSpan={5} className="pt-0 pb-4 px-4">
                                                <div className="pl-4 border-l-2 border-indigo-200 ml-1">
                                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Partners:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {project.partners.length > 0 ? project.partners.map((p: any) => (
                                                            <span key={p.id} className="text-xs bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600" title={p.name}>
                                                                {p.name} ({p.nation})
                                                            </span>
                                                        )) : (
                                                            <span className="text-xs text-slate-400 italic">No partners yet</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                             );
                        })}
                        {projects.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-slate-400">
                                    No active projects found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
