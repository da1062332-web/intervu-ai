'use client';

import { Plus, Clock, BarChart3, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-4xl font-heading font-bold tracking-tight text-foreground">
          Welcome back, {user?.fullName?.split(' ')[0] || 'User'} 👋
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Here is what's happening with your interview assessments today.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Create Assessment Card */}
        <div className="group relative overflow-hidden rounded-2xl bg-card border border-border p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Plus className="size-6" />
            </div>
            <h3 className="text-xl font-heading font-semibold mb-2">Create Assessment</h3>
            <p className="text-muted-foreground mb-6 flex-1">
              Build a new AI-powered interview assessment tailored to your role.
            </p>
            <button className="inline-flex items-center text-sm font-semibold text-primary group-hover:text-violet-600 transition-colors">
              Get Started <ArrowRight className="ml-1 size-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Recent Assessments Card */}
        <div className="group relative overflow-hidden rounded-2xl bg-card border border-border p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="size-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Clock className="size-6" />
            </div>
            <h3 className="text-xl font-heading font-semibold mb-2">Recent Assessments</h3>
            <p className="text-muted-foreground mb-6 flex-1">
              View and manage your recent interview campaigns and candidates.
            </p>
            <div className="mt-auto flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/50 py-4">
              <p className="text-sm font-medium text-muted-foreground">No assessments yet</p>
            </div>
          </div>
        </div>

        {/* Analytics Card */}
        <div className="group relative overflow-hidden rounded-2xl bg-card border border-border p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="size-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <BarChart3 className="size-6" />
            </div>
            <h3 className="text-xl font-heading font-semibold mb-2">Analytics</h3>
            <p className="text-muted-foreground mb-6 flex-1">
              Gain insights into candidate performance and hiring metrics.
            </p>
            <div className="mt-auto flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/50 py-4">
              <p className="text-sm font-medium text-muted-foreground">No data available</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
