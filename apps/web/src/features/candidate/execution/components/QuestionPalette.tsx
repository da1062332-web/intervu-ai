'use client';

import { useExecutionStore } from '../stores/execution.store';
import { QuestionStatusBadge } from './QuestionStatusBadge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function QuestionPalette() {
  const { palette, jumpToQuestion } = useExecutionStore();

  return (
    <Card className="border-none shadow-none md:border-solid md:shadow-sm">
      <CardHeader className="pb-4 border-b">
        <CardTitle className="text-lg font-bold">Question Palette</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-4 lg:grid-cols-5">
          {palette.map((status, index) => (
            <QuestionStatusBadge
              key={`palette-${index}`}
              index={index}
              status={status}
              onClick={() => jumpToQuestion(index)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
