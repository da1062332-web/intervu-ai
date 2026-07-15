'use client';

import React from 'react';
import {
  useStyleProfiles,
  useDeleteStyleProfile,
  useDuplicateStyleProfile,
  useUpdateStyleProfile,
} from '@/services/blueprints/hooks';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Edit2, Copy, Trash2, Shield, Settings, Info } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export function StyleProfileTable() {
  const { data: profiles, isLoading, isError, refetch } = useStyleProfiles();
  const deleteMutation = useDeleteStyleProfile();
  const duplicateMutation = useDuplicateStyleProfile();
  const updateMutation = useUpdateStyleProfile();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 w-full animate-pulse bg-muted rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-xl bg-card">
        <Info className="h-8 w-8 text-destructive mb-2" />
        <h4 className="font-semibold text-lg">Error loading style profiles</h4>
        <p className="text-sm text-muted-foreground mt-1">Please try refreshing the page.</p>
        <Button onClick={() => refetch()} className="mt-4 shadow-sm">
          Retry
        </Button>
      </div>
    );
  }

  if (!profiles || profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-xl bg-card">
        <Settings className="h-12 w-12 text-muted-foreground mb-4 animate-pulse" />
        <h4 className="font-semibold text-xl">No Style Profiles Found</h4>
        <p className="text-sm text-muted-foreground text-center max-w-sm mt-1">
          Create your first Style Profile to establish reusable generation rules for your blueprints.
        </p>
        <Button asChild className="mt-6 shadow-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
          <Link href="/admin/style-profiles/new">Create Style Profile</Link>
        </Button>
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this Style Profile?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Style Profile deleted successfully');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to delete Style Profile. It might be assigned to a Blueprint.';
      toast.error(msg);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateMutation.mutateAsync(id);
      toast.success('Style Profile duplicated successfully');
    } catch (err: any) {
      toast.error('Failed to duplicate Style Profile');
    }
  };

  const handleToggleActive = async (profile: any) => {
    try {
      await updateMutation.mutateAsync({
        id: profile.id,
        data: { active: !profile.active },
      });
      toast.success(`Profile ${!profile.active ? 'activated' : 'deactivated'} successfully`);
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  const handleSetDefault = async (profile: any) => {
    if (profile.isDefault) return;
    try {
      await updateMutation.mutateAsync({
        id: profile.id,
        data: { isDefault: true },
      });
      toast.success('Default Style Profile updated');
    } catch (err: any) {
      toast.error('Failed to set default profile');
    }
  };

  return (
    <div className="border rounded-xl bg-card shadow-sm overflow-hidden backdrop-blur-md bg-white/50">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="font-semibold">Profile Details</TableHead>
            <TableHead className="font-semibold">Type</TableHead>
            <TableHead className="font-semibold">Language / Constraints</TableHead>
            <TableHead className="font-semibold text-center">Status</TableHead>
            <TableHead className="font-semibold text-center">Default</TableHead>
            <TableHead className="font-semibold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((profile: any) => (
            <TableRow key={profile.id} className="hover:bg-muted/10 transition-colors">
              <TableCell>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{profile.name}</span>
                    {profile.isDefault && (
                      <Badge variant="secondary" className="bg-violet-100 text-violet-700 hover:bg-violet-100 dark:bg-violet-900/30 dark:text-violet-300 gap-1 text-[10px]">
                        <Shield className="h-3 w-3" /> Default
                      </Badge>
                    )}
                  </div>
                  {profile.description && (
                    <span className="text-xs text-muted-foreground mt-0.5 max-w-sm truncate">
                      {profile.description}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="capitalize">
                <Badge variant="outline" className="shadow-sm">
                  {profile.profileType || 'campus'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-col text-xs text-muted-foreground space-y-0.5">
                  <div>
                    <span className="font-semibold text-foreground">Lang:</span>{' '}
                    {profile.languageStyle?.language || 'English'} ({profile.languageStyle?.sentenceLength || 'medium'})
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Distractors:</span>{' '}
                    {profile.distractorRules?.exactlyFourOptions ? '4 Options' : 'Any'}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center">
                  <Switch
                    checked={profile.active}
                    onCheckedChange={() => handleToggleActive(profile)}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center">
                  <Button
                    variant={profile.isDefault ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSetDefault(profile)}
                    disabled={profile.isDefault}
                    className={`text-xs ${
                      profile.isDefault
                        ? 'bg-violet-600 hover:bg-violet-600 text-white shadow-sm'
                        : 'hover:bg-violet-50'
                    }`}
                  >
                    {profile.isDefault ? 'Active Default' : 'Set Default'}
                  </Button>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <Button asChild variant="ghost" size="icon" className="hover:text-foreground">
                    <Link href={`/admin/style-profiles/${profile.id}/edit`}>
                      <Edit2 className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDuplicate(profile.id)}
                    className="hover:text-foreground"
                    title="Duplicate Profile"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(profile.id)}
                    disabled={profile.isDefault}
                    className="hover:text-destructive text-muted-foreground disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
