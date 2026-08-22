'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { SectionHeader } from '@/components/ui/section-header';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Code2,
  CheckCircle2,
  RotateCcw,
  SlidersHorizontal,
  FolderTree,
} from 'lucide-react';
import { useCodingPatterns, useDeleteCodingPattern } from '@/services/coding-patterns/hooks';
import { CodingPattern } from '@/services/coding-patterns/api';

const TOPIC_OPTIONS = [
  { label: 'All Topics', value: 'ALL' },
  { label: 'Basic Programming', value: 'BASIC' },
  { label: 'Array', value: 'ARRAY' },
  { label: 'String', value: 'STRING' },
  { label: 'Math', value: 'MATH' },
  { label: 'Matrix', value: 'MATRIX' },
  { label: 'Loop', value: 'LOOP' },
  { label: 'Logic', value: 'LOGIC' },
  { label: 'Searching', value: 'SEARCHING' },
  { label: 'Sorting', value: 'SORTING' },
  { label: 'Sort', value: 'SORT' },
  { label: 'Recursion', value: 'RECURSION' },
  { label: 'Simulation', value: 'SIMULATION' },
  { label: 'Dynamic Programming', value: 'DYNAMIC_PROGRAMMING' },
  { label: 'Trees', value: 'TREES' },
  { label: 'Graphs', value: 'GRAPHS' },
  { label: 'General', value: 'GENERAL' },
];

export default function CodingPatternListPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const { data, isLoading } = useCodingPatterns(1, 500);
  const deleteMutation = useDeleteCodingPattern();

  const rawPatterns = data?.items || [];

  // Filtered patterns logic
  const filteredPatterns = useMemo(() => {
    return rawPatterns.filter((item) => {
      // 1. Search text filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(q);
        const matchesSlug = item.slug?.toLowerCase().includes(q);
        const matchesKey = item.patternKey?.toLowerCase().includes(q);
        const matchesOracle = item.oracleKey?.toLowerCase().includes(q);
        const matchesConcept = String((item.metadata as any)?.conceptKey || '')
          .toLowerCase()
          .includes(q);
        if (!matchesTitle && !matchesSlug && !matchesKey && !matchesOracle && !matchesConcept) {
          return false;
        }
      }

      // 2. Difficulty filter
      if (selectedDifficulty !== 'ALL' && item.difficulty !== selectedDifficulty) {
        return false;
      }

      // 3. Status filter
      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) {
        return false;
      }

      // 4. Topic filter
      if (selectedTopic !== 'ALL') {
        const itemTopic = (item.metadata as any)?.topicCode || (item.metadata as any)?.topic || '';
        if (itemTopic !== selectedTopic) {
          return false;
        }
      }

      return true;
    });
  }, [rawPatterns, search, selectedDifficulty, selectedStatus, selectedTopic]);

  const hasActiveFilters =
    search.trim() !== '' ||
    selectedTopic !== 'ALL' ||
    selectedDifficulty !== 'ALL' ||
    selectedStatus !== 'ALL';

  const resetFilters = () => {
    setSearch('');
    setSelectedTopic('ALL');
    setSelectedDifficulty('ALL');
    setSelectedStatus('ALL');
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this coding pattern?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const columns: ColumnDef<CodingPattern>[] = [
    {
      header: 'Title & Key',
      cell: (item) => {
        const conceptKey = (item.metadata as any)?.conceptKey;
        const topicCode = (item.metadata as any)?.topicCode;

        return (
          <div className="space-y-1">
            <div className="font-semibold text-foreground flex items-center gap-2">
              <Code2 className="w-4 h-4 text-primary" />
              {item.title}
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              {item.slug} • key: {item.patternKey}
            </div>
            {(topicCode || conceptKey) && (
              <div className="flex items-center gap-1.5 pt-0.5">
                {topicCode && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-muted/50">
                    <FolderTree className="w-2.5 h-2.5 mr-1" />
                    {topicCode}
                  </Badge>
                )}
                {conceptKey && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono">
                    {conceptKey}
                  </Badge>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: 'Oracle Engine',
      cell: (item) => (
        <span className="font-mono text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border">
          {item.oracleKey}
        </span>
      ),
    },
    {
      header: 'Difficulty',
      cell: (item) => {
        const diff = item.difficulty;
        const color =
          diff === 'EASY'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200'
            : diff === 'MEDIUM'
            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200'
            : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200';
        return <Badge className={`${color} border`}>{diff}</Badge>;
      },
    },
    {
      header: 'Status',
      cell: (item) => {
        const isPublished = item.status === 'PUBLISHED';
        return (
          <Badge variant={isPublished ? 'default' : 'secondary'} className="gap-1">
            {isPublished && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
            {item.status} (v{item.version})
          </Badge>
        );
      },
    },
    {
      header: 'Actions',
      cell: (item) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/coding-patterns/${item.id}`);
            }}
          >
            <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10"
            onClick={(e) => handleDelete(item.id, e)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <SectionHeader
        title="Coding Pattern Library"
        description="Manage deterministic algorithmic patterns, Oracles, test case generators, and starter code schemas."
        actions={
          <Link href="/admin/coding-patterns/new">
            <Button className="gap-2 shadow-sm">
              <Plus className="w-4 h-4" /> Create Pattern
            </Button>
          </Link>
        }
      />

      {/* ── Filter Bar ─────────────────────────────────────────────── */}
      <div className="bg-card p-4 rounded-xl border shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title, slug, oracle, or concept..."
              className="pl-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Topic Filter */}
          <Select value={selectedTopic} onValueChange={setSelectedTopic}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Topic" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {TOPIC_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Difficulty Filter */}
          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Difficulties</SelectItem>
              <SelectItem value="EASY">Easy</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HARD">Hard</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="gap-1.5 text-muted-foreground hover:text-foreground h-9"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </Button>
          )}
        </div>

        {/* Filter Summary Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>
              Showing <strong className="text-foreground">{filteredPatterns.length}</strong> of{' '}
              <strong className="text-foreground">{rawPatterns.length}</strong> coding patterns
            </span>
          </div>
          {hasActiveFilters && (
            <span className="text-primary font-medium">Filters applied</span>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <DataTable columns={columns} data={filteredPatterns} isLoading={isLoading} />
      </div>
    </div>
  );
}
