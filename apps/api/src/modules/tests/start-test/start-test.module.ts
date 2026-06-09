import { Module } from '@nestjs/common';
import { StartTestController } from './start-test.controller';
import { StartTestService } from './start-test.service';
import { QuestionProviderService } from './question-provider.service';
import { TestInstanceService } from '../test-instance/test-instance.service';
import { TestInstanceRepository } from '../test-instance/test-instance.repository';
import { LifecycleModule } from '../../lifecycle/lifecycle.module';
import { PrismaModule } from '../../../prisma/prisma.module';
import { TestConfigRepository } from '../repositories/test-config.repository';
import { GeneratedQuestionRepository } from '../../question-pool/repositories/generated-question.repository';

@Module({
  imports: [LifecycleModule, PrismaModule],
  controllers: [StartTestController],
  providers: [
    StartTestService,
    QuestionProviderService,
    TestInstanceService,
    TestInstanceRepository,
    TestConfigRepository,
    GeneratedQuestionRepository,
  ],
})
export class StartTestModule {}
