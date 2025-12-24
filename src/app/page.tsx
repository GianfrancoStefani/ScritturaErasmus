import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ArrowRight, Layers, ShieldCheck, GitMerge, Move, Network, Bell } from "lucide-react";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-slate-50 opacity-80 pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-white to-transparent pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
           <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">E+</div>
           <span className="font-bold text-xl tracking-tight text-slate-900">ErasmusManager</span>
        </Link>
        <div className="flex gap-4 items-center">
             <Link href="/login" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                Sign In
             </Link>
             <Link href="/register">
                <Button className="rounded-full shadow-lg shadow-indigo-200">Get Started</Button>
             </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 text-center">
        
        <div className="max-w-4xl mx-auto">
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
            <Link href="/register">
                <Button size="lg" className="rounded-full px-8 h-12 text-base">
                Create Account <ArrowRight size={18} className="ml-2" />
                </Button>
            </Link>
             <Link href="/join">
                <Button variant="secondary" size="lg" className="rounded-full px-8 h-12 text-base bg-white border border-slate-200 hover:bg-slate-50">
                    Join with Code
                </Button>
            </Link>
        </div>
        </div>

        {/* Detailed Features Grid with Interactivity */}
        <FeatureGrid />

      </main>

      <footer className="relative z-10 border-t border-slate-200 bg-white/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-8 text-center text-slate-500 text-sm">
            © 2025 ErasmusManager. Built for speed and collaboration.
          </div>
      </footer>

    </div>
  );
}
