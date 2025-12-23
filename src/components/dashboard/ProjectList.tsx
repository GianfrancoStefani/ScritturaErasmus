"use client";

import { useMemo, useState } from "react";
import { ProjectCard } from "./ProjectCard";
import { Search, Filter, Calendar } from "lucide-react";
import clsx from "clsx";
import { isAfter, isBefore, isWithinInterval } from "date-fns";

type ProjectStatus = 'ALL' | 'ACTIVE' | 'FUTURE' | 'COMPLETED';

export function ProjectList({ projects, currentUserId }: { projects: any[], currentUserId?: string }) {
    const [statusFilter, setStatusFilter] = useState<ProjectStatus>('ALL');
    const [searchQuery, setSearchQuery] = useState("");

    const filteredProjects = useMemo(() => {
        return projects.filter(project => {
            // Text Search
            const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  project.acronym.toLowerCase().includes(searchQuery.toLowerCase());
            
            if (!matchesSearch) return false;

            // Status Filter
            const now = new Date();
            const start = new Date(project.startDate);
            const end = new Date(project.endDate);

            if (statusFilter === 'ACTIVE') {
                return isWithinInterval(now, { start, end });
            }
            if (statusFilter === 'FUTURE') {
                return isBefore(now, start);
            }
            if (statusFilter === 'COMPLETED') {
                return isAfter(now, end);
            }

            return true;
        });
    }, [projects, statusFilter, searchQuery]);

    const tabs: { id: ProjectStatus; label: string }[] = [
        { id: 'ALL', label: 'All Projects' },
        { id: 'ACTIVE', label: 'Active' },
        { id: 'FUTURE', label: 'In Development / Future' },
        { id: 'COMPLETED', label: 'Completed' },
    ];

    return (
        <div className="space-y-6">
            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex bg-slate-100 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id)}
                            className={clsx(
                                "px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap",
                                statusFilter === tab.id 
                                    ? "bg-white text-indigo-600 shadow-sm" 
                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search projects..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                {filteredProjects.length > 0 ? (
                    filteredProjects.map(project => (
                        <ProjectCard key={project.id} project={project} />
                    ))
                ) : (
                    <div className="text-center py-12 text-slate-400">
                        No projects found matching your filters.
                    </div>
                )}
            </div>
        </div>
    );
}
