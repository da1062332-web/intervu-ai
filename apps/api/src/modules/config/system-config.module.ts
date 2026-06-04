import { Module } from '@nestjs/common';
import { SystemConfigController } from './controllers/system-config.controller';
import { SystemConfigService } from './services/system-config.service';
import { ConfigRepository } from './repositories/config.repository';
import { TemplateLibraryModule } from '../template-library/template-library.module';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * SystemConfigModule — manages system configuration and templates.
 *
 * RedisCacheService is NOT declared here as a provider.
 * It is provided by the global CacheModule registered in AppModule
 * and is automatically available for injection in all modules.
 */
@Module({
  imports: [PrismaModule, TemplateLibraryModule],
  controllers: [SystemConfigController],
  providers: [SystemConfigService, ConfigRepository],
  exports: [SystemConfigService, ConfigRepository],
})
export class SystemConfigModule {}
