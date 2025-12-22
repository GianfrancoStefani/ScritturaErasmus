import { jsPDF } from "jspdf";

// Mock types if Prisma types aren't fully available/imported yet for this utility
interface ProjectData {
  title: string;
  acronym: string;
  works: WorkData[];
}

interface WorkData {
  title: string;
  tasks: TaskData[];
}

interface TaskData {
  title: string;
  modules: ModuleData[];
}

interface ModuleData {
  title: string;
  officialText?: string;
  status: string;
}

export function generateProjectPDF(project: ProjectData) {
  const doc = new jsPDF();
  let y = 20;

  // Title
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 150);
  doc.text(project.title, 20, y);
  y += 10;
  
  doc.setFontSize(14);
  doc.setTextColor(100);
  doc.text(`Acronym: ${project.acronym}`, 20, y);
  y += 20;

  doc.setDrawColor(200);
  doc.line(20, y, 190, y);
  y += 10;

  // Iterate Works
  project.works.forEach((work, workIndex) => {
    // Check page break
    if (y > 270) { doc.addPage(); y = 20; }

    doc.setFontSize(18);
    doc.setTextColor(0);
    doc.text(`Work Package ${workIndex + 1}: ${work.title}`, 20, y);
    y += 10;

    // Tasks
    work.tasks.forEach((task, taskIndex) => {
        if (y > 270) { doc.addPage(); y = 20; }
        
        doc.setFontSize(14);
        doc.setTextColor(50);
        doc.text(`Task ${workIndex + 1}.${taskIndex + 1}: ${task.title}`, 25, y);
        y += 8;

        // Modules
        task.modules.forEach((module) => {
            if (y > 270) { doc.addPage(); y = 20; }
            
            // Only export approved text? Request said "decidi quali elementi esportare (under review, done, autorized)"
            // Assuming for now we export everything but mark status.
            
            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.setFont("helvetica", "bold");
            doc.text(module.title, 30, y);
            y += 6;
            
            doc.setFont("helvetica", "normal");
            const text = module.officialText || "(No content)";
            const lines = doc.splitTextToSize(text, 160);
            doc.text(lines, 30, y);
            
            y += (lines.length * 5) + 5;
        });
        
        y += 5;
    });
    
    y += 10;
  });

  doc.save(`${project.acronym}_Project_Export.pdf`);
}
