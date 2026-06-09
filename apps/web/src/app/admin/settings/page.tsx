import type { Metadata } from 'next';
import { Bell, Shield, Palette, Globe, ChevronRight } from 'lucide-react';

import { PageHeader } from '@/components/admin/dashboard/page-header';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Settings — InterVu AI',
  description: 'Configure your InterVu AI account preferences and settings.',
};

// ─── Settings Section ─────────────────────────────────────────────────────────

interface SettingItemProps {
  label: string;
  description: string;
  id: string;
}

function SettingItem({ label, description, id }: SettingItemProps) {
  return (
    <button
      id={id}
      className='flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset'
      type='button'
    >
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-medium text-foreground'>{label}</p>
        <p className='mt-0.5 text-xs text-muted-foreground'>{description}</p>
      </div>
      <ChevronRight className='size-4 text-muted-foreground shrink-0' aria-hidden='true' />
    </button>
  );
}

// ─── Settings Group ───────────────────────────────────────────────────────────

interface SettingsGroupProps {
  icon: React.ElementType;
  title: string;
  items: Array<{ label: string; description: string; id: string }>;
}

function SettingsGroup({ icon: Icon, title, items }: SettingsGroupProps) {
  return (
    <section aria-labelledby={`settings-group-${title.toLowerCase()}`}>
      <div className='flex items-center gap-2.5 mb-3'>
        <div className='flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary'>
          <Icon className='size-4' aria-hidden='true' />
        </div>
        <h2
          id={`settings-group-${title.toLowerCase()}`}
          className='text-sm font-semibold text-foreground'
        >
          {title}
        </h2>
      </div>
      <div className='rounded-2xl border border-border bg-card shadow-sm overflow-hidden divide-y divide-border'>
        {items.map((item) => (
          <SettingItem key={item.id} {...item} />
        ))}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div className='space-y-8 max-w-2xl'>
      <PageHeader
        title='Settings'
        subtitle='Configure your account preferences and application settings.'
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Settings' }]}
      />

      <SettingsGroup
        icon={Bell}
        title='Notifications'
        items={[
          {
            id: 'setting-email-notifs',
            label: 'Email Notifications',
            description: 'Receive updates about candidate completions and results.',
          },
          {
            id: 'setting-assessment-alerts',
            label: 'Assessment Alerts',
            description: 'Get notified when a test is submitted or flagged.',
          },
        ]}
      />

      <SettingsGroup
        icon={Palette}
        title='Appearance'
        items={[
          {
            id: 'setting-theme',
            label: 'Color Theme',
            description: 'Choose between light, dark, or system theme.',
          },
          {
            id: 'setting-density',
            label: 'Display Density',
            description: 'Adjust the information density of the interface.',
          },
        ]}
      />

      <SettingsGroup
        icon={Shield}
        title='Security'
        items={[
          {
            id: 'setting-change-password',
            label: 'Change Password',
            description: 'Update your account password.',
          },
          {
            id: 'setting-2fa',
            label: 'Two-Factor Authentication',
            description: 'Add an extra layer of security to your account.',
          },
          {
            id: 'setting-sessions',
            label: 'Active Sessions',
            description: 'View and manage devices logged into your account.',
          },
        ]}
      />

      <SettingsGroup
        icon={Globe}
        title='Preferences'
        items={[
          {
            id: 'setting-language',
            label: 'Language',
            description: 'Select your preferred display language.',
          },
          {
            id: 'setting-timezone',
            label: 'Timezone',
            description: 'Set the timezone for scheduling and timestamps.',
          },
        ]}
      />

      {/* Danger zone */}
      <section aria-labelledby='danger-zone-heading'>
        <div className='flex items-center gap-2.5 mb-3'>
          <h2 id='danger-zone-heading' className='text-sm font-semibold text-destructive'>
            Danger Zone
          </h2>
        </div>
        <div className='rounded-2xl border border-destructive/30 bg-card shadow-sm p-6'>
          <div className='flex items-center justify-between gap-4'>
            <div>
              <p className='text-sm font-medium text-foreground'>Delete Account</p>
              <p className='mt-0.5 text-xs text-muted-foreground'>
                Permanently delete your account and all associated data. This cannot be undone.
              </p>
            </div>
            <Button variant='destructive' size='sm' id='delete-account-btn' className='shrink-0'>
              Delete Account
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
