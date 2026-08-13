'use client';

import React, { createContext, useContext, useState, ReactNode, useRef } from 'react';

// Form Definitions
export interface VariableFormState {
  name: string;
  type: string;
  min: string;
  max: string;
  defaultValue: string;
  generator: string;
}

export interface DerivedFormState {
  name: string;
  expression: string;
}

export interface ConstraintFormState {
  target: string;
  operator: string;
  value: string;
}

export interface OptionStrategyState {
  strategy: string;
  options: string[];
}

export interface TemplateDraftState {
  // We use Partial because BasicInfo uses react-hook-form's defaultValues mechanism,
  // so we just store any changes to re-hydrate it.
  basicInfo?: any; 
  
  variableForm: VariableFormState;
  derivedForm: DerivedFormState;
  constraintForm: ConstraintFormState;
  
  optionStrategy?: OptionStrategyState;
}

interface TemplateBuilderContextType {
  draftState: TemplateDraftState;
  updateDraftState: (updates: Partial<TemplateDraftState>) => void;
  initializeDraft: (template: any) => void;
  isInitialized: boolean;
}

const defaultDraftState: TemplateDraftState = {
  variableForm: {
    name: '',
    type: 'number',
    min: '',
    max: '',
    defaultValue: '',
    generator: 'random',
  },
  derivedForm: { name: '', expression: '' },
  constraintForm: { target: '', operator: '>', value: '' },
};

const TemplateBuilderContext = createContext<TemplateBuilderContextType | undefined>(undefined);

export function TemplateBuilderProvider({ children }: { children: ReactNode }) {
  const [draftState, setDraftState] = useState<TemplateDraftState>(defaultDraftState);
  const [isInitialized, setIsInitialized] = useState(false);
  const initializedRef = useRef(false);

  const updateDraftState = (updates: Partial<TemplateDraftState>) => {
    setDraftState((prev) => ({ ...prev, ...updates }));
  };

  const initializeDraft = (template: any) => {
    // Only initialize once to prevent overwriting user edits
    if (initializedRef.current || !template) return;
    
    // Parse Option Strategy from template logic
    let initialOptions = ['','','',''];
    let initialStrategy = 'static';
    
    try {
      const optionsTemplate = template?.structure?.optionsTemplate;
      if (optionsTemplate && Array.isArray(optionsTemplate) && optionsTemplate.length > 0) {
        if (optionsTemplate.length === 1 && optionsTemplate[0].startsWith('{')) {
          const parsed = JSON.parse(optionsTemplate[0]);
          if (parsed.strategy) initialStrategy = parsed.strategy;
          if (parsed.options) initialOptions = parsed.options;
        } else {
          initialOptions = optionsTemplate.length === 4 ? optionsTemplate : [...optionsTemplate, '', '', '', ''].slice(0, 4);
          initialStrategy = template?.config?.optionStrategy || 'static';
        }
      } else {
        if (template?.config?.optionStrategy) initialStrategy = template.config.optionStrategy;
        if (template?.config?.staticOptions && template.config.optionStrategy === 'static') initialOptions = template.config.staticOptions;
        if (template?.config?.formulas && template.config.optionStrategy === 'formula') initialOptions = template.config.formulas;
      }
    } catch (e) {
      console.error('Failed to parse options template', e);
    }

    setDraftState((prev) => ({
      ...prev,
      optionStrategy: {
        strategy: initialStrategy,
        options: initialOptions
      }
    }));
    
    initializedRef.current = true;
    setIsInitialized(true);
  };

  return (
    <TemplateBuilderContext.Provider value={{ draftState, updateDraftState, initializeDraft, isInitialized }}>
      {children}
    </TemplateBuilderContext.Provider>
  );
}

export function useTemplateBuilderContext() {
  const context = useContext(TemplateBuilderContext);
  if (!context) {
    throw new Error('useTemplateBuilderContext must be used within a TemplateBuilderProvider');
  }
  return context;
}
