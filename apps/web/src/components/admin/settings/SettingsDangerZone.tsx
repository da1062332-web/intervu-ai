"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

export default function SettingsDangerZone() {
  return (
    <section aria-labelledby="danger-zone-heading">
      <SectionHeader title="Danger Zone" className="text-destructive !mb-3 text-sm font-semibold" />
      <Card className="border-destructive/30 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">Delete Account</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Permanently delete your account and all associated data. This cannot be undone.
            </p>
          </div>
          <ConfirmationDialog
            title="Delete Account"
            description="Are you absolutely sure you want to delete your account? This action cannot be undone and all data will be lost."
            confirmLabel="Delete Account"
            destructive
            onConfirm={async () => {
              // Handle delete logic here
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }}
            trigger={
              <Button variant="destructive" size="sm" id="delete-account-btn" className="shrink-0">
                Delete Account
              </Button>
            }
          />
        </div>
      </Card>
    </section>
  );
}
