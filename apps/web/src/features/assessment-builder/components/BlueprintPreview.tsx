import React from 'react';
import type { ExamConfig } from '@/services/exam-configs/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useConfigPreview } from '@/services/exam-configs/hooks';
import { Skeleton } from '@/components/ui/skeleton';

interface BlueprintPreviewProps {
  config: ExamConfig;
}

export const BlueprintPreview: React.FC<BlueprintPreviewProps> = ({ config }) => {
  const { data: previewData, isLoading, error } = useConfigPreview(config.id);

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
        <CardContent><Skeleton className="h-40 w-full" /></CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-red-700">
          Failed to load blueprint preview.
        </CardContent>
      </Card>
    );
  }

  // Using sectionBreakdown for the array of sections
  const sections = previewData?.sectionBreakdown || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className="text-sm text-muted-foreground">Total Questions</span>
            <span className="text-2xl font-bold">{config.totalQuestions}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className="text-sm text-muted-foreground">Duration</span>
            <span className="text-2xl font-bold">{config.durationMinutes}m</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className="text-sm text-muted-foreground">Sections</span>
            <span className="text-2xl font-bold">{previewData?.sections || 0}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className="text-sm text-muted-foreground">Passing Score</span>
            <span className="text-2xl font-bold">N/A</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Blueprint Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Section</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Topics</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      No section data available in this blueprint.
                    </TableCell>
                  </TableRow>
                ) : (
                  sections.map((section: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{section.name}</TableCell>
                      <TableCell>{section.questionCount}</TableCell>
                      <TableCell>{section.durationMinutes}m</TableCell>
                      <TableCell>{section.topicCount}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
