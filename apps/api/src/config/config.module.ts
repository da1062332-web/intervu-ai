import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

import { envSchema, EnvConfig } from './env.schema';
import { AppConfigService } from './config.service';

@Module({
  imports: [
    NestConfigModule.forRoot({
      validate: (config) => {
        const parsed = envSchema.safeParse(config);

        if (!parsed.success) {
          const errors = parsed.error.flatten();
          throw new Error(
            `Environment validation failed: ${JSON.stringify(errors)}`,
          );
        }

        return parsed.data;
      },
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class ConfigModule {}
