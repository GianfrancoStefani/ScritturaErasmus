import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Layers, Users, Rocket } from "lucide-react";

export default function Home() {
  return (
    <div className="landing-page">
      
      {/* Dynamic Background */}
      <div className="hero-gradient" style={{ position: 'absolute', inset: 0, opacity: 0.6, pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '500px', background: 'linear-gradient(to bottom, rgba(255,255,255,0.8), transparent)', pointerEvents: 'none' }}></div>

      {/* Navbar Placeholder */}
      <nav className="landing-nav animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
           <div style={{ width: '2rem', height: '2rem', background: 'linear-gradient(to top right, #2563eb, #4f46e5)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.125rem' }}>E+</div>
           <span style={{ fontWeight: 'bold', fontSize: '1.25rem', letterSpacing: '-0.025em', color: '#1e293b' }}>Writer</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
             <Link href="/login">
                <Button variant="ghost" style={{ color: '#475569' }}>Sign In</Button>
             </Link>
             <Link href="/dashboard">
                <Button style={{ borderRadius: '9999px', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)' }}>Get Started</Button>
             </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="landing-hero">
        
        <div className="animate-fade-in animate-delay-100" style={{ marginBottom: '1.5rem', padding: '0.375rem 1rem', borderRadius: '9999px', background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(4px)', border: '1px solid #e2e8f0', fontSize: '0.875rem', fontWeight: 500, color: '#475569', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
            <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '9999px', backgroundColor: '#22c55e' }}></span>
            v1.0 is now live for Erasmus+ Projects
        </div>

        <h1 className="animate-fade-in animate-delay-200" style={{ fontSize: '3.75rem', lineHeight: 1, fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '2rem' }}>
          <span className="text-gradient-dark">Project Writing,</span><br/>
          <span className="text-gradient">Reimagined.</span>
        </h1>

        <p className="animate-fade-in animate-delay-300" style={{ fontSize: '1.25rem', color: '#64748b', maxWidth: '42rem', marginBottom: '2.5rem', lineHeight: 1.625 }}>
          The all-in-one collaborative workspace design specifically for Erasmus+ and Horizon projects. 
          Manage partners, coordinate budgets, and write proposals in real-time.
        </p>
        
        <div className="animate-fade-in animate-delay-300" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href="/dashboard">
                <Button size="lg" style={{ borderRadius: '9999px', padding: '0.75rem 2rem' }}>
                Launch Dashboard <ArrowRight size={20} style={{ marginLeft: '0.5rem' }} />
                </Button>
            </Link>
            <Button variant="secondary" size="lg" style={{ borderRadius: '9999px', padding: '0.75rem 2rem', background: 'white', border: '1px solid #e2e8f0' }}>
                View Documentation
            </Button>
          </div>
        </div>

        {/* Feature Grid with Glassmorphism */}
        <div className="animate-fade-in animate-delay-300 grid-3" style={{ width: '100%', textAlign: 'left' }}>
            <FeatureCard 
                icon={<Layers size={24} style={{ color: '#2563eb' }} />}
                title="Modular Structure"
                desc="Organize work packages, tasks, and activities with our drag-and-drop Kanban."
            />
            <FeatureCard 
                icon={<Users size={24} style={{ color: '#4f46e5' }} />}
                title="Consortium Management"
                desc="Visualize partner hierarchies and assign specific responsibilities to users."
            />
             <FeatureCard 
                icon={<Rocket size={24} style={{ color: '#9333ea' }} />}
                title="Automated Reports"
                desc="Generate submission-ready PDFs with one click, perfectly formatted."
            />
        </div>

        {/* Floating UI Preview */}
        <div className="animate-float" style={{ marginTop: '6rem', width: '100%', maxWidth: '64rem', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255,255,255,0.5)', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.1), transparent)', zIndex: 10, pointerEvents: 'none' }}></div>
            {/* Mock Dashboard Image or Component */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(24px)', padding: '1rem', height: '400px', display: 'flex', gap: '1.5rem' }}>
                 {/* Sidebar Mock */}
                 <div style={{ width: '16rem', backgroundColor: '#0f172a', borderRadius: '0.75rem', height: '100%', display: 'flex', flexDirection: 'column', padding: '1rem', gap: '1rem', opacity: 0.9 }}>
                    <div style={{ height: '2rem', width: '2rem', backgroundColor: '#3b82f6', borderRadius: '0.5rem' }}></div>
                    <div style={{ height: '1rem', width: '75%', backgroundColor: '#334155', borderRadius: '0.25rem', opacity: 0.5 }}></div>
                    <div style={{ height: '1rem', width: '50%', backgroundColor: '#334155', borderRadius: '0.25rem', opacity: 0.5 }}></div>
                    <div style={{ height: '1rem', width: '83%', backgroundColor: '#334155', borderRadius: '0.25rem', opacity: 0.5 }}></div>
                 </div>
                 {/* Content Mock */}
                 <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ height: '4rem', width: '100%', backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', padding: '0 1.5rem', justifyContent: 'space-between' }}>
                         <div style={{ height: '1rem', width: '33%', backgroundColor: '#f1f5f9', borderRadius: '0.25rem' }}></div>
                         <div style={{ height: '2rem', width: '2rem', borderRadius: '9999px', backgroundColor: '#e0e7ff' }}></div>
                    </div>
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                        <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 10px 15px -3px rgba(30, 58, 138, 0.05)', padding: '1.5rem', border: '1px solid #f1f5f9' }}>
                             <div style={{ height: '1rem', width: '25%', backgroundColor: '#dbeafe', borderRadius: '9999px', marginBottom: '1rem' }}></div>
                             <div style={{ height: '1.5rem', width: '75%', backgroundColor: '#1e293b', borderRadius: '0.25rem', marginBottom: '0.5rem' }}></div>
                             <div style={{ height: '1rem', width: '100%', backgroundColor: '#f1f5f9', borderRadius: '0.25rem' }}></div>
                        </div>
                        <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 10px 15px -3px rgba(88, 28, 135, 0.05)', padding: '1.5rem', border: '1px solid #f1f5f9' }}>
                             <div style={{ height: '1rem', width: '25%', backgroundColor: '#f3e8ff', borderRadius: '9999px', marginBottom: '1rem' }}></div>
                             <div style={{ height: '1.5rem', width: '75%', backgroundColor: '#1e293b', borderRadius: '0.25rem', marginBottom: '0.5rem' }}></div>
                             <div style={{ height: '1rem', width: '100%', backgroundColor: '#f1f5f9', borderRadius: '0.25rem' }}></div>
                        </div>
                    </div>
                 </div>
            </div>
        </div>

      </main>

      <footer style={{ width: '100%', padding: '2rem 0', borderTop: '1px solid #e2e8f0', backgroundColor: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="max-w-7xl" style={{ margin: '0 auto', padding: '0 1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
            © 2025 Erasmus+ Writer. Built for speed and collaboration.
          </div>
      </footer>

    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', transition: 'transform 0.3s' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', backgroundColor: 'white', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', border: '1px solid #f1f5f9' }}>
                {icon}
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>{title}</h3>
            <p style={{ color: '#64748b', lineHeight: 1.625, fontSize: '0.875rem' }}>
                {desc}
            </p>
        </div>
    )
}
