"use client";

import { useState } from "react";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { updateProjectLogo } from "@/app/actions/projects"; 
import { Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

// We need a simple action for updating just the logo, or we use a general updateProject action.
// For now, I'll assume I need to create `updateProjectLogo` or use `updateProject`. 
// I'll create `updateProjectLogo` in `src/app/actions/projects.ts` (need to check if exists).
// If not, I'll add logic here or use a server action. 

interface ProjectHeaderProps {
    project: any;
    children?: React.ReactNode;
}

export function ProjectHeader({ project, children }: ProjectHeaderProps) {
    const [logo, setLogo] = useState(project.logoUrl || "");

    const handleLogoChange = async (url: string) => {
        setLogo(url);
        // Call server action to update db
        const res = await updateProjectLogo(project.id, url);
        if (res.error) toast.error(res.error);
        else toast.success("Project logo updated");
    };

    return (
        <div className="flex flex-col gap-4">
             <Link href="/dashboard" className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-2 w-fit">
                <ArrowLeft size={16} /> Back to Dashboard
            </Link>
            
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex items-start gap-4">
                    {/* Logo Upload - Small square */}
                    <div className="w-20 h-20 flex-shrink-0">
                         <div className="w-full h-full relative group">
                            <ImageUpload 
                                value={logo} 
                                onChange={handleLogoChange} 
                                className="w-full h-full"
                                label="" 
                            /> 
                            {/* Override ImageUpload styles? It has a specific look. 
                                Ideally ImageUpload is generic. My implementation was generic. 
                                Pass className to control size.
                            */}
                         </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded text-sm">{project.acronym}</span>
                            <span className="text-slate-400 text-xs flex items-center gap-1">
                                <Calendar size={12} /> {project.startDate ? format(new Date(project.startDate), 'MMM yyyy') : 'N/A'} - {project.endDate ? format(new Date(project.endDate), 'MMM yyyy') : 'N/A'}
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900">{project.title}</h1>
                    </div>
                </div>
                
                <div className="flex gap-2 flex-wrap">
                     {children}
                </div>
            </div>
        </div>
    )
}
