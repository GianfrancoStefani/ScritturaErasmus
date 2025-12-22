import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import ModuleEditorWrapper from "@/components/editor/ModuleEditorWrapper";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function ModulePage({ params }: { params: { id: string, moduleId: string } }) {
  const moduleData = await prisma.module.findUnique({
    where: { id: params.moduleId }
  });

  if (!moduleData) notFound();

  return (
    <div className="p-6">
       <Link href={`/dashboard/projects/${params.id}`} className="flex items-center text-slate-500 hover:text-slate-800 mb-6 w-fit">
           <ArrowLeft size={16} className="mr-2" /> Back to Project
       </Link>
       
       <ModuleEditorWrapper module={moduleData} />
    </div>
  );
}
