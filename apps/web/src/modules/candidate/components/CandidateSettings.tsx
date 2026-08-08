'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { User, Bell, ShieldAlert, LogOut, CheckCircle2 } from 'lucide-react';
import { CustomFormCard } from '@/components/ui/custom-form-card';
import { Textarea } from '@/components/ui/textarea';

export function CandidateSettings() {
  const [isSaving, setIsSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  // Mock save function
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 1000);
  };

  return (
    <div className='flex flex-col md:flex-row gap-8 mt-6'>
      <Tabs defaultValue='preferences' className='flex-1 flex flex-col md:flex-row gap-8'>
        {/* Sidebar Navigation */}
        <div className='w-full md:w-64 shrink-0'>
          <TabsList className='flex flex-col h-auto w-full bg-transparent p-0 space-y-1'>
            <TabsTrigger
              value='preferences'
              className='w-full justify-start px-4 py-3 rounded-xl data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted/50 transition-colors'
            >
              <Bell className='mr-3 size-4' />
              Preferences
            </TabsTrigger>
            <TabsTrigger
              value='security'
              className='w-full justify-start px-4 py-3 rounded-xl data-[state=active]:bg-red-500/10 data-[state=active]:text-red-600 data-[state=active]:shadow-none hover:bg-muted/50 transition-colors text-muted-foreground'
            >
              <ShieldAlert className='mr-3 size-4' />
              Security
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Content Area */}
        <div className='flex-1'>
          {/* PREFERENCES TAB */}
          <TabsContent value='preferences' className='m-0 animate-in fade-in-50 duration-500'>
            <Card className='border-border/50 shadow-sm'>
              <CardHeader>
                <CardTitle className='text-xl'>Preferences</CardTitle>
                <CardDescription>Manage your notifications and system preferences.</CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='space-y-4'>
                  <h3 className='font-medium text-sm text-muted-foreground uppercase tracking-wider'>
                    Email Notifications
                  </h3>

                  <div className='flex items-center justify-between space-x-2 rounded-lg border p-4 shadow-sm'>
                    <div className='space-y-0.5'>
                      <Label className='text-base'>Assessment Invites</Label>
                      <p className='text-sm text-muted-foreground'>
                        Receive an email when a recruiter invites you to an assessment.
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className='flex items-center justify-between space-x-2 rounded-lg border p-4 shadow-sm'>
                    <div className='space-y-0.5'>
                      <Label className='text-base'>Assessment Reminders</Label>
                      <p className='text-sm text-muted-foreground'>
                        Get reminded 24 hours before an assessment deadline.
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className='flex items-center justify-between space-x-2 rounded-lg border p-4 shadow-sm'>
                    <div className='space-y-0.5'>
                      <Label className='text-base'>Marketing & Updates</Label>
                      <p className='text-sm text-muted-foreground'>
                        Receive emails about new features and product updates.
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SECURITY TAB */}
          <TabsContent value='security' className='m-0 animate-in fade-in-50 duration-500'>
            <div className='space-y-6'>
              <Card className='border-border/50 shadow-sm'>
                <CardHeader>
                  <CardTitle className='text-xl'>Security</CardTitle>
                  <CardDescription>
                    Manage your password and authentication settings.
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>Password</p>
                      <p className='text-sm text-muted-foreground'>
                        Set a unique password to protect your account.
                      </p>
                    </div>
                    <Button variant='outline'>Change Password</Button>
                  </div>
                  <Separator />
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>Active Sessions</p>
                      <p className='text-sm text-muted-foreground'>
                        Sign out of all other devices.
                      </p>
                    </div>
                    <Button variant='secondary' className='gap-2'>
                      <LogOut className='size-4' /> Sign out all
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className='border-red-500/20 bg-red-500/5 shadow-sm'>
                <CardHeader>
                  <CardTitle className='text-xl text-red-600 dark:text-red-400'>
                    Danger Zone
                  </CardTitle>
                  <CardDescription>
                    Permanently delete your account and all associated data.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-muted-foreground mb-4'>
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <Button variant='destructive' className='w-full sm:w-auto'>
                    Delete Account
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
