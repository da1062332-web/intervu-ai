import React, { useState, useEffect } from 'react';
import { TemplateSection } from './TemplateSection';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useUpdateTemplate } from '@/services/templates/hooks';

interface OptionStrategySectionProps {
  template: any;
}

export function OptionStrategySection({ template }: OptionStrategySectionProps) {
  const [strategy, setStrategy] = useState('static');
  const [staticOptions, setStaticOptions] = useState<string[]>(['', '', '', '']);
  const [formulas, setFormulas] = useState<string[]>(['', '', '', '']);
  
  const { mutate: updateTemplate, isPending: isSaving } = useUpdateTemplate();

  useEffect(() => {
    if (template?.config?.optionStrategy) {
      setStrategy(template.config.optionStrategy);
    }
    if (template?.config?.staticOptions) {
      setStaticOptions(template.config.staticOptions);
    }
    if (template?.config?.formulas) {
      setFormulas(template.config.formulas);
    }
  }, [template?.id, template?.config]);

  const handleSave = () => {
    if (!template?.id) return;
    updateTemplate({
      templateId: template.id,
      payload: {
        config: {
          ...(template.config || {}),
          optionStrategy: strategy,
          ...(strategy === 'static' ? { staticOptions } : {}),
          ...(strategy === 'formula' ? { formulas } : {})
        }
      }
    });
  };

  const handleSelect = (val: string) => {
    console.log("Setting strategy to:", val);
    setStrategy(val);
  };

  return (
    <TemplateSection
      title="Option Strategy"
      description="Configure how multiple-choice options and distractors are generated for this template."
      actions={
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Strategy
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <Label className="text-base font-semibold">Generation Strategy</Label>
          <RadioGroup
            value={strategy}
            onValueChange={handleSelect}
            className="flex flex-col space-y-3"
          >
            <div 
              className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-all ${
                strategy === 'static' 
                  ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-900 border-gray-200'
              }`}
              onClick={() => handleSelect('static')}
            >
              <RadioGroupItem value="static" id="static" />
              <Label htmlFor="static" className="flex flex-col cursor-pointer">
                <span className="font-semibold text-sm text-foreground">Static</span>
                <span className="text-sm text-muted-foreground font-normal">Fixed options provided manually.</span>
              </Label>
            </div>
            
            <div 
              className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-all ${
                strategy === 'formula' 
                  ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-900 border-gray-200'
              }`}
              onClick={() => handleSelect('formula')}
            >
              <RadioGroupItem value="formula" id="formula" />
              <Label htmlFor="formula" className="flex flex-col cursor-pointer">
                <span className="font-semibold text-sm text-foreground">Formula</span>
                <span className="text-sm text-muted-foreground font-normal">Options calculated from variables (e.g., answer + 10).</span>
              </Label>
            </div>
            
            <div 
              className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-all ${
                strategy === 'dynamic' 
                  ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-900 border-gray-200'
              }`}
              onClick={() => handleSelect('dynamic')}
            >
              <RadioGroupItem value="dynamic" id="dynamic" />
              <Label htmlFor="dynamic" className="flex flex-col cursor-pointer">
                <span className="font-semibold text-sm text-foreground">Dynamic Constraints</span>
                <span className="text-sm text-muted-foreground font-normal">Distractors generated based on range constraints.</span>
              </Label>
            </div>
            
            <div 
              className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-all ${
                strategy === 'ai' 
                  ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-900 border-gray-200'
              }`}
              onClick={() => handleSelect('ai')}
            >
              <RadioGroupItem value="ai" id="ai" />
              <Label htmlFor="ai" className="flex flex-col cursor-pointer">
                <span className="font-semibold text-sm text-foreground">AI Assisted</span>
                <span className="text-sm text-muted-foreground font-normal">AI will generate plausible distractors based on the concept context.</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Dynamic Config Sections */}
        {strategy === 'static' && (
          <div className="space-y-4 p-5 border rounded-lg bg-gray-50/50 dark:bg-gray-900/50 animate-in fade-in slide-in-from-top-2">
            <div>
              <Label className="text-base font-semibold">Static Options Configuration</Label>
              <p className="text-sm text-muted-foreground mt-1">Provide exactly 4 fixed options. (e.g. for simple non-variable templates)</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="space-y-2">
                  <Label>Option {String.fromCharCode(65 + index)} {index === 0 && <span className="text-emerald-600 dark:text-emerald-400 font-medium">(Correct)</span>}</Label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={staticOptions[index]}
                      placeholder={index === 0 ? "Correct Answer" : "Distractor"}
                      onChange={(e) => {
                        const newOps = [...staticOptions];
                        newOps[index] = e.target.value;
                        setStaticOptions(newOps);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {strategy === 'formula' && (
          <div className="space-y-4 p-5 border rounded-lg bg-gray-50/50 dark:bg-gray-900/50 animate-in fade-in slide-in-from-top-2">
            <div>
              <Label className="text-base font-semibold">Formula Based Configuration</Label>
              <p className="text-sm text-muted-foreground mt-1">Define mathematical formulas to generate options using variables (e.g. <code>answer + 10</code>, <code>answer * 2</code>)</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="space-y-2">
                  <Label>Option {String.fromCharCode(65 + index)} {index === 0 && <span className="text-emerald-600 dark:text-emerald-400 font-medium">(Correct)</span>}</Label>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-md border text-muted-foreground">ƒ(x) = </span>
                    <input 
                      type="text" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono"
                      value={formulas[index]}
                      placeholder={index === 0 ? "answer" : "answer + (variable * 2)"}
                      onChange={(e) => {
                        const newForms = [...formulas];
                        newForms[index] = e.target.value;
                        setFormulas(newForms);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {strategy === 'dynamic' && (
          <div className="p-5 border rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-200 animate-in fade-in slide-in-from-top-2">
            <h4 className="font-semibold text-sm mb-2">Dynamic Range Generation</h4>
            <p className="text-sm opacity-90">
              The engine will automatically generate distractors based on the statistical range and constraints of the defined variables. Ensure you have properly set up <strong>min/max boundaries</strong> in the Variable Builder.
            </p>
          </div>
        )}

        {strategy === 'ai' && (
          <div className="p-5 border rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-200 animate-in fade-in slide-in-from-top-2">
            <h4 className="font-semibold text-sm mb-2">AI Generative Mode</h4>
            <p className="text-sm opacity-90">
              The AI will parse the template concept, difficulty, and question context to creatively hallucinate plausible distractors. This is ideal for qualitative or reading comprehension questions.
            </p>
          </div>
        )}
      </div>
    </TemplateSection>
  );
}
