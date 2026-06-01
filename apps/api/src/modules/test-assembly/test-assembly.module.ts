import { Module } from '@nestjs/common';
import { TestAssemblyController } from './controllers/test-assembly.controller';

@Module({
  controllers: [TestAssemblyController],
})
export class TestAssemblyModule {}
