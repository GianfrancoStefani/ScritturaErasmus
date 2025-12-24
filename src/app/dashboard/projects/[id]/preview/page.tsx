import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { ProjectPreviewController } from "@/components/project/ProjectPreviewController";

async function getFullProject(id: string) {
  const componentInclude = {
    include: {
      author: true,
      comments: {
        include: { user: true }
      }
    }
  };

  const moduleInclude = {
    include: {
      components: componentInclude,
      members: { include: { user: true } }
    }
  };

  return await prisma.project.findUnique({
    where: { id },
    include: {
      sections: {
        orderBy: { order: 'asc' },
        include: {
          modules: { ...moduleInclude, orderBy: { order: 'asc' } },
          works: {
            orderBy: { order: 'asc' },
            include: {
              modules: { ...moduleInclude, orderBy: { order: 'asc' } },
              tasks: {
                include: {
                  modules: { ...moduleInclude, orderBy: { order: 'asc' } },
                  activities: {
                    orderBy: { estimatedStartDate: 'asc' },
                    include: { 
                        modules: { ...moduleInclude, orderBy: { order: 'asc' } },
                        assignments: { include: { user: true } }
                    }
                  }
                }
              }
            }
          }
        }
      },
      works: {
        where: { sectionId: null },
        orderBy: { order: 'asc' },
        include: {
          modules: { ...moduleInclude, orderBy: { order: 'asc' } },
          tasks: {
            include: {
              modules: { ...moduleInclude, orderBy: { order: 'asc' } },
              activities: {
                orderBy: { estimatedStartDate: 'asc' },
                include: { 
                    modules: { ...moduleInclude, orderBy: { order: 'asc' } },
                    assignments: { include: { user: true } }
                }
              }
            }
          }
        }
      },
      modules: { 
        where: { sectionId: null, workId: null, taskId: null, activityId: null }, 
        orderBy: { order: 'asc' },
        ...moduleInclude
      }
    }
  });
}

export default async function ProjectPreviewPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const project = await getFullProject(params.id);
  if (!project) notFound();

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  return (
    <div className="min-h-screen bg-white">
      <ProjectPreviewController project={project} currentUser={user} />
    </div>
  );
}
