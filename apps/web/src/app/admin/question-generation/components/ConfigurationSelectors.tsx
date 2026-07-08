import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

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
    <Card>
      <CardHeader>
        <CardTitle>Generation Context</CardTitle>
        <CardDescription>
          Select the hierarchy and template you want to use for generating questions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Topic</Label>
            <select
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
            >
              <option value="" disabled>Select a topic...</option>
              {topics.map(topic => (
                <option key={topic.id} value={topic.id}>{topic.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Concept</Label>
            <select
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedConcept}
              onChange={(e) => setSelectedConcept(e.target.value)}
              disabled={!selectedTopic}
            >
              <option value="" disabled>Select a concept...</option>
              {concepts.map(concept => (
                <option key={concept.id} value={concept.id}>{concept.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Template</Label>
            <select
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              disabled={!selectedConcept}
            >
              <option value="" disabled>Select a template...</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
