'use client';

import { ExecutionHeader } from './ExecutionHeader';
import { QuestionPanel } from './QuestionPanel';
import { QuestionPalette } from './QuestionPalette';
import { ProgressTracker } from './ProgressTracker';
import { NavigationControls } from './NavigationControls';

export function ExecutionLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ExecutionHeader />
      
      <main className="flex-1 container max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full items-start">
          
          {/* Left Column - Question & Navigation */}
          <div className="lg:col-span-8 flex flex-col min-h-[500px]">
            <div className="flex-1">
              <QuestionPanel />
            </div>
            <div className="mt-6 md:mt-8">
              <NavigationControls />
            </div>
          </div>

          {/* Right Column - Palette & Progress */}
          <div className="lg:col-span-4 flex flex-col gap-6 sticky top-[88px]">
            <QuestionPalette />
            
            <div className="border rounded-xl p-6 md:shadow-sm">
              <ProgressTracker />
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
