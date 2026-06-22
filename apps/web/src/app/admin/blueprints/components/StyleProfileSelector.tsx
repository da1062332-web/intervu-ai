'use client';

import { useStyleProfiles } from '@/services/blueprints/hooks';
import { Label } from '@/components/ui/label';

interface StyleProfileSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function StyleProfileSelector({ value, onChange }: StyleProfileSelectorProps) {
  const { data: profiles, isLoading, isError } = useStyleProfiles();

  return (
    <div className='space-y-2'>
      <Label>Style Profile</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='w-full px-3 py-2 border rounded-md bg-background'
      >
        <option value=''>-- Select Style Profile --</option>
        {profiles?.map((p: any) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      {isLoading && <p className='text-xs text-muted-foreground'>Loading style profiles...</p>}
      {isError && <p className='text-xs text-red-500'>Failed to load style profiles</p>}
    </div>
  );
}
