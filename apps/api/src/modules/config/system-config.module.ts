import { Module } from '@nestjs/common';
import { SystemConfigController } from './controllers/system-config.controller';
import { SystemConfigService } from './services/system-config.service';
import { ConfigRepository } from './repositories/config.repository';
import { TemplateLibraryModule } from '../template-library/template-library.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisCacheService } from '../../cache';
import { AppLogger } from '@intervu-ai/shared-logger';

@Module({
  imports: [PrismaModule, TemplateLibraryModule],
  controllers: [SystemConfigController],
  providers: [
    SystemConfigService,
    ConfigRepository,
    {
      provide: RedisCacheService,
      useFactory: () => {
        return new RedisCacheService(new AppLogger({ name: 'ConfigCache' }));
      },
    },
  ],
  exports: [SystemConfigService, ConfigRepository],
})
export class SystemConfigModule {}
