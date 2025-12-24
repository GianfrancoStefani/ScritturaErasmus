import { CheckCircle2, Lock, Users, AlertCircle, Layers, GitMerge, Move, Bell } from "lucide-react";

export type Feature = {
    title: string;
    longDesc: string;
    color: string;      // Tailwind classes for gradient/bg
    lightColor: string; // Tailwind bg for icon circle
    details: string[];
}

export const features: Feature[] = [
    {
        title: "Matrix Hierarchy Engine",
        color: "bg-gradient-to-br from-indigo-600 to-violet-700",
        lightColor: "bg-indigo-100",
        longDesc: "Traditional project management tools force you into a flat list of tasks. Erasmus+ & Horizon Europe projects are deep, complex hierarchies. Our Matrix Engine allows you to model this reality perfectly.",
        details: [
            "Infinite Nesting: Create Sections within Sections, down to any depth.", 
            "Strict Budget Aggregation: Costs ripple up from Modules to Work Packages automatically.", 
            "Drag & Drop Restructuring: Move entire branches of your project tree instantly.", 
            "Container Logic: Work Packages behave like real EU deliverables."
        ]
    },
    {
        title: "Warp Speed Workflow",
        color: "bg-gradient-to-br from-indigo-500 to-blue-600",
        lightColor: "bg-blue-100",
        longDesc: "Forget about chasing partners for status updates via email. The platform enforces a rigorous state-machine workflow for every single content module.",
        details: [
            "State Enforcement: Draft -> Completed -> Validated -> Authorized.", 
            "Validation Gates: A module cannot be submitted until the Coordinator explicitly validates it.", 
            "Audit Trails: See exactly who changed a status and when.", 
            "Visual Progress: Track completion percentages across the entire consortium."
        ]
    },
    {
        title: "Visual Kanban Board",
        color: "bg-gradient-to-br from-slate-800 to-slate-900",
        lightColor: "bg-slate-100",
        longDesc: "Managing a multi-million euro project requires a bird's eye view. Our Kanban board isn't just for tasks—it's for structure. Reorganize your entire grant application visually.",
        details: [
            "Fluid React DnD: Smooth, 60fps drag and drop interactions.", 
            "Cross-Container Drops: Move a module from WP1 to WP5 seamlessly.", 
            "Instant Financial Impact: See budget changes reflect immediately as you move items.", 
            "Smart Collapsing: Focus on one Work Package while keeping others summarized."
        ]
    },
    {
        title: "Granular RBAC Security",
        color: "bg-gradient-to-br from-emerald-500 to-teal-600",
        lightColor: "bg-emerald-100",
        longDesc: "Data security is paramount in competitive grant writing. We use a military-grade Role-Based Access Control (RBAC) system to ensure everyone sees exactly what they need to see—and nothing more.",
        details: [
            "Role Inheritance: Permissions cascade down the hierarchy automatically.", 
            "Module Overrides: Grant specific access to a single file without exposing the whole project.", 
            "External Auditors: Create 'Viewer-only' accounts for external reviewers.", 
            "Partner Isolation: Prevent Partner A from seeing Partner B's sensitive financial data."
        ]
    },
    {
        title: "Consortium Synchronization",
        color: "bg-gradient-to-br from-blue-500 to-cyan-600",
        lightColor: "bg-cyan-100",
        longDesc: "Coordinating 20+ partners across 10 countries is chaos. We turn it into order. Assign Work Packages to Lead Partners, and let the system handle the delegation.",
        details: [
            "Lead Partner Assignment: Designate an organization responsible for a specific deliverable.", 
            "Auto-Cascading Roles: Staff from the Lead Partner automatically get edit rights.", 
            "Conflict Resolution: The system prevents two partners from editing the same text simultaneously.", 
            "Partner Profiles: Integrated directory of all organization details (PIC, VAT, Address)."
        ]
    },
    {
        title: "Real-time Intelligence",
        color: "bg-gradient-to-br from-rose-500 to-pink-600",
        lightColor: "bg-rose-100",
        longDesc: "Deadlines don't wait. Our real-time notification engine ensures you are the first to know about critical project events, keeping the momentum alive.",
        details: [
            "Instant Toasts: Non-intrusive popups for immediate feedback.", 
            "Role Change Alerts: Know the second you've been promoted or assigned.", 
            "Status Updates: 'Your Draft has been Validated' – get notified instantly.", 
            "Deadline Warnings: Automated nudges as submission dates approach."
        ]
    }
];
