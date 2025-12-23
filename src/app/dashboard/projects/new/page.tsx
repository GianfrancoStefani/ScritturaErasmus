"use client";

import { Card } from "@/components/ui/Card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ProjectForm } from "@/components/dashboard/ProjectForm";

export default function NewProjectPage({ searchParams }: { searchParams: { templateId?: string } }) {
  const { templateId } = searchParams;
  return (
    <div className="max-w-2xl mx-auto py-8">
      <Link href="/dashboard" className="flex items-center text-slate-500 hover:text-slate-800 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </Link>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
            {templateId ? "Create from Template" : "Create New Project"}
        </h1>
        <p className="text-slate-500 mt-2">Start a new Erasmus+ or Horizon application.</p>
        
        {templateId && (
            <div className="mt-4 bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-3 rounded-md text-sm flex items-center gap-2">
                <span>Projects created from this template will inherit its structure (Work Packages, Sections, Modules) and guidelines.</span>
            </div>
        )}
      </div>

      <Card>
          <ProjectForm templateId={templateId} />
      </Card>
    </div>
  );
}
