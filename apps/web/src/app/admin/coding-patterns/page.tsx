'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { SectionHeader } from '@/components/ui/section-header';
import { Plus, Edit2, Trash2, Search, Code2, CheckCircle2 } from 'lucide-react';
import { useCodingPatterns, useDeleteCodingPattern } from '@/services/coding-patterns/hooks';
import { CodingPattern } from '@/services/coding-patterns/api';

export default function CodingPatternListPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page] = useState(1);
  const limit = 20;

  const { data, isLoading } = useCodingPatterns(page, limit, search);
  const deleteMutation = useDeleteCodingPattern();

  const patterns = data?.items || [];

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this coding pattern?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const columns: ColumnDef<CodingPattern>[] = [
    {
      header: 'Title & Key',
      cell: (item) => (
        <div>
          <div className="font-semibold text-foreground flex items-center gap-2">
            <Code2 className="w-4 h-4 text-primary" />
            {item.title}
          </div>
          <div className="text-xs text-muted-foreground font-mono mt-0.5">
            {item.slug} • key: {item.patternKey}
          </div>
        </div>
      ),
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

      <div className="flex items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search patterns by title, slug, or oracle key..."
            className="pl-9 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={patterns}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
