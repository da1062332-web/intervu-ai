'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Award, Code, BookOpen, AlertTriangle, ShieldCheck, Trophy } from 'lucide-react';

interface SectionBreakdownItem {
  category: string;
  sectionCode: string;
  sectionName?: string;
  correctCount: number;
  requiredMin: number;
  passed: boolean;
}

interface HiringEvaluationCardProps {
  qualification?: string;
  qualificationReason?: string;
  evaluationStrategy?: string;
  foundationScore?: number;
  advancedScore?: number;
  codingSolved?: number;
  qualificationDetails?: {
    foundationBreakdown?: {
      numericalScore: number;
      numericalMin: number;
      verbalScore: number;
      verbalMin: number;
      reasoningScore: number;
      reasoningMin: number;
      foundationTotal: number;
      ninjaThreshold: number;
      digitalThreshold: number;
      primeThreshold: number;
      sectionsBreakdown?: SectionBreakdownItem[];
    };
    advancedBreakdown?: {
      advancedScore: number;
      advancedMinDigital: number;
      advancedMinPrime: number;
      passedDigital: boolean;
      passedPrime: boolean;
    };
    codingBreakdown?: {
      totalCodingProblems: number;
      codingSolved: number;
      codingMinDigital: number;
      codingMinPrime: number;
      passedDigital: boolean;
      passedPrime: boolean;
    };
  };
}

export function HiringEvaluationCard({
  qualification = 'NOT_QUALIFIED',
  qualificationReason = 'N/A',
  evaluationStrategy = 'TCS',
  foundationScore = 0,
  advancedScore = 0,
  codingSolved = 0,
  qualificationDetails,
}: HiringEvaluationCardProps) {
  const getBadgeStyle = (q: string) => {
    switch (q.toUpperCase()) {
      case 'PRIME':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20';
      case 'DIGITAL':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/30 hover:bg-purple-500/20';
      case 'NINJA':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/30 hover:bg-blue-500/20';
      case 'NOT_QUALIFIED':
      default:
        return 'bg-red-500/10 text-red-600 border-red-500/30 hover:bg-red-500/20';
    }
  };

  const fBreakdown = qualificationDetails?.foundationBreakdown;
  const aBreakdown = qualificationDetails?.advancedBreakdown;
  const cBreakdown = qualificationDetails?.codingBreakdown;

  return (
    <Card className="border shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/10 pb-4 border-b">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Hiring Qualification Evaluation
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {evaluationStrategy} Strategy
              </Badge>
            </div>
            <CardDescription>Automated corporate hiring tier assessment & sectional eligibility analysis.</CardDescription>
          </div>
          <Badge className={`px-4 py-1.5 text-sm font-semibold border ${getBadgeStyle(qualification)}`}>
            {qualification.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Decision & Reason Banner */}
        <div
          className={`p-4 md:p-5 rounded-xl border flex items-start gap-3.5 shadow-sm transition-all ${
            qualification === 'NOT_QUALIFIED'
              ? 'bg-red-50/70 border-red-200 text-red-900'
              : qualification === 'PRIME'
              ? 'bg-gradient-to-r from-amber-500/15 via-amber-50/80 to-amber-500/10 border-amber-300 text-amber-950'
              : qualification === 'DIGITAL'
              ? 'bg-gradient-to-r from-purple-500/15 via-purple-50/80 to-purple-500/10 border-purple-300 text-purple-950'
              : 'bg-gradient-to-r from-emerald-500/15 via-emerald-50/80 to-emerald-500/10 border-emerald-300 text-emerald-950'
          }`}
        >
          {qualification === 'NOT_QUALIFIED' ? (
            <AlertTriangle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
          ) : (
            <Trophy className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <h3 className="font-bold text-base md:text-lg tracking-tight">
              {qualification === 'NOT_QUALIFIED'
                ? 'Status: NOT QUALIFIED'
                : `🎉 Congratulations! You have qualified for ${
                    qualification === 'NINJA'
                      ? 'Ninja'
                      : qualification === 'DIGITAL'
                      ? 'Digital'
                      : qualification === 'PRIME'
                      ? 'Prime'
                      : qualification.replace('_', ' ')
                  } Role!`}
            </h3>
            <p className="text-xs md:text-sm font-medium opacity-80">{qualificationReason}</p>
          </div>
        </div>

        {/* Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Foundation Summary */}
          <div className="p-4 border rounded-lg bg-card space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                Foundation Total
              </span>
              <span className="text-lg font-bold">{fBreakdown?.foundationTotal ?? foundationScore}</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Ninja Threshold:</span>
                <span className="font-medium text-foreground">{fBreakdown?.ninjaThreshold ?? 0}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Digital Threshold:</span>
                <span className="font-medium text-foreground">{fBreakdown?.digitalThreshold ?? 0}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Prime Threshold:</span>
                <span className="font-medium text-foreground">{fBreakdown?.primeThreshold ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Advanced Aptitude */}
          <div className="p-4 border rounded-lg bg-card space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-primary" />
                Advanced Aptitude
              </span>
              <span className="text-lg font-bold">{aBreakdown?.advancedScore ?? advancedScore}</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Digital Min Required:</span>
                <span className="font-medium text-foreground">{aBreakdown?.advancedMinDigital ?? 0}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Prime Min Required:</span>
                <span className="font-medium text-foreground">{aBreakdown?.advancedMinPrime ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Coding Summary */}
          <div className="p-4 border rounded-lg bg-card space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                <Code className="h-3.5 w-3.5 text-primary" />
                Coding Problems Solved
              </span>
              <span className="text-lg font-bold">
                {cBreakdown?.codingSolved ?? codingSolved} / {cBreakdown?.totalCodingProblems ?? 0}
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Digital Min Solved:</span>
                <span className="font-medium text-foreground">{cBreakdown?.codingMinDigital ?? 0}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Prime Min Solved:</span>
                <span className="font-medium text-foreground">{cBreakdown?.codingMinPrime ?? 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section-wise Pass/Fail Breakdown Table */}
        {fBreakdown?.sectionsBreakdown && fBreakdown.sectionsBreakdown.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Sectional Cutoff Performance</p>
            <div className="border rounded-lg overflow-hidden divide-y text-xs">
              {fBreakdown.sectionsBreakdown.map((sec, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted/10 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-2">
                    {sec.passed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="font-medium">{sec.sectionName || sec.sectionCode} ({sec.category})</span>
                  </div>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>
                      Correct: <strong className="text-foreground">{sec.correctCount}</strong> / Req Min: <strong className="text-foreground">{sec.requiredMin}</strong>
                    </span>
                    <Badge variant={sec.passed ? 'outline' : 'destructive'} className="text-[10px] px-2 py-0">
                      {sec.passed ? 'PASSED' : 'FAILED'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
