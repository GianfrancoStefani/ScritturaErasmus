"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, Calendar, Globe, Building2, ArrowRight, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ProjectForm } from "./ProjectForm";
import { deleteProject } from "@/app/actions/deleteProject";

interface ProjectCardProps {
    project: any;
}

export function ProjectCard({ project }: ProjectCardProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    
    // Delete Logic
    const [deleteStep, setDeleteStep] = useState(0); // 0: Idle, 1: Confirm

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (deleteStep === 0) {
            setDeleteStep(1);
        } else {
            await deleteProject(project.id);
            setDeleteStep(0);
        }
    };

    const cancelDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteStep(0);
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-indigo-200 hover:shadow-md">
            {/* Header / Summary Row */}
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="p-4 flex items-center justify-between cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-4 flex-1">
                    <div className="h-10 w-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                        {project.acronym.substring(0, 3).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">{project.title}</h3>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                             <span className="font-semibold text-indigo-600">{project.acronym}</span>
                             <span>•</span>
                             <span className="flex items-center gap-1"><Calendar size={12} /> {format(new Date(project.startDate), 'dd/MM/yyyy')} - {format(new Date(project.endDate), 'dd/MM/yyyy')}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="hidden sm:inline-flex text-xs font-medium px-2 py-1 bg-slate-100 rounded text-slate-600">
                        {project.modules.length} Modules
                    </span>
                    
                    {/* Actions Group - Prevent propagation to not toggle card */}
                    <div className="flex items-center gap-1 mr-2 bg-white rounded-lg border border-slate-200 p-1">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsEditOpen(true); }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
                            title="Edit Project"
                        >
                            <Edit size={16} />
                        </button>
                        <div className="w-[1px] h-4 bg-slate-200 mx-0.5"></div>
                        
                        {deleteStep === 0 ? (
                            <button 
                                onClick={handleDelete}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                                title="Delete Project"
                            >
                                <Trash2 size={16} />
                            </button>
                        ) : (
                             <div className="flex items-center gap-1 animate-fade-in">
                                 <button 
                                     onClick={handleDelete}
                                     className="px-2 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded hover:bg-red-700"
                                 >
                                     CONFIRM
                                 </button>
                                 <button 
                                     onClick={cancelDelete}
                                     className="p-1 text-slate-400 hover:text-slate-600"
                                     title="Cancel"
                                 >
                                    X
                                 </button>
                             </div>
                        )}
                    </div>

                    <button className="text-slate-400 hover:text-indigo-600">
                        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                </div>
            </div>

            {/* Expanded Details */}
            {isOpen && (
                <div className="p-6 border-t border-slate-100 bg-white animation-slide-down">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        <DetailItem label="Project Title (English)" value={project.titleEn} />
                        <DetailItem label="Acronym" value={project.acronym} />
                        <DetailItem label="Duration" value={`${project.duration} Months`} />
                        <DetailItem label="Start Date" value={format(new Date(project.startDate), 'dd/MM/yyyy')} />
                        <DetailItem label="End Date" value={format(new Date(project.endDate), 'dd/MM/yyyy')} />
                         <DetailItem label="National Agency" value={project.nationalAgency} icon={<Building2 size={14} />} />
                        <DetailItem label="Language" value={project.language} icon={<Globe size={14} />} />
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <Link href={`/dashboard/projects/${project.id}`}>
                            <Button className="bg-indigo-600 hover:bg-indigo-700">
                                Open Project Dashboard <ArrowRight size={16} className="ml-2" />
                            </Button>
                        </Link>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Project">
                <ProjectForm project={project} isEdit onClose={() => setIsEditOpen(false)} />
            </Modal>
        </div>
    );
}

function DetailItem({ label, value, icon }: { label: string, value: string | number, icon?: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                {icon} {label}
            </p>
            <p className="text-sm font-medium text-slate-900">{value || "N/A"}</p>
        </div>
    )
}
