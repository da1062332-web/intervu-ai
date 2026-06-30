import React from 'react';
import { StepStatus } from '../types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, Play } from 'lucide-react';

interface GenerationPanelProps {
  status: StepStatus;
  onGenerate: () => void;
}

export const GenerationPanel: React.FC<GenerationPanelProps> = ({ status, onGenerate }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Question Generation</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Generate questions based on the exam configuration and topic weightages.
          </p>
        </div>
        <Button onClick={onGenerate} disabled={status.status === 'IN_PROGRESS'}>
          <Play className="w-4 h-4 mr-2" />
          {status.status === 'IN_PROGRESS' ? 'Generating...' : 'Start Generation'}
        </Button>
      </div>

      <div className="rounded-lg border bg-muted/20 p-4 shadow-sm mb-6">
        <h4 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Generation Parameters
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="block text-muted-foreground text-xs">Total Questions</span>
            <span className="font-semibold">30</span>
          </div>
          <div>
            <span className="block text-muted-foreground text-xs">AI Model</span>
            <span className="font-semibold">GPT-4 Turbo</span>
          </div>
          <div>
            <span className="block text-muted-foreground text-xs">Estimated Time</span>
            <span className="font-semibold">~45 seconds</span>
          </div>
          <div>
            <span className="block text-muted-foreground text-xs">Complexity Distribution</span>
            <span className="font-semibold">30% / 50% / 20%</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Status</div>
          <div className="text-2xl font-bold capitalize mt-1">
            {status.status.replace('_', ' ').toLowerCase()}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Progress</div>
          <div className="mt-2 flex items-center gap-2">
            <Progress value={status.progress} className="flex-1" />
            <span className="text-sm font-bold">{status.progress}%</span>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Started At</div>
          <div className="text-lg font-semibold mt-1 flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            {status.startedAt ? new Date(status.startedAt).toLocaleString() : 'Not started'}
          </div>
        </div>
      </div>
    </div>
  );
};
