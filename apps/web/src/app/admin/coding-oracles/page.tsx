'use client';

import { useState } from 'react';
import Link from 'next/link';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { SectionHeader } from '@/components/ui/section-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Cpu,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  Play,
} from 'lucide-react';
import {
  useCodingOracles,
  useToggleCodingOracleStatus,
  useUpdateCodingOracle,
} from '@/services/coding-oracles/hooks';
import { CodingOracleItem } from '@/services/coding-oracles/api';

export const ORACLE_CATEGORIES = [
  'BASIC',
  'ARRAY',
  'STRING',
  'MATH',
  'MATRIX',
  'LOOP',
  'LOGIC',
  'SEARCHING',
  'SORTING',
  'SORT',
  'RECURSION',
  'SIMULATION',
  'DYNAMIC_PROGRAMMING',
  'TREES',
  'GRAPHS',
  'GENERAL',
] as const;

function getCategoryBadgeStyle(category?: string) {
  const cat = (category || 'GENERAL').toUpperCase();
  switch (cat) {
    case 'BASIC':
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300';
    case 'ARRAY':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300';
    case 'STRING':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300';
    case 'MATH':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300';
    case 'MATRIX':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300';
    case 'LOOP':
      return 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300';
    case 'LOGIC':
      return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300';
    case 'SORT':
    case 'SORTING':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300';
    case 'SEARCHING':
      return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300';
    case 'RECURSION':
      return 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300';
    case 'SIMULATION':
      return 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950 dark:text-pink-300';
    case 'DYNAMIC_PROGRAMMING':
    case 'DP':
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300';
  }
}

const EMPTY_EDIT_FORM = {
  name: '',
  category: 'BASIC',
  description: '',
  parameterSchema: '{}',
  isActive: true,
};

export default function AdminOracleLibraryPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [editingOracle, setEditingOracle] = useState<CodingOracleItem | null>(null);

  const activeFilter = selectedStatus === 'ALL' ? undefined : selectedStatus === 'ACTIVE';
  const categoryFilter = selectedCategory === 'ALL' ? undefined : selectedCategory;

  const { data, isLoading } = useCodingOracles(categoryFilter, activeFilter, search);
  const toggleMutation = useToggleCodingOracleStatus();
  const updateMutation = useUpdateCodingOracle();

  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);

  // ── Edit handlers ──────────────────────────────────────────────
  const handleOpenEdit = (oracle: CodingOracleItem) => {
    setEditingOracle(oracle);
    setEditForm({
      name: oracle.name,
      category: oracle.category || 'GENERAL',
      description: oracle.description || '',
      parameterSchema: JSON.stringify(oracle.parameterSchema || {}, null, 2),
      isActive: oracle.isActive,
    });
  };

  const handleCloseEdit = () => setEditingOracle(null);

  const handleSaveEdit = async () => {
    if (!editingOracle) return;
    try {
      await updateMutation.mutateAsync({
        idOrKey: editingOracle.id,
        payload: {
          name: editForm.name,
          category: editForm.category,
          description: editForm.description,
          parameterSchema: JSON.parse(editForm.parameterSchema || '{}'),
          isActive: editForm.isActive,
        },
      });
      handleCloseEdit();
    } catch (err: any) {
      alert(`Failed to save oracle metadata: ${err.message}`);
    }
  };

  // ── Toggle Status ──────────────────────────────────────────────
  const handleToggle = async (idOrKey: string, e?: React.MouseEvent | React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    try {
      await toggleMutation.mutateAsync(idOrKey);
    } catch (err: any) {
      alert(`Toggle status failed: ${err.message}`);
    }
  };

  const oracles = data?.items || [];

  const columns: ColumnDef<CodingOracleItem>[] = [
    {
      header: 'Oracle Engine & Key',
      cell: (item) => (
        <div>
          <div className='font-semibold text-foreground flex items-center gap-2 flex-wrap'>
            <Cpu className='w-4 h-4 text-primary' />
            {item.name.replace(/\s+Oracle(\s+\(Legacy\))?$/i, '')}
            <Badge
              variant='outline'
              className={`font-semibold text-[10px] px-2 py-0.5 border ${getCategoryBadgeStyle(item.category)}`}
            >
              {item.category || 'GENERAL'}
            </Badge>
            {(() => {
              const diffRaw = item.supportedDifficulties?.[0] || 'EASY';
              const diff = String(diffRaw).toUpperCase();
              const label =
                diff === 'EASY'
                  ? 'Easy'
                  : diff === 'MEDIUM'
                    ? 'Medium'
                    : diff === 'HARD'
                      ? 'Hard'
                      : diff;
              const badgeStyle =
                diff === 'EASY'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                  : diff === 'MEDIUM'
                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300';
              return (
                <Badge
                  variant='outline'
                  className={`font-semibold text-[10px] px-2 py-0.5 border ${badgeStyle}`}
                >
                  {label}
                </Badge>
              );
            })()}
            <Badge
              variant='secondary'
              className='font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            >
              v{item.version || 1}
            </Badge>
          </div>
          <div className='text-xs text-muted-foreground font-mono mt-0.5'>
            Key: <span className='font-bold'>{item.key}</span>
          </div>
          {item.description && (
            <p className='text-[11px] text-muted-foreground mt-1 line-clamp-1 max-w-md'>
              {item.description}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Backend Provider Status',
      cell: (item) => (
        <div>
          {item.isProviderAvailable ? (
            <Badge className='bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 border gap-1'>
              <CheckCircle2 className='w-3 h-3 text-emerald-500' /> Provider Ready
            </Badge>
          ) : (
            <Badge
              variant='outline'
              className='bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 border gap-1'
            >
              <AlertTriangle className='w-3 h-3 text-amber-500' /> Provider Missing
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: 'Active Status',
      cell: (item) => (
        <div
          className='flex items-center gap-2.5'
          onClick={(e) => e.stopPropagation()}
        >
          <Switch
            checked={item.isActive}
            onCheckedChange={() => handleToggle(item.id)}
            disabled={toggleMutation.isPending}
            className='data-[state=checked]:bg-emerald-600'
            aria-label={`Toggle ${item.name} active status`}
          />
          {item.isActive ? (
            <Badge className='bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 border gap-1.5 font-medium text-xs shadow-none'>
              <span className='w-1.5 h-1.5 rounded-full bg-emerald-500' /> Active
            </Badge>
          ) : (
            <Badge
              variant='outline'
              className='bg-slate-50 text-slate-600 dark:bg-slate-900/60 dark:text-slate-400 border-slate-300 dark:border-slate-800 gap-1.5 font-medium text-xs'
            >
              <span className='w-1.5 h-1.5 rounded-full bg-slate-400' /> Inactive
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: 'Linked Patterns',
      cell: (item) => (
        <div className='flex items-center gap-1.5 flex-wrap'>
          <Badge variant='outline' className='font-mono text-xs'>
            {item.patternCount} pattern(s)
          </Badge>
          {!item.isActive && item.patternCount > 0 && (
            <Badge variant='destructive' className='text-[10px] py-0 font-mono'>
              ⚠️ Patterns Blocked
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      cell: (item) => (
        <div className='flex items-center gap-2'>
          <Button size='sm' variant='outline' asChild className='gap-1 text-xs'>
            <Link href={`/admin/coding-oracles/${item.id}/playground`}>
              <Play className='w-3.5 h-3.5 text-primary' /> Playground
            </Link>
          </Button>
          <Button
            size='sm'
            variant='outline'
            onClick={() => handleOpenEdit(item)}
            className='gap-1 text-xs'
          >
            <Edit2 className='w-3.5 h-3.5' /> Edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className='p-6 space-y-6 max-w-7xl mx-auto pb-24'>
      <SectionHeader
        title='Coding Oracle Library'
        description='Manage problem Oracles, database definitions, execution provider readiness, and active statuses.'
      />

      {/* Filter Header */}
      <div className='flex items-center gap-4 bg-card p-4 rounded-xl border shadow-sm flex-wrap'>
        <div className='relative flex-1 min-w-[240px]'>
          <Search className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Search Oracles by name, key, or category...'
            className='pl-9 bg-background'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className='flex items-center gap-3'>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className='w-[175px]'>
              <SelectValue placeholder='Category' />
            </SelectTrigger>
            <SelectContent className='max-h-72'>
              <SelectItem value='ALL'>All Categories</SelectItem>
              {ORACLE_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className='w-[150px]'>
              <SelectValue placeholder='Active Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL'>All Statuses</SelectItem>
              <SelectItem value='ACTIVE'>Active Only</SelectItem>
              <SelectItem value='INACTIVE'>Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Table */}
      <div className='bg-card rounded-xl border shadow-sm overflow-hidden'>
        <DataTable columns={columns} data={oracles} isLoading={isLoading} />
      </div>

      {/* ── Edit Oracle Metadata Modal ──────────────────────────────── */}
      {editingOracle && (
        <div className='fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 flex justify-center items-start pb-12'>
          <div className='bg-card border rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 mt-4 sm:mt-8 flex flex-col max-h-[88vh]'>
            <div className='flex items-center justify-between border-b p-4 bg-muted/30 shrink-0'>
              <div>
                <h3 className='font-semibold text-lg flex items-center gap-2'>
                  <Cpu className='w-5 h-5 text-primary' /> Edit Oracle: {editingOracle.name}
                </h3>
                <p className='text-xs text-muted-foreground font-mono'>Key: {editingOracle.key}</p>
              </div>
              <Button variant='ghost' size='sm' onClick={handleCloseEdit}>
                <X className='w-4 h-4' />
              </Button>
            </div>

            <div className='p-6 space-y-4 overflow-y-auto flex-1'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>Display Name</Label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Category</Label>
                  <Select
                    value={editForm.category}
                    onValueChange={(val: any) =>
                      setEditForm((prev) => ({ ...prev, category: val }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Category' />
                    </SelectTrigger>
                    <SelectContent className='max-h-60'>
                      {ORACLE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className='space-y-2'>
                <Label>Description</Label>
                <Input
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                />
              </div>

              <div className='space-y-2'>
                <Label>Parameter Schema Defaults (JSON)</Label>
                <div className='border rounded-md overflow-hidden'>
                  <Editor
                    height='160px'
                    defaultLanguage='json'
                    value={editForm.parameterSchema}
                    onChange={(val?: string) =>
                      setEditForm((prev) => ({ ...prev, parameterSchema: val || '' }))
                    }
                    options={{ minimap: { enabled: false }, fontSize: 12 }}
                  />
                </div>
              </div>

              <div className='flex items-center justify-between p-3.5 border rounded-lg bg-slate-50/80 dark:bg-slate-900/80'>
                <div className='space-y-1'>
                  <div className='flex items-center gap-2'>
                    <div className='text-sm font-semibold'>Oracle Status</div>
                    {editForm.isActive ? (
                      <Badge className='bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 border text-xs gap-1 font-medium'>
                        <span className='w-1.5 h-1.5 rounded-full bg-emerald-500' /> Active
                      </Badge>
                    ) : (
                      <Badge
                        variant='outline'
                        className='bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400 border-slate-300 text-xs gap-1 font-medium'
                      >
                        <span className='w-1.5 h-1.5 rounded-full bg-slate-400' /> Inactive
                      </Badge>
                    )}
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    {editForm.isActive
                      ? 'Active and available when creating or configuring coding patterns.'
                      : 'Inactive and hidden from coding pattern creation.'}
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <Switch
                    checked={editForm.isActive}
                    onCheckedChange={(checked: boolean) =>
                      setEditForm((prev) => ({ ...prev, isActive: checked }))
                    }
                    className='data-[state=checked]:bg-emerald-600'
                  />
                </div>
              </div>
            </div>

            <div className='flex items-center justify-end gap-2 p-4 border-t bg-muted/30 shrink-0'>
              <Button variant='outline' onClick={handleCloseEdit}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={updateMutation.isPending}
                className='gap-2'
              >
                {updateMutation.isPending && <Loader2 className='w-4 h-4 animate-spin' />}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
