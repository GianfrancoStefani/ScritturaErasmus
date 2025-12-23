import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ArrowRight, Layers, Users, Rocket, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-slate-50 opacity-80 pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-white to-transparent pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">E+</div>
           <span className="font-bold text-xl tracking-tight text-slate-900">Writer</span>
        </div>
        <div className="flex gap-4">
             <Link href="/login">
                <Button variant="ghost" className="text-slate-600 hover:text-indigo-600">Sign In</Button>
             </Link>
             <Link href="/dashboard">
                <Button className="rounded-full shadow-lg shadow-indigo-200">Get Started</Button>
             </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-32 text-center">
        
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-sm font-medium text-slate-600 mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            v1.0 Ready for Erasmus+ & Horizon
        </div>

        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 animate-fade-in animate-delay-100">
          Project Writing, <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Reimagined.</span>
        </h1>

        <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-in animate-delay-200">
          The collaborative workspace designed specifically for writing European projects. 
          Streamline partners, budgets, and work packages in one intuitive platform.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 animate-fade-in animate-delay-300">
            <Link href="/dashboard">
                <Button size="lg" className="rounded-full px-8 h-12 text-base">
                Launch Dashboard <ArrowRight size={18} className="ml-2" />
                </Button>
            </Link>
            <Button variant="secondary" size="lg" className="rounded-full px-8 h-12 text-base bg-white border border-slate-200 hover:bg-slate-50">
                View Documentation
            </Button>
        </div>

        {/* Synthetic Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left animate-fade-in animate-delay-300">
            <FeatureCard 
                icon={<Layers className="text-indigo-600" />}
                title="Modular Kanban"
                desc="Structure work packages, tasks, and activities intuitively."
            />
            <FeatureCard 
                icon={<Users className="text-violet-600" />}
                title="Consortium Sync"
                desc="Visualize hierarchies and assign roles to partners instantly."
            />
             <FeatureCard 
                icon={<Rocket className="text-fuchsia-600" />}
                title="Auto-Report"
                desc="Generate submission-ready PDFs formatted for E+ applications."
            />
        </div>

      </main>

      <footer className="relative z-10 border-t border-slate-200 bg-white/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-8 text-center text-slate-500 text-sm">
            © 2025 Erasmus+ Writer. Built for speed and collaboration.
          </div>
      </footer>

    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="bg-white/60 backdrop-blur-sm border border-slate-200 p-6 rounded-2xl hover:border-indigo-200 transition-colors shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-4">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
            <p className="text-slate-500 leading-relaxed text-sm">
                {desc}
            </p>
        </div>
    )
}
