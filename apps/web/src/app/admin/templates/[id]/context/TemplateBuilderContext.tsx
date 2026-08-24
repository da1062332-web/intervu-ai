'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';

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

  // FE-01 Tab states
  questionDefinition?: {
    statement: string;
    instructions: string;
  };
  solutionLogic?: {
    solutionTemplate: string;
    explanationTemplate: string;
  };
  datasetConfig?: {
    selectedDatasetId: string;
    selectionMethod: 'RANDOM' | 'SEQUENTIAL' | 'SPECIFIC';
    sampleSize: number;
    shuffle: boolean;
    allowReuse: boolean;
    specificItemId: string;
    variableMapping: Record<string, string>;
  };
  datasetQuestionDefinition?: {
    stem: string;
    instructions: string;
    generationPrompt: string;
    showStem: boolean;
    showInstructions: boolean;
  };
  generationStrategyUI?: {
    variableModalOpen: boolean;
    constraintModalOpen: boolean;
    derivedModalOpen: boolean;
    editingVariable: any;
    editingDerived: any;
    editingConstraint: any;
    aiPrompt: string;
    draftedStrategy: any;
    showAiSection: boolean;
    validationWarnings: string[];
  };
  // FE-05 preview values
  previewValues?: Record<string, string>;
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

  const updateDraftState = useCallback((updates: Partial<TemplateDraftState>) => {
    setDraftState((prev) => ({ ...prev, ...updates }));
  }, []);

  const initializeDraft = useCallback((template: any) => {
    // Only initialize once to prevent overwriting user edits
    if (initializedRef.current || !template) return;
    
    // Parse Option Strategy from template logic
    let initialOptions = ['', '', '', ''];
    let initialStrategy = 'static';
    
    try {
      const optionsTemplate = template?.structure?.optionsTemplate;
      if (optionsTemplate && Array.isArray(optionsTemplate) && optionsTemplate.length > 0) {
        if (optionsTemplate.length === 1 && typeof optionsTemplate[0] === 'string' && optionsTemplate[0].startsWith('{')) {
          const parsed = JSON.parse(optionsTemplate[0]);
          if (parsed.strategy) initialStrategy = parsed.strategy;
          if (parsed.options && Array.isArray(parsed.options)) initialOptions = parsed.options;
        } else {
          initialOptions = optionsTemplate.length >= 2 ? optionsTemplate : [...optionsTemplate, ...Array(2 - optionsTemplate.length).fill('')];
          initialStrategy = template?.config?.optionStrategy || 'static';
        }
      } else {
        if (template?.config?.optionStrategy) initialStrategy = template.config.optionStrategy;
        if (template?.config?.staticOptions && template.config.optionStrategy === 'static' && Array.isArray(template.config.staticOptions)) {
          initialOptions = template.config.staticOptions;
        }
        if (template?.config?.formulas && template.config.optionStrategy === 'formula' && Array.isArray(template.config.formulas)) {
          initialOptions = template.config.formulas;
        }
      }
    } catch (e) {
      console.error('Failed to parse options template', e);
    }

    // Parse Question Definition
    const questionStatement = template?.structure?.questionStatement ?? template?.structure?.questionTemplate ?? '';
    const questionInstructions = template?.structure?.instructions ?? '';

    // Parse Solution Logic
    const solutionTemplate = template?.solutionSchema?.solutionTemplate ?? '';
    const explanationTemplate = template?.solutionSchema?.explanationTemplate ?? '';

    // Parse Dataset Config
    const datasetId = template?.datasetId ?? template?.config?.datasetId ?? '';
    const dsConfig = template?.config?.datasetConfig || {};
    const selectionMethod = dsConfig.selectionMethod || 'RANDOM';
    const sampleSize = dsConfig.sampleSize || 1;
    const shuffle = dsConfig.shuffle ?? true;
    const allowReuse = dsConfig.allowReuse ?? false;
    const specificItemId = dsConfig.specificItemId || '';
    const variableMapping = dsConfig.variableMapping || {};

    // Parse Dataset Question Definition
    let stem = '';
    let instructions = '';
    let generationPrompt = 'Generate one MCQ from this passage.';
    let showStem = true;
    let showInstructions = true;
    if (template?.structure?.questionTemplate !== undefined) {
      let parsed = template.structure.questionTemplate;
      if (typeof parsed === 'string') {
        try {
          parsed = JSON.parse(parsed);
        } catch (e) {
          stem = parsed;
        }
      }
      if (typeof parsed === 'object' && parsed !== null) {
        if (parsed.stem !== undefined) stem = parsed.stem;
        if (parsed.instructions !== undefined) instructions = parsed.instructions;
        if (parsed.generationPrompt !== undefined) generationPrompt = parsed.generationPrompt;
        if (parsed.showStem !== undefined) showStem = parsed.showStem;
        if (parsed.showInstructions !== undefined) showInstructions = parsed.showInstructions;
      }
    }

    // Parse Preview values
    const previewValues: Record<string, string> = {};
    if (template?.variableSchema?.variables && Array.isArray(template.variableSchema.variables)) {
      for (const v of template.variableSchema.variables) {
        if (v.name) {
          previewValues[v.name] = v.defaultValue !== undefined ? String(v.defaultValue) : '';
        }
      }
    }

    setDraftState((prev) => ({
      ...prev,
      optionStrategy: {
        strategy: initialStrategy,
        options: initialOptions
      },
      questionDefinition: {
        statement: questionStatement,
        instructions: questionInstructions,
      },
      solutionLogic: {
        solutionTemplate,
        explanationTemplate,
      },
      datasetConfig: {
        selectedDatasetId: datasetId,
        selectionMethod,
        sampleSize,
        shuffle,
        allowReuse,
        specificItemId,
        variableMapping,
      },
      datasetQuestionDefinition: {
        stem,
        instructions,
        generationPrompt,
        showStem,
        showInstructions,
      },
      generationStrategyUI: {
        variableModalOpen: false,
        constraintModalOpen: false,
        derivedModalOpen: false,
        editingVariable: null,
        editingDerived: null,
        editingConstraint: null,
        aiPrompt: '',
        draftedStrategy: null,
        showAiSection: true,
        validationWarnings: [],
      },
      previewValues,
    }));
    
    initializedRef.current = true;
    setIsInitialized(true);
  }, []);

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
