import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PerformanceDashboardResponse } from '../types/results.types';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Clock,
  Zap,
  ShieldCheck,
  Loader2,
  WifiOff,
  Maximize2,
  X,
  Target,
  Trophy,
  BarChart2,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useAiAnalysis } from '../hooks/results.hooks';

interface Props {
  data: PerformanceDashboardResponse;
  attemptId: string;
}

export const DashboardRecommendations: React.FC<Props> = ({ data, attemptId }) => {
  const { data: aiData, isLoading, isError } = useAiAnalysis(attemptId);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ── Loading State ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Card className="rounded-2xl border-indigo-200/80 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/60 via-background to-purple-50/40 dark:from-slate-900 dark:via-background dark:to-indigo-950/30 shadow-sm relative overflow-hidden">
        <CardHeader className="pb-4 border-b border-indigo-100 dark:border-indigo-900/40">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <CardTitle className="text-xl font-bold text-foreground">Total AI Evaluation & Recommendations</CardTitle>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800 text-[10px] uppercase font-bold tracking-wider rounded-lg">
              GENERATING
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6 pb-8 flex flex-col items-center justify-center gap-4 min-h-[200px]">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm text-muted-foreground font-medium text-center max-w-xs">
            AI is analyzing your assessment performance. This may take a few seconds…
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Error / Fallback State ─────────────────────────────────────────────────
  if (isError || !aiData) {
    return (
      <Card className="rounded-2xl border-rose-200/80 dark:border-rose-900/40 bg-card shadow-sm">
        <CardContent className="pt-8 pb-8 flex flex-col items-center justify-center gap-3 min-h-[160px]">
          <WifiOff className="w-8 h-8 text-rose-400" />
          <p className="text-sm text-muted-foreground font-medium text-center max-w-sm">
            Could not generate AI insights for this attempt. Please refresh the page to try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { strengths, weaknesses, recommendations, practiceHours, summary } = aiData;

  const cleanDetailText = (str: string): string => {
    if (!str) return '';
    let text = str
      .replace(/Achieved \d+%\s*accuracy,?\s*indicating/gi, 'Demonstrated')
      .replace(/Scored \d+%\s*accuracy,?\s*showing/gi, 'Exhibited')
      .replace(/Also scored \d+%,?\s*demonstrating/gi, 'Demonstrated')
      .replace(/Only \d+%\s*accuracy indicates/gi, 'Indicates')
      .replace(/no answers were submitted for this topic\s*\(\s*0%\s*accuracy\s*\)\.?/gi, 'Topic requires foundational concept revision and practice.')
      .replace(/accuracy at \d+%\s*—\s*/gi, '')
      .replace(/\s*\(\s*\d+%\s*accuracy\s*\)/gi, '')
      .replace(/\s*\d+%\s*accuracy/gi, '')
      .replace(/\s*\d+%/gi, '')
      .replace(/  +/g, ' ')
      .trim();
    if (text.length > 0) {
      text = text.charAt(0).toUpperCase() + text.slice(1);
    }
    return text;
  };

  return (
    <>
      <Card className="rounded-2xl border-indigo-200/80 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/60 via-background to-purple-50/40 dark:from-slate-900 dark:via-background dark:to-indigo-950/30 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-indigo-100 dark:border-indigo-900/40">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-2xs shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                Total AI Evaluation & Recommendations
              </CardTitle>
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800 text-[10px] uppercase font-bold tracking-wider rounded-lg">
                AI GENERATED
              </Badge>
            </div>
            {summary && (
              <CardDescription className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {summary}
              </CardDescription>
            )}
          </div>


        </CardHeader>

        <CardContent className="pt-5 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* ── 1. STRENGTHS ──────────────────────────────────────────────── */}
            <div className="p-4 rounded-2xl bg-card border border-emerald-200/80 dark:border-emerald-900/40 shadow-2xs flex flex-col space-y-3">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-emerald-100 dark:border-emerald-900/30">
                <span className="font-bold text-sm text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  Key Strengths
                </span>
                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 text-[10px] uppercase font-bold rounded-md">
                  {strengths.length} Identified
                </Badge>
              </div>

              <div className="space-y-2.5 flex-1">
                {strengths.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No specific strengths identified for this attempt.</p>
                ) : (
                  strengths.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-bold text-foreground">{item.title}</h5>
                        <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{cleanDetailText(item.detail)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ── 2. WEAKNESSES ─────────────────────────────────────────────── */}
            <div className="p-4 rounded-2xl bg-card border border-rose-200/80 dark:border-rose-900/40 shadow-2xs flex flex-col space-y-3">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-rose-100 dark:border-rose-900/30">
                <span className="font-bold text-sm text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  Weaknesses & Gaps
                </span>
                <Badge className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20 text-[10px] uppercase font-bold rounded-md">
                  {weaknesses.length} Areas
                </Badge>
              </div>

              <div className="space-y-2.5 flex-1">
                {weaknesses.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No critical weaknesses detected. Well done!</p>
                ) : (
                  weaknesses.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/10 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-bold text-foreground">{item.title}</h5>
                        <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{cleanDetailText(item.detail)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ── 3. AI RECOMMENDATIONS ─────────────────────────────────────── */}
            <div className="p-4 rounded-2xl bg-card border border-indigo-200/80 dark:border-indigo-900/40 shadow-2xs flex flex-col space-y-3">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-indigo-100 dark:border-indigo-900/30">
                <span className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  AI Action Plan
                </span>
                <Badge className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20 text-[10px] uppercase font-bold rounded-md">
                  {recommendations.length} Steps
                </Badge>
              </div>

              <div className="space-y-2.5 flex-1">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-2.5">
                    <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <h5 className="text-xs font-bold text-foreground leading-snug">{rec.title}</h5>
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0 rounded shrink-0 ${
                            rec.priority === 'HIGH'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
                              : rec.priority === 'MEDIUM'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{rec.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="pt-2 flex justify-end">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm transition-all"
            >
              <span>View Full AI Evaluation Report</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── COMPLETE AI EVALUATION MODAL ───────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="max-w-4xl max-h-[90vh] p-0 rounded-3xl border-0 overflow-hidden bg-background shadow-2xl"
      >
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Modal Header */}
          <div className="p-6 bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 text-white flex items-start justify-between gap-4 border-b border-indigo-800/40 relative">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold tracking-tight">Total AI Evaluation & Recommendations</h2>
                <Badge className="bg-indigo-500/20 text-indigo-200 border-indigo-400/30 text-[10px] uppercase font-bold">
                  VERIFIED BY AI
                </Badge>
              </div>
              <p className="text-xs text-indigo-200/80 leading-relaxed max-w-2xl">
                Comprehensive AI evaluation report detailing key performance indicators, topic mastery, identified skill gaps, and step-by-step improvement plan.
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content Scroll Area */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/15 flex flex-col justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-indigo-500" />
                  Overall Score
                </span>
                <span className="text-2xl font-extrabold text-foreground mt-2">
                  {Math.round(data.percentage || 0)}%
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 flex flex-col justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Status
                </span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-2 truncate">
                  {data.qualification || (data.percentage >= 60 ? 'Qualified' : 'Requires Improvement')}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/15 flex flex-col justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-purple-500" />
                  Practice Needed
                </span>
                <span className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-2">
                  ~{practiceHours} Hours
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/15 flex flex-col justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5 text-blue-500" />
                  Accuracy
                </span>
                <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-2">
                  {Math.round(data.overallAccuracy || data.percentage || 0)}%
                </span>
              </div>
            </div>

            {/* Executive Summary */}
            {summary && (
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  AI Executive Verdict
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                  {summary}
                </p>
              </div>
            )}

            {/* Strengths & Weaknesses 2-Column */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* STRENGTHS */}
              <div className="p-5 rounded-2xl bg-card border border-emerald-200/80 dark:border-emerald-900/50 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-100 dark:border-emerald-900/40">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Key Strengths ({strengths.length})
                  </h4>
                </div>
                <div className="space-y-3">
                  {strengths.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-1">
                      <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        {item.title}
                      </h5>
                      <p className="text-xs text-muted-foreground leading-relaxed pl-5">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* WEAKNESSES */}
              <div className="p-5 rounded-2xl bg-card border border-rose-200/80 dark:border-rose-900/50 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-rose-100 dark:border-rose-900/40">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    Weaknesses & Gaps ({weaknesses.length})
                  </h4>
                </div>
                <div className="space-y-3">
                  {weaknesses.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 space-y-1">
                      <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        {item.title}
                      </h5>
                      <p className="text-xs text-muted-foreground leading-relaxed pl-5">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI ACTION PLAN */}
            <div className="p-5 rounded-2xl bg-card border border-indigo-200/80 dark:border-indigo-900/50 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-indigo-100 dark:border-indigo-900/40">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-indigo-500" />
                  Detailed AI Action Plan & Next Steps ({recommendations.length})
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 space-y-1.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          {rec.title}
                        </h5>
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                            rec.priority === 'HIGH'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
                              : rec.priority === 'MEDIUM'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {rec.priority} Priority
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">{rec.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-muted/30 border-t border-border/60 flex justify-end gap-3">
            <Button
              onClick={() => setIsModalOpen(false)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl px-5 py-2"
            >
              Close AI Evaluation Report
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
