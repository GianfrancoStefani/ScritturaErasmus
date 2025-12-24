"use client";

import { useState, useEffect } from "react";
import { getProjectStructure } from "@/app/actions/project-structure";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { AssignmentManager } from "@/components/common/AssignmentManager";
import { Loader2, Layers, Briefcase, CheckSquare, Activity } from "lucide-react";
import { 
    Accordion, 
    AccordionItem, 
    AccordionTrigger, 
    AccordionContent 
} from "@/components/ui/Accordion";

export default function QuickAssignmentPage({ params }: { params: { id: string } }) {
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
             const data = await getProjectStructure(params.id);
             setProject(data);
             setLoading(false);
        }
        load();
    }, [params.id]);

    if(loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;
    if(!project) return <div className="p-10">Project not found</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto pb-40">
            <h1 className="text-3xl font-black text-slate-900 mb-2">Quick Assignments</h1>
            <p className="text-slate-500 mb-8">Rapidly assign team members to various project components.</p>
            
            <Tabs defaultValue="works" className="space-y-6">
                <TabsList className="bg-slate-100 p-1 rounded-xl">
                    <TabsTrigger value="sections" className="gap-2"><Layers size={14}/> Sections</TabsTrigger>
                    <TabsTrigger value="works" className="gap-2"><Briefcase size={14}/> Work Packages</TabsTrigger>
                    <TabsTrigger value="tasks" className="gap-2"><CheckSquare size={14}/> Tasks</TabsTrigger>
                    <TabsTrigger value="activities" className="gap-2"><Activity size={14}/> Activities</TabsTrigger>
                </TabsList>
                
                {/* SECTIONS */}
                <TabsContent value="sections">
                    <div className="space-y-6">
                        {project.sections.map((s: any) => (
                            <div key={s.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="font-bold text-lg mb-4 text-indigo-700 flex items-center gap-2">
                                    <Layers size={20} /> {s.title}
                                </h3>
                                <AssignmentManager 
                                    entityId={s.id} 
                                    entityType="SECTION" 
                                    projectId={project.id} 
                                    partners={s.partners} 
                                />
                            </div>
                        ))}
                    </div>
                </TabsContent>

                {/* WORK PACKAGES */}
                <TabsContent value="works">
                     <div className="space-y-6">
                        {project.works.map((w: any) => (
                            <div key={w.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="font-bold text-lg mb-4 text-slate-800 flex items-center gap-2">
                                    <Briefcase size={20} /> {w.title}
                                </h3>
                                <AssignmentManager 
                                    entityId={w.id} 
                                    entityType="WORK" 
                                    projectId={project.id} 
                                    partners={w.partners} 
                                />
                            </div>
                        ))}
                    </div>
                </TabsContent>

                {/* TASKS (Grouped by WP) */}
                <TabsContent value="tasks">
                    <Accordion type="multiple" className="space-y-4">
                        {project.works.map((w: any) => (
                             <AccordionItem key={w.id} value={w.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden px-4">
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <span className="font-bold text-slate-700">{w.title}</span>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 pb-6 space-y-8 border-t border-slate-100">
                                    {w.tasks.map((t: any) => (
                                        <div key={t.id} className="pl-4 border-l-2 border-slate-200">
                                            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                                <CheckSquare size={16} className="text-slate-400" /> {t.title}
                                            </h4>
                                            <AssignmentManager 
                                                entityId={t.id} 
                                                entityType="TASK" 
                                                projectId={project.id} 
                                                partners={t.partners} 
                                            />
                                        </div>
                                    ))}
                                    {w.tasks.length === 0 && <p className="text-sm italic text-slate-400">No tasks in this Work Package.</p>}
                                </AccordionContent>
                             </AccordionItem>
                        ))}
                    </Accordion>
                </TabsContent>

                {/* ACTIVITIES (Grouped by WP -> Task) */}
                <TabsContent value="activities">
                    <Accordion type="multiple" className="space-y-4">
                        {project.works.map((w: any) => (
                             <AccordionItem key={w.id} value={w.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden px-4">
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <span className="font-bold text-slate-700">{w.title}</span>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 pb-6 space-y-8 border-t border-slate-100">
                                    {w.tasks.map((t: any) => (
                                        <div key={t.id} className="space-y-6">
                                            <div className="bg-slate-50 p-2 rounded">
                                                <h4 className="font-bold text-xs uppercase text-slate-500">{t.title}</h4>
                                            </div>
                                            {t.activities.map((act: any) => (
                                                 <div key={act.id} className="pl-4 border-l-2 border-indigo-200 ml-2">
                                                    <h5 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                                        <Activity size={16} className="text-indigo-500" /> {act.title}
                                                    </h5>
                                                    <AssignmentManager 
                                                        entityId={act.id} 
                                                        entityType="ACTIVITY" 
                                                        projectId={project.id} 
                                                        // Activity partners might need fetching differently if standardized
                                                        partners={[]} 
                                                    />
                                                </div>
                                            ))}
                                            {t.activities.length === 0 && <p className="pl-4 text-xs text-slate-400">No activities.</p>}
                                        </div>
                                    ))}
                                </AccordionContent>
                             </AccordionItem>
                        ))}
                    </Accordion>
                </TabsContent>
            </Tabs>
        </div>
    );
}
