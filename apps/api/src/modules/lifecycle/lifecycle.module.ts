import { Module } from '@nestjs/common';
import { EligibilityService } from './eligibility.service';
import { UserRepository } from '../users/repositories/user.repository';
import { TestConfigRepository } from '../tests/repositories/test-config.repository';
import { TestInstanceRepository } from '../tests/test-instance/test-instance.repository';

@Module({
  providers: [EligibilityService, UserRepository, TestConfigRepository, TestInstanceRepository],
  exports: [EligibilityService],
})
export class LifecycleModule {}
