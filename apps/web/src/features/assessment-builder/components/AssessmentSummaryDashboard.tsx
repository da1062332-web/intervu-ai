import React from 'react';
import type { Assessment, ValidationResult } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface AssessmentSummaryDashboardProps {
  assessment: Assessment;
  validation?: ValidationResult;
}

export const AssessmentSummaryDashboard: React.FC<AssessmentSummaryDashboardProps> = ({
  assessment,
  validation,
}) => {
  const allQuestions =
    assessment.questions || assessment.sections?.flatMap((s) => s.questions || []) || [];
  const totalQuestions = allQuestions.length;
  const sectionsCount = assessment.sections?.length || 0;

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-4 flex flex-col justify-center'>
            <span className='text-sm text-muted-foreground mb-1'>Assessment ID</span>
            <span className='font-mono text-xs font-bold truncate' title={assessment.testId}>
              {assessment.testId}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4 flex flex-col justify-center'>
            <span className='text-sm text-muted-foreground mb-1'>Status</span>
            <div className='flex items-center gap-2'>
              <Badge variant='default' className='w-fit'>
                {assessment.status}
              </Badge>
              {assessment.status === 'PUBLISHED' && (
                <Badge variant='secondary' className='w-fit'>
                  Published Snapshot
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4 flex flex-col justify-center'>
            <span className='text-sm text-muted-foreground mb-1'>Generated Questions</span>
            <span className='text-2xl font-bold'>{totalQuestions}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4 flex flex-col justify-center'>
            <span className='text-sm text-muted-foreground mb-1'>Sections</span>
            <span className='text-2xl font-bold'>{sectionsCount}</span>
          </CardContent>
        </Card>
      </div>

      {validation && (
        <Card
          className={validation.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}
        >
          <CardHeader>
            <CardTitle className='text-lg flex items-center gap-2'>
              {validation.valid ? (
                <>
                  <CheckCircle2 className='text-green-600' /> Validation Passed
                </>
              ) : (
                <>
                  <XCircle className='text-red-600' /> Validation Failed
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {validation.errors.length > 0 && (
                <div>
                  <h4 className='font-semibold text-red-800 flex items-center gap-2 mb-2'>
                    <XCircle className='w-4 h-4' /> Errors
                  </h4>
                  <ul className='list-disc pl-5 text-sm text-red-700 space-y-1'>
                    {validation.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
              {validation.warnings.length > 0 && (
                <div>
                  <h4 className='font-semibold text-yellow-800 flex items-center gap-2 mb-2'>
                    <AlertTriangle className='w-4 h-4' /> Warnings
                  </h4>
                  <ul className='list-disc pl-5 text-sm text-yellow-700 space-y-1'>
                    {validation.warnings.map((warn, i) => (
                      <li key={i}>{warn}</li>
                    ))}
                  </ul>
                </div>
              )}
              {validation.suggestions.length > 0 && (
                <div>
                  <h4 className='font-semibold text-blue-800 mb-2'>Suggestions</h4>
                  <ul className='list-disc pl-5 text-sm text-blue-700 space-y-1'>
                    {validation.suggestions.map((sug, i) => (
                      <li key={i}>{sug}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
