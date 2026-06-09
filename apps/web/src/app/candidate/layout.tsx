import { ProtectedRoute } from '@/components/auth/protected-route';

export default function CandidateDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className='min-h-screen bg-background'>
        <main
          className='mx-auto max-w-7xl p-4 sm:p-6 lg:p-8'
          id='candidate-main-content'
          aria-label='Candidate Dashboard Content'
        >
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
