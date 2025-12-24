"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Copy, Eye } from "lucide-react";
import { TemplatePreviewModal } from "./TemplatePreviewModal";

interface TemplateGalleryProps {
    templates: any[];
}

export function TemplateGallery({ templates }: TemplateGalleryProps) {
    const [previewTemplate, setPreviewTemplate] = useState<{ id: string, title: string } | null>(null);

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map(template => (
                    <div key={template.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-indigo-300 transition-colors group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <Copy size={20} />
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all rounded-lg"
                                onClick={() => setPreviewTemplate({ id: template.id, title: template.title })}
                            >
                                <Eye size={18} className="mr-2" />
                                Preview
                            </Button>
                        </div>
                        
                        <h3 className="font-semibold text-lg text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">
                            {template.title}
                        </h3>
                        <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                             {template.titleEn || template.title}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-slate-400 mb-6">
                            <span>{template._count.works} Work Packages</span>
                            <span>{template._count.modules} Modules</span>
                        </div>

                        <Link href={`/dashboard/projects/new?templateId=${template.id}`} className="block w-full">
                            <Button className="w-full" variant="outline">
                                Use Template
                            </Button>
                        </Link>
                    </div>
                ))}

                {templates.length === 0 && (
                     <div className="col-span-full text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <p className="text-slate-500 mb-2">No templates saved yet.</p>
                        <p className="text-sm text-slate-400">Save a project as a template to see it here.</p>
                     </div>
                )}
            </div>

            <TemplatePreviewModal 
                isOpen={!!previewTemplate}
                onClose={() => setPreviewTemplate(null)}
                templateId={previewTemplate?.id || ""}
                title={previewTemplate?.title || ""}
            />
        </>
    );
}
