"use client";

import { createProject } from "@/app/actions/createProject";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewProjectPage() {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <Link href="/dashboard" className="flex items-center text-slate-500 hover:text-slate-800 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </Link>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
            Create New Project
        </h1>
        <p className="text-slate-500 mt-2">Start a new Erasmus+ or Horizon application.</p>
      </div>

      <Card>
        <form action={createProject} className="space-y-6">
            <div className="space-y-4">
                <Input name="title" label="Project Title" placeholder="e.g. Digital Education for All" required />
                <div className="grid grid-cols-2 gap-4">
                    <Input name="acronym" label="Acronym" placeholder="DIGI-EDU" required />
                    <Input name="nationalAgency" label="National Agency" placeholder="IT02" required />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <Input name="startDate" type="date" label="Start Date" required />
                    <Input name="duration" type="number" label="Duration (Months)" placeholder="24" min="12" max="36" required />
                </div>
                
                <Input name="language" label="Submission Language" placeholder="English" defaultValue="English" />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <Link href="/dashboard">
                    <Button type="button" variant="ghost">Cancel</Button>
                </Link>
                <Button type="submit">Create Project</Button>
            </div>
        </form>
      </Card>
    </div>
  );
}
