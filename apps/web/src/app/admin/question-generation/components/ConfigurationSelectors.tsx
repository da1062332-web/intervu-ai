import React from 'react';
import { CustomFormCard } from '@/components/ui/custom-form-card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface ConfigurationSelectorsProps {
  selectedTopic: string;
  setSelectedTopic: (val: string) => void;
  selectedConcept: string;
  setSelectedConcept: (val: string) => void;
  selectedTemplate: string;
  setSelectedTemplate: (val: string) => void;
  topics: any[];
  concepts: any[];
  templates: any[];
}

export function ConfigurationSelectors({
  selectedTopic,
  setSelectedTopic,
  selectedConcept,
  setSelectedConcept,
  selectedTemplate,
  setSelectedTemplate,
  topics,
  concepts,
  templates,
}: ConfigurationSelectorsProps) {
  return (
    <CustomFormCard
      title='Generation Context'
      description='Select the hierarchy and template you want to use for generating questions.'
    >
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <div className='space-y-2'>
          <Label>Topic</Label>
          <Select value={selectedTopic} onValueChange={setSelectedTopic}>
            <SelectTrigger>
              <SelectValue placeholder='Select a topic...' />
            </SelectTrigger>
            <SelectContent>
              {topics.map((topic) => (
                <SelectItem key={topic.id} value={topic.id}>
                  {topic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-2'>
          <Label>Concept</Label>
          <Select
            value={selectedConcept}
            onValueChange={setSelectedConcept}
            disabled={!selectedTopic}
          >
            <SelectTrigger>
              <SelectValue placeholder='Select a concept...' />
            </SelectTrigger>
            <SelectContent>
              {concepts.map((concept) => (
                <SelectItem key={concept.id} value={concept.id}>
                  {concept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-2'>
          <Label>Template / Coding Pattern</Label>
          <Select
            value={selectedTemplate}
            onValueChange={setSelectedTemplate}
            disabled={!selectedConcept}
          >
            <SelectTrigger>
              <SelectValue placeholder='Select a template/coding pattern...' />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template: any) => (
                <SelectItem key={`${template.type ?? 'item'}-${template.id}`} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </CustomFormCard>
  );
}
