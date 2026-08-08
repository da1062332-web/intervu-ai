'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CandidateSearchProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export function CandidateSearch({
  value,
  onChange,
  placeholder = 'Search candidates by name or email...',
  className,
}: CandidateSearchProps) {
  const [inputValue, setInputValue] = React.useState(value);

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== value) {
        onChange(inputValue);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, value, onChange]);

  const handleClear = () => {
    setInputValue('');
    onChange('');
  };

  return (
    <div className={`relative flex items-center w-full max-w-md ${className || ''}`}>
      <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none' />
      <Input
        type='text'
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        className='pl-9 pr-9 w-full bg-background'
      />
      {inputValue && (
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={handleClear}
          className='absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-muted-foreground hover:text-foreground'
        >
          <X className='w-3.5 h-3.5' />
          <span className='sr-only'>Clear search</span>
        </Button>
      )}
    </div>
  );
}
