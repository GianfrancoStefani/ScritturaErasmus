import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

async function getUserProjects() {
   const session = await auth();
   if (!session?.user?.id) return [];

   // Fetch lightweight project list for navigation
   // Using memberships relation
   const memberships = await prisma.projectMember.findMany({
       where: { userId: session.user.id },
       include: { 
           project: {
               select: { id: true, acronym: true, title: true }
           }
       }
   });

   return memberships.map(m => m.project);
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const projects = await getUserProjects();

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <Sidebar projects={projects} />

      {/* Main Content Area */}
      <div className="main-content">
        <Header />
        <main className="dashboard-main">
          <div className="max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
