import { Module } from '@nestjs/common';
import { TestAssemblyController } from './controllers/test-assembly.controller';
import { TestRepository } from './repositories/test.repository';

@Module({
  controllers: [TestAssemblyController],
  providers: [TestRepository],
  exports: [TestRepository],
})
export class TestAssemblyModule {}
