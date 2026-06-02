import { Module } from '@nestjs/common';
import { TestRepository } from './repositories/test.repository';

@Module({
  providers: [TestRepository],
  exports: [TestRepository],
})
export class TestAssemblyModule {}
