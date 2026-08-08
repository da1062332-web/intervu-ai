'use client';

import React, { useState, useEffect } from 'react';
import { useSections } from '@/services/exam-sections/hooks';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { apiClient } from '@/services/api/client';
import { Award, CheckCircle2, ShieldCheck, Code, BookOpen, Layers, Sparkles } from 'lucide-react';

interface HiringEvaluationTabProps {
  configId: string;
  onNext?: () => void;
}

const STRATEGIES = [
  { value: 'TCS', label: 'TCS Hiring Evaluation Strategy' },
  { value: 'CUSTOM', label: 'Custom Corporate Strategy' },
];

export function HiringEvaluationTab({ configId, onNext }: HiringEvaluationTabProps) {
  const { data: sections = [], isLoading: isSectionsLoading } = useSections(configId);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [enabled, setEnabled] = useState(false);
  const [strategy, setStrategy] = useState('TCS');
  const [customStrategyName, setCustomStrategyName] = useState('');
  const [ninjaThreshold, setNinjaThreshold] = useState(15);
  const [digitalThreshold, setDigitalThreshold] = useState(25);
  const [primeThreshold, setPrimeThreshold] = useState(35);

  const [numericalSection, setNumericalSection] = useState('');
  const [numericalMin, setNumericalMin] = useState(5);

  const [verbalSection, setVerbalSection] = useState('');
  const [verbalMin, setVerbalMin] = useState(5);

  const [reasoningSection, setReasoningSection] = useState('');
  const [reasoningMin, setReasoningMin] = useState(5);

  const [advancedSection, setAdvancedSection] = useState('');
  const [advancedDigitalMin, setAdvancedDigitalMin] = useState(8);
  const [advancedPrimeMin, setAdvancedPrimeMin] = useState(12);

  const [codingSection, setCodingSection] = useState('');
  const [codingTotalProblems, setCodingTotalProblems] = useState(2);
  const [codingDigitalMinSolved, setCodingDigitalMinSolved] = useState(1);
  const [codingPrimeMinSolved, setCodingPrimeMinSolved] = useState(2);

  const [savedStrategies, setSavedStrategies] = useState<any[]>([]);

  useEffect(() => {
    async function loadSavedStrategies() {
      try {
        const list = await apiClient
          .request<any[]>('/admin/hiring-strategies', { skipErrorToast: true })
          .catch(() => []);
        if (Array.isArray(list)) {
          setSavedStrategies(list);
        }
      } catch (err) {
        console.error('Failed to load saved strategies', err);
      }
    }
    loadSavedStrategies();
  }, []);

  useEffect(() => {
    async function fetchHiringConfig() {
      try {
        setLoading(true);
        const data = await apiClient.request<any>(`/admin/configs/${configId}/hiring-evaluation`);
        if (data) {
          setEnabled(!!data.enabled);
          if (data.strategy) {
            setStrategy(data.strategy);
            const isKnownPreset =
              data.strategy === 'TCS' || savedStrategies.some((s) => s.strategy === data.strategy);
            if (!isKnownPreset && data.strategy !== 'TCS') {
              setCustomStrategyName(data.strategy);
            }
          }
          if (data.ninjaThreshold !== undefined) setNinjaThreshold(data.ninjaThreshold);
          if (data.digitalThreshold !== undefined) setDigitalThreshold(data.digitalThreshold);
          if (data.primeThreshold !== undefined) setPrimeThreshold(data.primeThreshold);
          if (data.advancedDigitalMin !== undefined) setAdvancedDigitalMin(data.advancedDigitalMin);
          if (data.advancedPrimeMin !== undefined) setAdvancedPrimeMin(data.advancedPrimeMin);
          if (data.codingTotalProblems !== undefined)
            setCodingTotalProblems(data.codingTotalProblems);
          if (data.codingDigitalMinSolved !== undefined)
            setCodingDigitalMinSolved(data.codingDigitalMinSolved);
          if (data.codingPrimeMinSolved !== undefined)
            setCodingPrimeMinSolved(data.codingPrimeMinSolved);

          if (Array.isArray(data.sectionMappings)) {
            data.sectionMappings.forEach((m: any) => {
              if (m.mappingType === 'NUMERICAL') {
                setNumericalSection(m.sectionCode);
                setNumericalMin(m.minimumCorrectAnswers);
              } else if (m.mappingType === 'VERBAL') {
                setVerbalSection(m.sectionCode);
                setVerbalMin(m.minimumCorrectAnswers);
              } else if (m.mappingType === 'REASONING') {
                setReasoningSection(m.sectionCode);
                setReasoningMin(m.minimumCorrectAnswers);
              } else if (m.mappingType === 'ADVANCED_APTITUDE') {
                setAdvancedSection(m.sectionCode);
              } else if (m.mappingType === 'CODING') {
                setCodingSection(m.sectionCode);
              }
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch hiring config', err);
      } finally {
        setLoading(false);
      }
    }

    fetchHiringConfig();
  }, [configId]);

  const handleStrategySelect = (selectedVal: string) => {
    setStrategy(selectedVal);
    if (selectedVal === 'CUSTOM') {
      setCustomStrategyName('');
      return;
    }

    const preset = savedStrategies.find((s) => s.strategy === selectedVal);
    if (preset) {
      if (preset.ninjaThreshold !== undefined) setNinjaThreshold(preset.ninjaThreshold);
      if (preset.digitalThreshold !== undefined) setDigitalThreshold(preset.digitalThreshold);
      if (preset.primeThreshold !== undefined) setPrimeThreshold(preset.primeThreshold);
      if (preset.advancedDigitalMin !== undefined) setAdvancedDigitalMin(preset.advancedDigitalMin);
      if (preset.advancedPrimeMin !== undefined) setAdvancedPrimeMin(preset.advancedPrimeMin);
      if (preset.codingTotalProblems !== undefined)
        setCodingTotalProblems(preset.codingTotalProblems);
      if (preset.codingDigitalMinSolved !== undefined)
        setCodingDigitalMinSolved(preset.codingDigitalMinSolved);
      if (preset.codingPrimeMinSolved !== undefined)
        setCodingPrimeMinSolved(preset.codingPrimeMinSolved);
      if (preset.numericalMin !== undefined) setNumericalMin(preset.numericalMin);
      if (preset.verbalMin !== undefined) setVerbalMin(preset.verbalMin);
      if (preset.reasoningMin !== undefined) setReasoningMin(preset.reasoningMin);

      toast.info(`Loaded preset settings from strategy '${preset.name || selectedVal}'!`);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const sectionMappings = [];
      if (numericalSection) {
        const sec = sections.find((s) => s.code === numericalSection);
        sectionMappings.push({
          sectionCode: numericalSection,
          sectionName: sec?.name || 'Numerical Ability',
          mappingType: 'NUMERICAL',
          minimumCorrectAnswers: numericalMin,
        });
      }
      if (verbalSection) {
        const sec = sections.find((s) => s.code === verbalSection);
        sectionMappings.push({
          sectionCode: verbalSection,
          sectionName: sec?.name || 'Verbal Ability',
          mappingType: 'VERBAL',
          minimumCorrectAnswers: verbalMin,
        });
      }
      if (reasoningSection) {
        const sec = sections.find((s) => s.code === reasoningSection);
        sectionMappings.push({
          sectionCode: reasoningSection,
          sectionName: sec?.name || 'Reasoning Ability',
          mappingType: 'REASONING',
          minimumCorrectAnswers: reasoningMin,
        });
      }
      if (advancedSection) {
        const sec = sections.find((s) => s.code === advancedSection);
        sectionMappings.push({
          sectionCode: advancedSection,
          sectionName: sec?.name || 'Advanced Aptitude',
          mappingType: 'ADVANCED_APTITUDE',
          minimumCorrectAnswers: 0,
        });
      }
      if (codingSection) {
        const sec = sections.find((s) => s.code === codingSection);
        sectionMappings.push({
          sectionCode: codingSection,
          sectionName: sec?.name || 'Coding',
          mappingType: 'CODING',
          minimumCorrectAnswers: 0,
        });
      }

      const effectiveStrategy =
        strategy === 'CUSTOM' ? customStrategyName.trim() || 'CUSTOM' : strategy;

      const payload = {
        examConfigId: configId,
        strategy: effectiveStrategy,
        enabled,
        ninjaThreshold,
        digitalThreshold,
        primeThreshold,
        advancedDigitalMin,
        advancedPrimeMin,
        codingTotalProblems,
        codingDigitalMinSolved,
        codingPrimeMinSolved,
        sectionMappings,
      };

      await apiClient.request(`/admin/configs/${configId}/hiring-evaluation`, {
        method: 'PATCH',
        body: payload,
      });

      toast.success('Hiring Evaluation Configuration saved successfully');
      if (onNext) onNext();
    } catch (err) {
      toast.error('Failed to save Hiring Evaluation Configuration');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || isSectionsLoading) {
    return (
      <div className='flex items-center justify-center h-48'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    );
  }

  return (
    <div className='max-w-4xl mx-auto space-y-8 py-4'>
      <div className='flex items-center justify-between'>
        <div className='space-y-1'>
          <div className='flex items-center gap-2'>
            <h3 className='text-2xl font-semibold tracking-tight'>
              Hiring Evaluation Configuration
            </h3>
            <Badge variant='outline' className='bg-primary/5 text-primary border-primary/20'>
              Strategy Pattern
            </Badge>
          </div>
          <p className='text-muted-foreground'>
            Configure candidate qualification thresholds (Ninja, Digital, Prime) using corporate
            evaluation strategies.
          </p>
        </div>
      </div>

      {/* Enable Toggle Card */}
      <Card className='border shadow-sm'>
        <CardContent className='p-6'>
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label htmlFor='hiring-toggle' className='text-lg font-medium'>
                Enable Hiring Qualification Evaluation
              </Label>
              <p className='text-sm text-muted-foreground'>
                Automatically classify candidates into NOT_QUALIFIED, NINJA, DIGITAL, or PRIME
                post-assessment.
              </p>
            </div>
            <Switch id='hiring-toggle' checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </CardContent>
      </Card>

      {enabled && (
        <>
          {/* Strategy Selection Card */}
          <Card className='border shadow-sm'>
            <CardHeader className='pb-4'>
              <CardTitle className='text-lg flex items-center gap-2'>
                <Sparkles className='h-5 w-5 text-primary' />
                Evaluation Strategy
              </CardTitle>
              <CardDescription>
                Select the corporate qualification ruleset to execute for this assessment.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='strategy-select'>Hiring Strategy</Label>
                <Select value={strategy} onValueChange={handleStrategySelect}>
                  <SelectTrigger id='strategy-select' className='w-full'>
                    <SelectValue placeholder='Select strategy' />
                  </SelectTrigger>
                  <SelectContent>
                    {savedStrategies.map((st) => (
                      <SelectItem key={st.strategy} value={st.strategy}>
                        {st.name || st.strategy}
                      </SelectItem>
                    ))}
                    <SelectItem value='CUSTOM'>Custom Corporate Strategy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {strategy === 'CUSTOM' && (
                <div className='space-y-2 pt-2 border-t mt-3'>
                  <Label htmlFor='custom-strategy-name'>Custom Strategy Name</Label>
                  <Input
                    id='custom-strategy-name'
                    placeholder='Enter corporate strategy name (e.g., Wipro, Infosys, Accenture...)'
                    value={customStrategyName}
                    onChange={(e) => setCustomStrategyName(e.target.value)}
                  />
                  <p className='text-xs text-muted-foreground'>
                    Give your custom strategy a name so you can reuse and identify it for future
                    evaluation runs.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section Mappings Card */}
          <Card className='border shadow-sm'>
            <CardHeader className='pb-4'>
              <CardTitle className='text-lg flex items-center gap-2'>
                <Layers className='h-5 w-5 text-primary' />
                Section Mappings & Sectional Cutoffs
              </CardTitle>
              <CardDescription>
                Map existing assessment sections to Foundation, Advanced, and Coding categories.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Numerical Ability */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/20'>
                <div className='space-y-2'>
                  <Label>Numerical Ability Section</Label>
                  <Select value={numericalSection} onValueChange={setNumericalSection}>
                    <SelectTrigger>
                      <SelectValue placeholder='Select Section' />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((sec) => (
                        <SelectItem key={sec.code} value={sec.code}>
                          {sec.name} ({sec.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label>Minimum Correct Answers</Label>
                  <Input
                    type='number'
                    min={0}
                    value={numericalMin}
                    onChange={(e) => setNumericalMin(parseInt(e.target.value, 10) || 0)}
                  />
                </div>
              </div>

              {/* Verbal Ability */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/20'>
                <div className='space-y-2'>
                  <Label>Verbal Ability Section</Label>
                  <Select value={verbalSection} onValueChange={setVerbalSection}>
                    <SelectTrigger>
                      <SelectValue placeholder='Select Section' />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((sec) => (
                        <SelectItem key={sec.code} value={sec.code}>
                          {sec.name} ({sec.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label>Minimum Correct Answers</Label>
                  <Input
                    type='number'
                    min={0}
                    value={verbalMin}
                    onChange={(e) => setVerbalMin(parseInt(e.target.value, 10) || 0)}
                  />
                </div>
              </div>

              {/* Reasoning Ability */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/20'>
                <div className='space-y-2'>
                  <Label>Reasoning Ability Section</Label>
                  <Select value={reasoningSection} onValueChange={setReasoningSection}>
                    <SelectTrigger>
                      <SelectValue placeholder='Select Section' />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((sec) => (
                        <SelectItem key={sec.code} value={sec.code}>
                          {sec.name} ({sec.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label>Minimum Correct Answers</Label>
                  <Input
                    type='number'
                    min={0}
                    value={reasoningMin}
                    onChange={(e) => setReasoningMin(parseInt(e.target.value, 10) || 0)}
                  />
                </div>
              </div>

              {/* Advanced Aptitude */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/20'>
                <div className='space-y-2'>
                  <Label>Advanced Aptitude Section</Label>
                  <Select value={advancedSection} onValueChange={setAdvancedSection}>
                    <SelectTrigger>
                      <SelectValue placeholder='Select Section' />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((sec) => (
                        <SelectItem key={sec.code} value={sec.code}>
                          {sec.name} ({sec.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label>Digital Min Correct</Label>
                  <Input
                    type='number'
                    min={0}
                    value={advancedDigitalMin}
                    onChange={(e) => setAdvancedDigitalMin(parseInt(e.target.value, 10) || 0)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Prime Min Correct</Label>
                  <Input
                    type='number'
                    min={0}
                    value={advancedPrimeMin}
                    onChange={(e) => setAdvancedPrimeMin(parseInt(e.target.value, 10) || 0)}
                  />
                </div>
              </div>

              {/* Coding Section */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/20'>
                <div className='space-y-2'>
                  <Label>Coding Section</Label>
                  <Select value={codingSection} onValueChange={setCodingSection}>
                    <SelectTrigger>
                      <SelectValue placeholder='Select Section' />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((sec) => (
                        <SelectItem key={sec.code} value={sec.code}>
                          {sec.name} ({sec.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label>Digital Min Solved</Label>
                  <Input
                    type='number'
                    min={0}
                    value={codingDigitalMinSolved}
                    onChange={(e) => setCodingDigitalMinSolved(parseInt(e.target.value, 10) || 0)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Prime Min Solved</Label>
                  <Input
                    type='number'
                    min={0}
                    value={codingPrimeMinSolved}
                    onChange={(e) => setCodingPrimeMinSolved(parseInt(e.target.value, 10) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Foundation Thresholds Card */}
          <Card className='border shadow-sm'>
            <CardHeader className='pb-4'>
              <CardTitle className='text-lg flex items-center gap-2'>
                <Award className='h-5 w-5 text-primary' />
                Foundation Thresholds & Tier Cutoffs
              </CardTitle>
              <CardDescription>
                Configure total foundation correct answer thresholds for Ninja, Digital, and Prime
                tiers.
              </CardDescription>
            </CardHeader>
            <CardContent className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div className='space-y-2 p-4 border rounded-lg bg-blue-50/30 border-blue-200'>
                <Label className='text-blue-700 font-semibold'>Ninja Minimum Total</Label>
                <Input
                  type='number'
                  min={0}
                  value={ninjaThreshold}
                  onChange={(e) => setNinjaThreshold(parseInt(e.target.value, 10) || 0)}
                />
                <p className='text-xs text-muted-foreground'>
                  Min total correct in Foundation sections for Ninja
                </p>
              </div>

              <div className='space-y-2 p-4 border rounded-lg bg-purple-50/30 border-purple-200'>
                <Label className='text-purple-700 font-semibold'>Digital Minimum Total</Label>
                <Input
                  type='number'
                  min={0}
                  value={digitalThreshold}
                  onChange={(e) => setDigitalThreshold(parseInt(e.target.value, 10) || 0)}
                />
                <p className='text-xs text-muted-foreground'>
                  Min total correct in Foundation sections for Digital
                </p>
              </div>

              <div className='space-y-2 p-4 border rounded-lg bg-amber-50/30 border-amber-200'>
                <Label className='text-amber-700 font-semibold'>Prime Minimum Total</Label>
                <Input
                  type='number'
                  min={0}
                  value={primeThreshold}
                  onChange={(e) => setPrimeThreshold(parseInt(e.target.value, 10) || 0)}
                />
                <p className='text-xs text-muted-foreground'>
                  Min total correct in Foundation sections for Prime
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Save Button */}
      <div className='flex justify-end gap-3 pt-4 border-t'>
        <Button onClick={handleSave} disabled={saving} className='px-8'>
          {saving ? 'Saving...' : 'Save Hiring Configuration'}
        </Button>
      </div>
    </div>
  );
}
