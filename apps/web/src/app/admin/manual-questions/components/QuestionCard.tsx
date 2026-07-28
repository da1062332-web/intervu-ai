import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { McqEditor } from './McqEditor';
import { TrueFalseEditor } from './TrueFalseEditor';
import { CodingEditor } from './CodingEditor';
import Editor from '@monaco-editor/react';

interface QuestionCardProps {
  index: number;
  onRemove: (index: number) => void;
  onDuplicate: (index: number) => void;
  disabled?: boolean;
}

export function QuestionCard({ index, onRemove, onDuplicate, disabled }: QuestionCardProps) {
  const { register, watch, setValue, formState: { errors } } = useFormContext();
  const [isOpen, setIsOpen] = useState(true);
  
  const questionType = watch(`questions.${index}.questionType`) || 'MCQ';
  
  // We don't render a full error tree, just extract common ones
  const qErrors = (errors?.questions as any)?.[index] || {};

  return (
    <div className="relative border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-950 shadow-sm transition-all">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 rounded-t-xl border-b border-transparent data-[open=true]:border-gray-200 dark:data-[open=true]:border-gray-800"
        data-open={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        <h4 className="font-semibold text-lg flex items-center">
          {isOpen ? <ChevronUp className="w-5 h-5 mr-2 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 mr-2 text-muted-foreground" />}
          Question {index + 1}
          {qErrors && Object.keys(qErrors).length > 0 && (
            <span className="ml-3 text-xs bg-destructive/10 text-destructive px-2 py-1 rounded">Errors</span>
          )}
        </h4>
        <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={() => onDuplicate(index)}
            disabled={disabled}
            className="text-muted-foreground hover:text-indigo-600"
          >
            <Copy className="w-4 h-4 mr-2" />
            Duplicate
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={() => onRemove(index)}
            disabled={disabled}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Body */}
      {isOpen && (
        <div className="p-6 space-y-8 animate-in slide-in-from-top-2 duration-200">
          
          {/* Basic Information Section */}
          <div className="space-y-6">
            <h5 className="font-medium text-muted-foreground uppercase text-xs tracking-wider border-b pb-2">Basic Information</h5>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Question Type</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  {...register(`questions.${index}.questionType`)}
                  disabled={disabled}
                  onChange={(e) => {
                     setValue(`questions.${index}.questionType`, e.target.value);
                  }}
                >
                  <option value="MCQ">Multiple Choice</option>
                  <option value="TRUE_FALSE">True / False</option>
                  <option value="CODING">Coding</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Difficulty</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  {...register(`questions.${index}.difficulty`)}
                  disabled={disabled}
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Question Title (Optional)</Label>
              <Input 
                placeholder="e.g. Binary Search implementation..."
                {...register(`questions.${index}.questionTitle`)}
                disabled={disabled}
              />
            </div>

            {questionType !== 'CODING' && (
              <div className="space-y-2">
                <Label>Question Text <span className="text-destructive">*</span></Label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Write your question here..."
                  {...register(`questions.${index}.questionText`)}
                  disabled={disabled}
                />
                {qErrors?.questionText && (
                  <p className="text-sm text-destructive">{qErrors.questionText.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Type Configuration Section */}
          <div className="space-y-6">
            <h5 className="font-medium text-muted-foreground uppercase text-xs tracking-wider border-b pb-2">Type Configuration</h5>
            
            {questionType === 'MCQ' && <McqEditor index={index} disabled={disabled} />}
            {questionType === 'TRUE_FALSE' && <TrueFalseEditor index={index} disabled={disabled} />}
            {questionType === 'CODING' && <CodingEditor index={index} disabled={disabled} />}

            {qErrors?.answer && questionType !== 'CODING' && (
              <p className="text-sm text-destructive">Please specify the correct answer.</p>
            )}
          </div>

          {/* Solution & Explanation Section */}
          <div className="space-y-6">
            <h5 className="font-medium text-muted-foreground uppercase text-xs tracking-wider border-b pb-2">Solution &amp; Explanation</h5>
            
            <div className="space-y-2">
              <Label>Explanation / Solution Details</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Explain why the answer is correct..."
                {...register(`questions.${index}.explanation`)}
                disabled={disabled}
              />
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
