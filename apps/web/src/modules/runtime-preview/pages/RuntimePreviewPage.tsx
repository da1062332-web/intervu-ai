'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { RuntimeHealthDashboard } from '../components/RuntimeHealthDashboard';
import { apiClient } from '@/services/api/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';

function LazyQuestion({ questionData }: { questionData: any }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border rounded-md mb-2 overflow-hidden bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left px-4 py-3 bg-muted/20 hover:bg-muted/40 transition-colors flex justify-between items-center"
      >
        <span className="font-medium text-sm text-gray-700">Question ID: {questionData.questionId}</span>
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      
      {isOpen && (
        <div className="p-4 border-t">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Badge variant="outline">{questionData.questionType || 'MULTIPLE_CHOICE'}</Badge>
            </div>
            <p className="text-gray-800">{questionData.questionText}</p>
            {questionData.options && questionData.options.length > 0 && (
              <div className="mt-4">
                <p className="font-semibold text-sm mb-2">Options:</p>
                <ul className="list-disc pl-5 space-y-1">
                  {questionData.options.map((opt: any, i: number) => (
                    <li key={i} className="text-sm">{opt.text || opt}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LazySection({ testId, sectionId, initialSectionData }: { testId: string; sectionId: string; initialSectionData: any }) {
  const [isOpen, setIsOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['runtime', testId, 'section', sectionId],
    queryFn: () => apiClient.request<any>(`/runtime/test/${testId}/section/${sectionId}`),
    enabled: isOpen,
  });

  return (
    <Card className="mt-4 overflow-hidden border-t-4 border-t-primary">
      <div 
        className="cursor-pointer bg-muted/30"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                {initialSectionData.title}
              </CardTitle>
              <div className="mt-1 flex gap-4 text-sm text-muted-foreground pl-7">
                <span>Duration: {Math.round(initialSectionData.duration / 60)} mins</span>
                <span>{initialSectionData.questionCount} Questions</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </div>
      
      {isOpen && (
        <CardContent className="pt-4 border-t bg-gray-50/50">
          {isLoading ? (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading section details...
            </div>
          ) : error ? (
            <div className="p-4 text-red-500 bg-red-50 rounded-md">Error loading section.</div>
          ) : data ? (
            <div className="space-y-2">
              {data.section?.questions?.map((q: any) => (
                <LazyQuestion key={q.questionId} questionData={q} />
              ))}
              {(!data.section?.questions || data.section.questions.length === 0) && (
                <div className="text-center p-4 text-muted-foreground">No questions in this section.</div>
              )}
            </div>
          ) : null}
        </CardContent>
      )}
    </Card>
  );
}

export default function RuntimePreviewPage() {
  const params = useParams();
  const testId = params?.testId as string;

  const { data: runtimeData, isLoading: runtimeLoading, error: runtimeError } = useQuery({
    queryKey: ['runtime', testId],
    queryFn: () => apiClient.request<any>(`/runtime/test/${testId}`),
    enabled: !!testId,
  });

  const { data: validationData, isLoading: validationLoading } = useQuery({
    queryKey: ['runtime-validate', testId],
    queryFn: () => apiClient.request<any>(`/runtime/validate`, {
      method: 'POST',
      body: { testId }
    }),
    enabled: !!testId,
  });

  if (!testId) {
    return <div className="p-8 text-center text-red-500">Test ID is missing</div>;
  }

  if (runtimeLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (runtimeError) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-900 p-4 rounded-md flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5" />
          <div>
            <h3 className="font-bold">Error Loading Runtime</h3>
            <p className="mt-1">{(runtimeError as any).message || 'Failed to fetch runtime data.'}</p>
          </div>
        </div>
      </div>
    );
  }

  const runtime = runtimeData?.runtimeTest;

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto pb-24">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Runtime Preview</h1>
        <p className="text-muted-foreground mt-1">Review the final generated runtime package before execution.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Runtime Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Test ID</span>
              <span className="font-medium">{runtime?.testId}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Test Name</span>
              <span className="font-medium">{runtime?.title}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium">{Math.round((runtime?.duration || 0) / 60)} minutes</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Sections</span>
              <span className="font-medium">{runtime?.sections?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Questions</span>
              <span className="font-medium">
                {runtime?.sections?.reduce((acc: number, s: any) => acc + (s.questionCount || 0), 0) || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Validation Status</CardTitle>
          </CardHeader>
          <CardContent>
            {validationLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Validating runtime payload...
              </div>
            ) : validationData?.valid ? (
              <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-md flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 mt-0.5" />
                <div>
                  <h3 className="font-bold">Validation Passed</h3>
                  <p className="text-sm mt-1">The runtime structure is fully compliant.</p>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 text-red-900 p-4 rounded-md flex items-start gap-3">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-bold">Validation Failed</h3>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                    {validationData?.errors?.map((err: string, i: number) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div>
        <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">Sections</h2>
        {runtime?.sections?.map((section: any) => (
          <LazySection key={section.sectionId} testId={testId} sectionId={section.sectionId} initialSectionData={section} />
        ))}
        {(!runtime?.sections || runtime.sections.length === 0) && (
          <div className="p-8 text-center text-muted-foreground border rounded-md mt-4">
            No sections found in this runtime payload.
          </div>
        )}
      </div>
      
      <div className="pt-8">
        <h2 className="text-2xl font-semibold tracking-tight border-b pb-2 mb-6">System Health Dashboard</h2>
        <RuntimeHealthDashboard />
      </div>
    </div>
  );
}
