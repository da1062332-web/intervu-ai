import { Module } from '@nestjs/common';
import { TestAssemblyController } from './controllers/test-assembly.controller';
import { TestRepository } from './repositories/test.repository';
import { TestAssemblyService } from './services/test-assembly.service';
import { QueueModule } from '../../queue';

@Module({
  imports: [QueueModule],
  controllers: [TestAssemblyController],
  providers: [TestRepository, TestAssemblyService],
  exports: [TestRepository, TestAssemblyService],
})
export class TestAssemblyModule {}
