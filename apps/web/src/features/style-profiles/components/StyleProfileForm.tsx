'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  useCreateStyleProfile,
  useUpdateStyleProfile,
} from '@/services/blueprints/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SectionHeader } from '@/components/ui/section-header';
import {
  Sparkles,
  Save,
  ArrowLeft,
  Settings,
  Languages,
  HelpCircle,
  BookOpen,
  MessageSquare,
  Plus,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface StyleProfileFormProps {
  initialData?: any;
  isEdit?: boolean;
}

type TabType = 'general' | 'language' | 'context' | 'difficulty' | 'distractors' | 'explanation' | 'ai';

export function StyleProfileForm({ initialData, isEdit = false }: StyleProfileFormProps) {
  const router = useRouter();
  const createMutation = useCreateStyleProfile();
  const updateMutation = useUpdateStyleProfile();

  const [activeTab, setActiveTab] = useState<TabType>('general');

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [profileType, setProfileType] = useState('campus');
  const [active, setActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);

  // Language Style
  const [language, setLanguage] = useState('English');
  const [sentenceLength, setSentenceLength] = useState('medium');
  const [vocabularyLevel, setVocabularyLevel] = useState('intermediate');
  const [grammarStyle, setGrammarStyle] = useState('formal');

  // Context Style
  const [preferredContexts, setPreferredContexts] = useState<string[]>([]);
  const [newContext, setNewContext] = useState('');

  // Difficulty Style
  const [easyRules, setEasyRules] = useState<string[]>([]);
  const [mediumRules, setMediumRules] = useState<string[]>([]);
  const [hardRules, setHardRules] = useState<string[]>([]);
  const [newRule, setNewRule] = useState('');
  const [ruleDifficulty, setRuleDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');

  // Distractor Rules
  const [exactlyFourOptions, setExactlyFourOptions] = useState(true);
  const [oneCorrectAnswer, setOneCorrectAnswer] = useState(true);
  const [plausibleIncorrectOptions, setPlausibleIncorrectOptions] = useState(true);
  const [avoidObviouslyWrongOptions, setAvoidObviouslyWrongOptions] = useState(true);
  const [avoidHumorousOptions, setAvoidHumorousOptions] = useState(true);
  const [representCommonStudentMistakes, setRepresentCommonStudentMistakes] = useState(true);

  // Explanation Style
  const [formulaFirst, setFormulaFirst] = useState(true);
  const [stepWiseSolution, setStepWiseSolution] = useState(true);
  const [maxSteps, setMaxSteps] = useState(4);
  const [explanationLength, setExplanationLength] = useState('medium');
  const [highlightFinalAnswer, setHighlightFinalAnswer] = useState(true);

  // AI Instructions
  const [aiInstructions, setAiInstructions] = useState('');

  // Populate form if editing
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setProfileType(initialData.profileType || 'campus');
      setActive(initialData.active !== false);
      setIsDefault(!!initialData.isDefault);

      // Language
      const ls = initialData.languageStyle || {};
      setLanguage(ls.language || 'English');
      setSentenceLength(ls.sentenceLength || 'medium');
      setVocabularyLevel(ls.vocabularyLevel || 'intermediate');
      setGrammarStyle(ls.grammarStyle || 'formal');

      // Context
      setPreferredContexts(initialData.contextStyle?.preferredContexts || []);

      // Difficulty Rules
      setEasyRules(initialData.difficultyStyle?.easy || []);
      setMediumRules(initialData.difficultyStyle?.medium || []);
      setHardRules(initialData.difficultyStyle?.hard || []);

      // Distractor Rules
      const dr = initialData.distractorRules || {};
      setExactlyFourOptions(dr.exactlyFourOptions !== false);
      setOneCorrectAnswer(dr.oneCorrectAnswer !== false);
      setPlausibleIncorrectOptions(dr.plausibleIncorrectOptions !== false);
      setAvoidObviouslyWrongOptions(dr.avoidObviouslyWrongOptions !== false);
      setAvoidHumorousOptions(dr.avoidHumorousOptions !== false);
      setRepresentCommonStudentMistakes(dr.representCommonStudentMistakes !== false);

      // Explanation
      const es = initialData.explanationStyle || {};
      setFormulaFirst(es.formulaFirst !== false);
      setStepWiseSolution(es.stepWiseSolution !== false);
      setMaxSteps(es.maxSteps || 4);
      setExplanationLength(es.explanationLength || 'medium');
      setHighlightFinalAnswer(es.highlightFinalAnswer !== false);

      // AI Instructions
      setAiInstructions(initialData.aiInstructions || '');
    }
  }, [initialData]);

  // Context Actions
  const addContext = () => {
    if (!newContext.trim()) return;
    if (preferredContexts.includes(newContext.trim())) return;
    setPreferredContexts([...preferredContexts, newContext.trim()]);
    setNewContext('');
  };

  const removeContext = (index: number) => {
    setPreferredContexts(preferredContexts.filter((_, i) => i !== index));
  };

  // Rule Actions
  const addRule = () => {
    if (!newRule.trim()) return;
    if (ruleDifficulty === 'easy') {
      setEasyRules([...easyRules, newRule.trim()]);
    } else if (ruleDifficulty === 'medium') {
      setMediumRules([...mediumRules, newRule.trim()]);
    } else {
      setHardRules([...hardRules, newRule.trim()]);
    }
    setNewRule('');
  };

  const removeRule = (difficulty: 'easy' | 'medium' | 'hard', index: number) => {
    if (difficulty === 'easy') {
      setEasyRules(easyRules.filter((_, i) => i !== index));
    } else if (difficulty === 'medium') {
      setMediumRules(mediumRules.filter((_, i) => i !== index));
    } else {
      setHardRules(hardRules.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Profile Name is required');
      return;
    }

    const payload = {
      name,
      description,
      profileType,
      active,
      isDefault,
      languageStyle: {
        language,
        sentenceLength,
        vocabularyLevel,
        grammarStyle,
      },
      contextStyle: {
        preferredContexts,
      },
      difficultyStyle: {
        easy: easyRules,
        medium: mediumRules,
        hard: hardRules,
      },
      distractorRules: {
        exactlyFourOptions,
        oneCorrectAnswer,
        plausibleIncorrectOptions,
        avoidObviouslyWrongOptions,
        avoidHumorousOptions,
        representCommonStudentMistakes,
      },
      explanationStyle: {
        formulaFirst,
        stepWiseSolution,
        maxSteps,
        explanationLength,
        highlightFinalAnswer,
      },
      aiInstructions,
    };

    try {
      if (isEdit && initialData?.id) {
        await updateMutation.mutateAsync({ id: initialData.id, data: payload });
        toast.success('Style Profile updated successfully');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Style Profile created successfully');
      }
      router.push('/admin/style-profiles');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save Style Profile');
    }
  };

  const tabs: Array<{ id: TabType; label: string; icon: React.ReactNode }> = [
    { id: 'general', label: 'General Info', icon: <Settings className="h-4 w-4" /> },
    { id: 'language', label: 'Language Style', icon: <Languages className="h-4 w-4" /> },
    { id: 'context', label: 'Contexts', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'difficulty', label: 'Difficulty Rules', icon: <HelpCircle className="h-4 w-4" /> },
    { id: 'distractors', label: 'Distractor Rules', icon: <HelpCircle className="h-4 w-4" /> },
    { id: 'explanation', label: 'Explanation Style', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'ai', label: 'AI Instructions', icon: <Sparkles className="h-4 w-4" /> },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <SectionHeader
          title={isEdit ? 'Edit Style Profile' : 'New Style Profile'}
          description="Customize the formatting and quality constraints used for AI question generation."
          className="!mb-0"
        />
        <div className="flex items-center gap-3 shrink-0">
          <Button type="button" variant="outline" onClick={() => router.push('/admin/style-profiles')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={updateMutation.isPending || createMutation.isPending}>
            <Save className="h-4 w-4 mr-2" /> {isEdit ? 'Save Changes' : 'Create Profile'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="flex flex-col gap-1 bg-card border rounded-xl p-3 shadow-sm h-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-left ${
                activeTab === tab.id
                  ? 'bg-primary/10 text-primary shadow-sm border-l-4 border-primary'
                  : 'hover:bg-muted/10 text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <Card className="lg:col-span-3">
          <CardContent className="p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Profile Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Campus Placement English Style"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Profile Type</Label>
                    <select
                      id="type"
                      value={profileType}
                      onChange={(e) => setProfileType(e.target.value)}
                      className="w-full h-10 px-3 border rounded-md bg-background text-sm shadow-sm"
                    >
                      <option value="campus">Campus Recruit</option>
                      <option value="lateral">Lateral Hire</option>
                      <option value="executive">Executive Level</option>
                      <option value="certification">Certification Course</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide a short summary explaining when this profile should be assigned."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="flex flex-col gap-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="active" className="font-semibold">Active Status</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Inactive profiles cannot be assigned to new blueprints.</p>
                    </div>
                    <Switch id="active" checked={active} onCheckedChange={setActive} />
                  </div>

                  <div className="flex items-center justify-between border-t pt-4">
                    <div>
                      <Label htmlFor="default" className="font-semibold">Global Default Profile</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Mark this profile as the default style rule for all standard generation.</p>
                    </div>
                    <Switch id="default" checked={isDefault} onCheckedChange={setIsDefault} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'language' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Language Style Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="language">Target Language</Label>
                    <Input
                      id="language"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sentence-length">Sentence Length</Label>
                    <select
                      id="sentence-length"
                      value={sentenceLength}
                      onChange={(e) => setSentenceLength(e.target.value)}
                      className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                    >
                      <option value="short">Short (easy comprehension)</option>
                      <option value="medium">Medium (standard)</option>
                      <option value="long">Long (complex / reasoning focused)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vocabulary">Vocabulary Complexity</Label>
                    <select
                      id="vocabulary"
                      value={vocabularyLevel}
                      onChange={(e) => setVocabularyLevel(e.target.value)}
                      className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                    >
                      <option value="basic">Basic (plain english)</option>
                      <option value="intermediate">Intermediate (professional)</option>
                      <option value="advanced">Advanced (academic / rich vocabulary)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grammar">Grammar Style</Label>
                    <select
                      id="grammar"
                      value={grammarStyle}
                      onChange={(e) => setGrammarStyle(e.target.value)}
                      className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                    >
                      <option value="formal">Formal</option>
                      <option value="casual">Casual</option>
                      <option value="technical">Technical / Rigorous</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'context' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Context Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Specify industry verticals or scenarios (e.g. "finance", "healthcare") you prefer the AI to build questions around.
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Real Estate, Software Architecture"
                    value={newContext}
                    onChange={(e) => setNewContext(e.target.value)}
                  />
                  <Button type="button" onClick={addContext} variant="secondary" className="shadow-sm">
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {preferredContexts.map((ctx, index) => (
                    <span
                      key={index}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
                    >
                      {ctx}
                      <button type="button" onClick={() => removeContext(index)} className="hover:text-destructive text-primary/70 font-bold">
                        ×
                      </button>
                    </span>
                  ))}
                  {preferredContexts.length === 0 && (
                    <span className="text-sm text-muted-foreground">No custom contexts defined. Standard scenarios will be used.</span>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'difficulty' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Difficulty-Specific Presentation Rules</h3>
                <div className="bg-muted/30 border rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Difficulty Level</Label>
                      <select
                        value={ruleDifficulty}
                        onChange={(e) => setRuleDifficulty(e.target.value as any)}
                        className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label>Wording Expectation</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g. Use direct phrasing and avoid double negatives"
                          value={newRule}
                          onChange={(e) => setNewRule(e.target.value)}
                        />
                        <Button type="button" onClick={addRule} variant="secondary" className="shadow-sm">
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-emerald-600 mb-2">Easy Level Rules</h4>
                    <div className="space-y-1.5">
                      {easyRules.map((rule, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 border rounded-lg bg-background text-xs">
                          <span>{rule}</span>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeRule('easy', idx)} className="h-6 w-6 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {easyRules.length === 0 && <p className="text-xs text-muted-foreground pl-1">No rules added.</p>}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-amber-600 mb-2">Medium Level Rules</h4>
                    <div className="space-y-1.5">
                      {mediumRules.map((rule, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 border rounded-lg bg-background text-xs">
                          <span>{rule}</span>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeRule('medium', idx)} className="h-6 w-6 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {mediumRules.length === 0 && <p className="text-xs text-muted-foreground pl-1">No rules added.</p>}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-rose-600 mb-2">Hard Level Rules</h4>
                    <div className="space-y-1.5">
                      {hardRules.map((rule, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 border rounded-lg bg-background text-xs">
                          <span>{rule}</span>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeRule('hard', idx)} className="h-6 w-6 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {hardRules.length === 0 && <p className="text-xs text-muted-foreground pl-1">No rules added.</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'distractors' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Distractor & Option Constraints</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <Label className="font-semibold">Exactly 4 Options</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Enforce a strict 4-options count for multiple choice questions.</p>
                    </div>
                    <Switch checked={exactlyFourOptions} onCheckedChange={setExactlyFourOptions} />
                  </div>

                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <Label className="font-semibold">Exactly 1 Correct Option</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Do not generate questions with multiple correct options.</p>
                    </div>
                    <Switch checked={oneCorrectAnswer} onCheckedChange={setOneCorrectAnswer} />
                  </div>

                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <Label className="font-semibold">Plausible Incorrect Options</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Incorrect choices must be reasonable and make mathematical sense.</p>
                    </div>
                    <Switch checked={plausibleIncorrectOptions} onCheckedChange={setPlausibleIncorrectOptions} />
                  </div>

                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <Label className="font-semibold">Avoid Obviously Wrong Options</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Filter out options that can be easily discarded without calculation.</p>
                    </div>
                    <Switch checked={avoidObviouslyWrongOptions} onCheckedChange={setAvoidObviouslyWrongOptions} />
                  </div>

                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <Label className="font-semibold">Avoid Humorous Options</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Ensure options maintain a serious and professional academic tone.</p>
                    </div>
                    <Switch checked={avoidHumorousOptions} onCheckedChange={setAvoidHumorousOptions} />
                  </div>

                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <Label className="font-semibold">Represent Common Mistakes</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Formulate distractors that model student slipups (e.g. sign errors).</p>
                    </div>
                    <Switch checked={representCommonStudentMistakes} onCheckedChange={setRepresentCommonStudentMistakes} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'explanation' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Explanation Formatting Style</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <Label className="font-semibold">Formula / Rule First</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Begin explanations by stating the core mathematical formula.</p>
                    </div>
                    <Switch checked={formulaFirst} onCheckedChange={setFormulaFirst} />
                  </div>

                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <Label className="font-semibold">Step-Wise Solution Layout</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Structure solutions in sequentially numbered steps.</p>
                    </div>
                    <Switch checked={stepWiseSolution} onCheckedChange={setStepWiseSolution} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-steps">Max Explanation Steps</Label>
                    <Input
                      id="max-steps"
                      type="number"
                      value={maxSteps}
                      min={1}
                      max={10}
                      onChange={(e) => setMaxSteps(parseInt(e.target.value) || 4)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exp-length">Explanation Length</Label>
                    <select
                      id="exp-length"
                      value={explanationLength}
                      onChange={(e) => setExplanationLength(e.target.value)}
                      className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                    >
                      <option value="short">Short / Direct</option>
                      <option value="medium">Medium / Standard</option>
                      <option value="long">Detailed / Analytical</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between md:col-span-2 pt-2">
                    <div>
                      <Label className="font-semibold">Highlight Final Answer</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Explicitly wrap or reference the final correct option at the end.</p>
                    </div>
                    <Switch checked={highlightFinalAnswer} onCheckedChange={setHighlightFinalAnswer} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Custom AI System Instructions</h3>
                <p className="text-sm text-muted-foreground">
                  Provide custom prompts, vocabulary lists, or style guidelines that will be directly appended to the system prompts.
                </p>
                <Textarea
                  placeholder="e.g. Prefer Metric units. Do not refer to gender-specific names in word problems. Use variables x, y, z only."
                  value={aiInstructions}
                  onChange={(e) => setAiInstructions(e.target.value)}
                  className="min-h-[200px]"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
