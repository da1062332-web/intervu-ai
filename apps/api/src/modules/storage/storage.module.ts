import { Module } from '@nestjs/common';
import { ConfigModule } from '../../config/config.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { MediaStorageService } from './services/media-storage.service';
import { MediaValidationService } from './services/media-validation.service';
import { MediaAssetService } from './services/media-asset.service';
import { MediaController } from './controllers/media.controller';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [MediaController],
  providers: [MediaStorageService, MediaValidationService, MediaAssetService],
  exports: [MediaStorageService, MediaValidationService, MediaAssetService],
})
export class StorageModule {}
