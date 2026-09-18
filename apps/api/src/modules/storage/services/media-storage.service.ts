import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AppConfigService } from '../../../config/config.service';
import { AppLogger } from '@intervu-ai/shared-logger';

@Injectable()
export class MediaStorageService {
  private readonly logger = new AppLogger({ name: 'MediaStorageService' });

  constructor(private readonly config: AppConfigService) {}

  private get supabaseUrl(): string {
    const url = this.config.supabaseUrl;
    return url ? url.trim().replace(/\/+$/, '') : '';
  }

  private get serviceRoleKey(): string {
    return (this.config.supabaseServiceRoleKey || '').trim();
  }

  private get bucket(): string {
    return (this.config.supabaseMediaBucket || 'skillitrix-media').trim();
  }

  private validateConfig(): void {
    const url = this.supabaseUrl;
    if (!url || !url.startsWith('http')) {
      this.logger.error(
        `Invalid or missing SUPABASE_URL: "${url}". Please set SUPABASE_URL in apps/api/.env (e.g. https://your-project.supabase.co)`,
      );
      throw new InternalServerErrorException(
        'Supabase Storage URL is missing or invalid. Please set SUPABASE_URL in apps/api/.env',
      );
    }

    if (!this.serviceRoleKey) {
      this.logger.error(
        'Missing SUPABASE_SERVICE_ROLE_KEY. Please set SUPABASE_SERVICE_ROLE_KEY in apps/api/.env',
      );
      throw new InternalServerErrorException(
        'Supabase Service Role Key is missing. Please set SUPABASE_SERVICE_ROLE_KEY in apps/api/.env',
      );
    }
  }

  /**
   * Upload a file buffer to Supabase Storage.
   * Returns the storage key (path inside bucket).
   */
  async upload(
    storageKey: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    this.validateConfig();

    const url = `${this.supabaseUrl}/storage/v1/object/${this.bucket}/${storageKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.serviceRoleKey}`,
        apikey: this.serviceRoleKey,
        'Content-Type': mimeType,
        'x-upsert': 'false',
      },
      body: new Uint8Array(buffer),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Supabase upload failed: ${response.status} ${body}`);
      throw new InternalServerErrorException(`Supabase upload failed: ${response.status} ${body}`);
    }

    return storageKey;
  }

  /**
   * Returns the public CDN URL for a given storage key.
   * Assumes the bucket is configured as public in Supabase.
   */
  getPublicUrl(storageKey: string): string {
    const url = this.supabaseUrl;
    if (!url || !url.startsWith('http')) {
      return storageKey;
    }
    return `${url}/storage/v1/object/public/${this.bucket}/${storageKey}`;
  }

  /**
   * Delete a file from storage.
   */
  async delete(storageKey: string): Promise<void> {
    this.validateConfig();

    const url = `${this.supabaseUrl}/storage/v1/object/${this.bucket}/${storageKey}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.serviceRoleKey}`,
        apikey: this.serviceRoleKey,
      },
    });

    if (!response.ok) {
      this.logger.warn(`Supabase delete failed for key: ${storageKey}`);
    }
  }
}
