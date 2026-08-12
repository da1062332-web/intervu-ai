'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SectionHeader } from '@/components/ui/section-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Cpu,
  Play,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Sliders,
  FileCode,
  ShieldCheck,
  Zap,
  Info,
} from 'lucide-react';
import {
  useCodingOracles,
  useCodingOracle,
  useTestCodingOracle,
} from '@/services/coding-oracles/hooks';
import { CodingOracleItem } from '@/services/coding-oracles/api';

function getSeedForOracleKey(oracleKey: string): number {
  if (!oracleKey) return 42;
  let hash = 0;
  for (let i = 0; i < oracleKey.length; i++) {
    hash = (hash << 5) - hash + oracleKey.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 90000) + 10000;
}

export default function OraclePlaygroundPage() {
  const params = useParams();
  const router = useRouter();
  const oracleIdOrKey = (params?.id as string) || '';

  // 1. Fetch Oracle list for switcher
  const { data: listData } = useCodingOracles(undefined, undefined, undefined, 1, 100);
  const allOracles = listData?.items || [];

  // 2. Fetch active selected Oracle
  const { data: selectedOracle, isLoading: isLoadingOracle, refetch } = useCodingOracle(oracleIdOrKey);
  const testMutation = useTestCodingOracle();

  // Controls State
  const [difficulty, setDifficulty] = useState<string>('MEDIUM');
  const [seed, setSeed] = useState<number>(42);
  const [parameterSchemaJson, setParameterSchemaJson] = useState<string>('{}');
  const [testResult, setTestResult] = useState<any>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const handleOracleChange = (newKeyOrId: string) => {
    router.push(`/admin/coding-oracles/${newKeyOrId}/playground`);
  };

  const handleRandomizeSeed = () => {
    const newSeed = Math.floor(Math.random() * 100000);
    setSeed(newSeed);
    handleExecute(newSeed);
  };

  const handleExecute = async (overrideSeed?: number, overrideDiff?: string, overrideSchemaJson?: string) => {
    if (!selectedOracle) return;
    setJsonError(null);

    const activeSeed = overrideSeed !== undefined ? overrideSeed : Number(seed);
    const activeDiff = overrideDiff !== undefined ? overrideDiff : difficulty;
    const activeSchemaJson = overrideSchemaJson !== undefined ? overrideSchemaJson : parameterSchemaJson;

    let parsedSchema = {};
    try {
      parsedSchema = JSON.parse(activeSchemaJson || '{}');
    } catch {
      setJsonError('Invalid JSON in Parameter Schema override editor.');
      return;
    }

    try {
      const result = await testMutation.mutateAsync({
        idOrKey: selectedOracle.id,
        payload: {
          parameterSchema: parsedSchema,
          difficulty: activeDiff,
          seed: activeSeed,
        },
      });
      setTestResult(result);
    } catch (err: any) {
      console.error('Oracle execution failed:', err);
    }
  };

  useEffect(() => {
    if (selectedOracle) {
      const schemaString = JSON.stringify(selectedOracle.parameterSchema || {}, null, 2);
      const computedSeed = getSeedForOracleKey(selectedOracle.key);
      setParameterSchemaJson(schemaString);
      setSeed(computedSeed);

      // Auto-execute on oracle load so results display immediately
      handleExecute(computedSeed, difficulty, schemaString);
    }
  }, [selectedOracle?.id]);

  if (isLoadingOracle) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24">
      {/* Header Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="gap-2 text-xs">
          <Link href="/admin/coding-oracles">
            <ArrowLeft className="w-4 h-4" /> Back to Oracle Library
          </Link>
        </Button>
      </div>

      <SectionHeader
        title="Oracle Execution Playground"
        description="Interactively test stateless algorithm execution, parameter resolution, expected output generation, and test suites."
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Oracle:</span>
              <Select
                value={selectedOracle?.id || oracleIdOrKey}
                onValueChange={handleOracleChange}
              >
                <SelectTrigger className="w-full sm:w-[380px] font-semibold bg-card">
                  <SelectValue placeholder="Select Oracle" />
                </SelectTrigger>
                <SelectContent>
                  {allOracles.map((oracle) => (
                    <SelectItem key={oracle.id} value={oracle.id}>
                      {oracle.name} ({oracle.key})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        }
      />

      {/* Selected Oracle Overview Header */}
      {selectedOracle && (
        <div className="bg-card border rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">{selectedOracle.name}</h2>
                  <Badge variant="outline" className="font-mono text-xs">
                    {selectedOracle.category}
                  </Badge>
                  <Badge variant="secondary" className="font-mono text-xs">
                    v{selectedOracle.version || 1}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  Key: <span className="font-bold">{selectedOracle.key}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {selectedOracle.isProviderAvailable ? (
                <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 border gap-1 px-3 py-1 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Provider Ready
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 border gap-1 px-3 py-1 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Provider Missing
                </Badge>
              )}
            </div>
          </div>

          {selectedOracle.description && (
            <p className="text-sm text-muted-foreground border-t pt-3 mt-1">
              {selectedOracle.description}
            </p>
          )}

          {!selectedOracle.isProviderAvailable && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-800 dark:text-amber-200 p-3 rounded-lg text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              This Oracle exists in the database, but its backend TypeScript class provider is missing in <code>OracleRegistry</code>. Execution will fail until a developer registers the provider.
            </div>
          )}
        </div>
      )}

      {/* Grid: Controls vs Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary" /> Execution Parameters
              </h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Difficulty Level</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EASY">EASY</SelectItem>
                      <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                      <SelectItem value="HARD">HARD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Seed Value</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRandomizeSeed}
                      className="h-5 px-1 text-[11px] gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Random
                    </Button>
                  </div>
                  <Input
                    type="number"
                    value={seed}
                    onChange={(e) => setSeed(parseInt(e.target.value, 10) || 42)}
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Parameter Schema Overrides (JSON)</Label>
                <div className="border rounded-md overflow-hidden">
                  <Editor
                    height="220px"
                    defaultLanguage="json"
                    value={parameterSchemaJson}
                    onChange={(val?: string) => setParameterSchemaJson(val || '')}
                    options={{ minimap: { enabled: false }, fontSize: 12 }}
                  />
                </div>
                {jsonError && (
                  <p className="text-xs text-red-500 font-medium">{jsonError}</p>
                )}
              </div>

              <Button
                onClick={() => handleExecute()}
                disabled={testMutation.isPending || !selectedOracle?.isProviderAvailable}
                className="w-full gap-2 shadow-md py-5 text-sm font-semibold"
              >
                {testMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                Execute & Test Oracle
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Execution Output & Test Suites (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {testResult ? (
            <div className="space-y-6">
              {/* Execution Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card border rounded-xl p-4 shadow-sm space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FileCode className="w-4 h-4 text-blue-500" /> Generated Input
                    </span>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      JSON
                    </Badge>
                  </div>
                  <pre className="bg-slate-950 text-slate-100 p-3 rounded-lg text-xs font-mono overflow-x-auto max-h-[160px]">
                    {JSON.stringify(testResult.generatedInput, null, 2)}
                  </pre>
                </div>

                <div className="bg-card border rounded-xl p-4 shadow-sm space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-emerald-500" /> Expected Output
                    </span>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      JSON
                    </Badge>
                  </div>
                  <pre className="bg-slate-950 text-emerald-400 p-3 rounded-lg text-xs font-mono overflow-x-auto max-h-[160px]">
                    {JSON.stringify(testResult.expectedOutput, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Resolved Parameters Card */}
              <div className="bg-card border rounded-xl p-4 shadow-sm space-y-2">
                <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-primary" /> Seeded Resolved Parameters
                </div>
                <pre className="bg-slate-950 text-slate-200 p-3 rounded-lg text-xs font-mono overflow-x-auto max-h-[120px]">
                  {JSON.stringify(testResult.parameters, null, 2)}
                </pre>
              </div>

              {/* Generated Test Cases Tabs */}
              <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="font-semibold text-base flex items-center gap-2 border-b pb-3">
                  <FileCode className="w-4 h-4 text-primary" /> Generated Test Suites
                </h3>

                <Tabs defaultValue="public" className="w-full">
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="public" className="text-xs">
                      Public ({testResult.publicTests?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="hidden" className="text-xs">
                      Hidden ({testResult.hiddenTests?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="boundary" className="text-xs">
                      Boundary ({testResult.boundaryTests?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="stress" className="text-xs">
                      Stress ({testResult.stressTests?.length || 0})
                    </TabsTrigger>
                  </TabsList>

                  {/* Public Tests */}
                  <TabsContent value="public" className="space-y-3 mt-4">
                    {testResult.publicTests?.map((tc: any, i: number) => (
                      <TestCaseCard key={i} index={i + 1} testCase={tc} type="PUBLIC" />
                    ))}
                  </TabsContent>

                  {/* Hidden Tests */}
                  <TabsContent value="hidden" className="space-y-3 mt-4">
                    {testResult.hiddenTests?.map((tc: any, i: number) => (
                      <TestCaseCard key={i} index={i + 1} testCase={tc} type="HIDDEN" />
                    ))}
                  </TabsContent>

                  {/* Boundary Tests */}
                  <TabsContent value="boundary" className="space-y-3 mt-4">
                    {testResult.boundaryTests?.map((tc: any, i: number) => (
                      <TestCaseCard key={i} index={i + 1} testCase={tc} type="BOUNDARY" />
                    ))}
                  </TabsContent>

                  {/* Stress Tests */}
                  <TabsContent value="stress" className="space-y-3 mt-4">
                    {testResult.stressTests?.map((tc: any, i: number) => (
                      <TestCaseCard key={i} index={i + 1} testCase={tc} type="STRESS" />
                    ))}
                  </TabsContent>
                </Tabs>
              </div>

              {/* Validation Status Panel */}
              {testResult.validation && (
                <div className="bg-card border rounded-xl p-5 shadow-sm space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2 border-b pb-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Pipeline Validation Status
                  </h3>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      {testResult.validation.valid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                      <span>Validation Result:</span>
                      <Badge
                        variant="outline"
                        className={
                          testResult.validation.valid
                            ? "font-mono bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200"
                            : "font-mono bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200"
                        }
                      >
                        {testResult.validation.valid ? 'PASSED' : 'FAILED'}
                      </Badge>
                    </div>
                  </div>
                  {testResult.validation.errors?.length > 0 && (
                    <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/30 p-2 rounded border border-red-200 space-y-1">
                      {testResult.validation.errors.map((err: string, i: number) => (
                        <div key={i}>• {err}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}


            </div>
          ) : (
            <div className="bg-card border rounded-xl p-12 text-center space-y-3 shadow-sm">
              <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto text-primary">
                <Play className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-lg">Ready for Oracle Testing</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Adjust execution parameters, seed value, or parameter schema overrides on the left, then click <strong>Execute & Test Oracle</strong> to generate live outputs and test cases.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TestCaseCard({ index, testCase, type }: { index: number; testCase: any; type: string }) {
  return (
    <div className="border rounded-lg p-3 bg-card space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-foreground">
          Test Case #{index}
        </span>
        <div className="flex items-center gap-1.5">
          {type === 'PUBLIC' && <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[10px]">PUBLIC</Badge>}
          {type === 'HIDDEN' && <Badge variant="secondary" className="text-[10px]">HIDDEN</Badge>}
          {type === 'BOUNDARY' && <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-[10px]">BOUNDARY</Badge>}
          {type === 'STRESS' && <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-[10px]">STRESS</Badge>}
        </div>
      </div>

      {testCase.explanation && (
        <p className="text-[11px] text-muted-foreground italic">
          {testCase.explanation}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 font-mono text-[11px] pt-1">
        <div>
          <span className="text-muted-foreground block text-[10px]">Input:</span>
          <pre className="bg-slate-950 text-slate-200 p-2 rounded max-h-[100px] overflow-x-auto">
            {JSON.stringify(testCase.input, null, 2)}
          </pre>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px]">Expected Output:</span>
          <pre className="bg-slate-950 text-emerald-400 p-2 rounded max-h-[100px] overflow-x-auto">
            {JSON.stringify(testCase.expectedOutput, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
