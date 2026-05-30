import Link from 'next/link';
import { Home, Users, Settings, LayoutDashboard } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border min-h-screen bg-card">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Logo className="size-8" />
          <span className="font-heading font-bold text-xl tracking-tight">InterVu AI</span>
        </Link>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-2">
        <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Overview</p>
        
        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium transition-colors">
          <LayoutDashboard className="size-5" />
          Dashboard
        </Link>
        <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground font-medium transition-colors">
          <Users className="size-5" />
          Candidates
        </Link>
        <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground font-medium transition-colors">
          <Home className="size-5" />
          Assessments
        </Link>
      </div>

      <div className="p-4 border-t border-border">
        <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground font-medium transition-colors">
          <Settings className="size-5" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
