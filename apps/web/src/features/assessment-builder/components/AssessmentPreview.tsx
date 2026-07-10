import React, { useState } from 'react';
import type { Assessment, GeneratedQuestion } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AssessmentPreviewProps {
  assessment: Assessment;
}

export const AssessmentPreview: React.FC<AssessmentPreviewProps> = ({ assessment }) => {
  // If there are explicit sections, we use them. Otherwise we create a virtual "Default Section"
  const sections = assessment.sections?.length
    ? assessment.sections
    : [{ id: 'default', name: 'Assessment Questions', questions: assessment.questions || [] }];

  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id);

  const activeSection = sections.find((s) => s.id === activeSectionId);
  const questions = activeSection?.questions || [];

  const QUESTIONS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);

  // Reset page when section changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeSectionId]);

  const currentQuestions = questions.slice(
    (currentPage - 1) * QUESTIONS_PER_PAGE,
    currentPage * QUESTIONS_PER_PAGE,
  );

  return (
    <div className='flex flex-col md:flex-row gap-6'>
      {/* Sidebar for Navigation */}
      <div className='w-full md:w-64 flex-shrink-0 space-y-2'>
        <h3 className='text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4 px-2'>
          Sections
        </h3>
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSectionId(section.id)}
            className={`w-full text-left px-4 py-3 rounded-md transition-colors ${
              activeSectionId === section.id
                ? 'bg-primary text-primary-foreground font-medium'
                : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            <div className='flex justify-between items-center'>
              <span className='truncate pr-2'>{section.name}</span>
              <Badge
                variant={activeSectionId === section.id ? 'secondary' : 'outline'}
                className='text-xs'
              >
                {section.questions?.length || 0}
              </Badge>
            </div>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className='flex-1 space-y-6'>
        <div className='flex justify-between items-center pb-4 border-b'>
          <h2 className='text-xl font-bold'>{activeSection?.name}</h2>
          <span className='text-sm text-muted-foreground'>{questions.length} Questions</span>
        </div>

        {questions.length === 0 ? (
          <div className='py-12 text-center text-muted-foreground border-2 border-dashed rounded-md'>
            No questions available in this section.
          </div>
        ) : (
          <div className='space-y-4'>
            {currentQuestions.map((q, idx) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={(currentPage - 1) * QUESTIONS_PER_PAGE + idx + 1}
              />
            ))}

            {totalPages > 1 && (
              <div className='flex justify-between items-center pt-4 border-t mt-6'>
                <Button
                  variant='outline'
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className='text-sm text-muted-foreground'>
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant='outline'
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const QuestionCard: React.FC<{ question: GeneratedQuestion; index: number }> = ({
  question,
  index,
}) => {
  return (
    <Card>
      <CardHeader className='pb-3 flex flex-row items-start justify-between space-y-0'>
        <div className='flex items-center gap-3'>
          <span className='flex items-center justify-center bg-muted text-muted-foreground rounded-full w-8 h-8 text-sm font-bold flex-shrink-0'>
            {index}
          </span>
          <CardTitle className='text-base font-semibold leading-tight'>
            {question.questionText}
          </CardTitle>
        </div>
        <div className='flex gap-2 items-center flex-wrap'>
          <Badge
            variant={
              question.difficulty === 'HARD'
                ? 'destructive'
                : question.difficulty === 'EASY'
                  ? 'secondary'
                  : 'default'
            }
            className='flex-shrink-0'
          >
            {question.difficulty}
          </Badge>
          {question.topicId && (
            <Badge
              variant='outline'
              className='flex-shrink-0 text-muted-foreground border-muted-foreground/30'
            >
              {question.topicId}
            </Badge>
          )}
          {question.conceptKey && (
            <Badge
              variant='outline'
              className='flex-shrink-0 text-muted-foreground border-muted-foreground/30'
            >
              {question.conceptKey}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {question.options && question.options.length > 0 && (
          <div className='pl-11 space-y-2 mt-2'>
            {question.options.map((opt, i) => (
              <div
                key={i}
                className={`p-3 border rounded-md text-sm ${opt === question.answer ? 'bg-green-50 border-green-200 font-medium text-green-900' : 'bg-background'}`}
              >
                {opt}
                {opt === question.answer && (
                  <span className='ml-2 text-green-600 text-xs uppercase font-bold tracking-wider'>
                    (Correct Answer)
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {!question.options && question.answer && (
          <div className='pl-11 mt-4'>
            <h4 className='text-sm font-semibold mb-1'>Answer:</h4>
            <div className='p-3 bg-muted rounded-md text-sm'>{question.answer}</div>
          </div>
        )}

        {question.explanation && (
          <div className='pl-11 mt-4'>
            <h4 className='text-sm font-semibold mb-1 text-muted-foreground'>Explanation:</h4>
            <div className='text-sm text-muted-foreground'>{question.explanation}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
