import React from 'react';
import { WorkflowStatusDetails, WorkflowStep, StepStatus, WorkflowStatus } from '../types';
import { WORKFLOW_STEP_LABELS, WORKFLOW_STEPS_ORDER } from '../constants';
import { CheckCircle2, Circle, Clock, Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface WorkflowTimelineProps {
  details: WorkflowStatusDetails;
}

const getStepStatusObj = (details: WorkflowStatusDetails, step: WorkflowStep): StepStatus => {
  switch (step) {
    case WorkflowStep.CONFIGURATION: return details.configuration;
    case WorkflowStep.QUESTION_GENERATION: return details.questionGeneration;
    case WorkflowStep.QUESTION_REVIEW: return details.questionReview;
    case WorkflowStep.ASSEMBLY: return details.assembly;
    case WorkflowStep.PUBLISHING: return details.publishing;
    default: return { status: WorkflowStatus.NOT_STARTED, progress: 0 };
  }
};

export const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({ details }) => {
  return (
    <div className="relative border-l-2 border-muted ml-3 space-y-8 py-2">
      {WORKFLOW_STEPS_ORDER.map((step, index) => {
        const statusObj = getStepStatusObj(details, step);
        const isActive = details.currentStep === step;
        const isPast = WORKFLOW_STEPS_ORDER.indexOf(details.currentStep) > index;
        
        let Icon = Circle;
        let iconClass = 'text-muted-foreground bg-background';
        
        if (statusObj.status === WorkflowStatus.COMPLETED || isPast) {
          Icon = CheckCircle2;
          iconClass = 'text-green-500 bg-background';
        } else if (statusObj.status === WorkflowStatus.IN_PROGRESS) {
          Icon = Loader2;
          iconClass = 'text-blue-500 bg-background animate-spin-slow';
        } else if (statusObj.status === WorkflowStatus.FAILED) {
          Icon = XCircle;
          iconClass = 'text-red-500 bg-background';
        } else if (isActive) {
          Icon = Clock;
          iconClass = 'text-amber-500 bg-background';
        }

        return (
          <div key={step} className="relative pl-8">
            <div className={cn("absolute -left-[11px] top-1 p-0.5 rounded-full", iconClass)}>
              <Icon className={cn("h-5 w-5", statusObj.status === WorkflowStatus.IN_PROGRESS && "animate-spin")} />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <h4 className={cn("text-sm font-semibold", isActive ? "text-primary" : "text-foreground")}>
                  {WORKFLOW_STEP_LABELS[step]}
                </h4>
                <span className="text-xs font-medium text-muted-foreground">
                  {statusObj.progress}%
                </span>
              </div>
              
              <Progress 
                value={statusObj.progress} 
                className={cn(
                  "h-1.5", 
                  statusObj.status === WorkflowStatus.FAILED ? "bg-red-100" : ""
                )}
                // indicatorClass={statusObj.status === WorkflowStatus.FAILED ? "bg-red-500" : ""}
              />
              
              {statusObj.errorReason && (
                <p className="text-xs text-red-600 mt-1 bg-red-50 p-2 rounded border border-red-100">
                  {statusObj.errorReason}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
