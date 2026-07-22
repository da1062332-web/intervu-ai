import React from 'react';
import { Control, FieldValues, Path } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

export interface CustomFormFieldProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  label?: string;
  description?: React.ReactNode;
  render: (field: any) => React.ReactNode;
  className?: string;
}

export function CustomFormField<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  description,
  render,
  className,
}: CustomFormFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>{render(field)}</FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
