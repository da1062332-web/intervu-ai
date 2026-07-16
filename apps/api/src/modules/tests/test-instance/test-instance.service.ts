import { Injectable, InternalServerErrorException } from "@nestjs/common";
import {
  TestInstanceRepository,
  CreateTestInstanceData,
} from "./test-instance.repository";

@Injectable()
export class TestInstanceService {
  constructor(private readonly repository: TestInstanceRepository) {}

  async createTestInstance(data: CreateTestInstanceData) {
    try {
      return await this.repository.create(data);
    } catch (err: any) {
      console.error("TEST_INSTANCE_CREATION_ERROR:", err);
      throw new InternalServerErrorException(
        "TEST_CREATION_FAILED: Failed to create test instance. " + err.message,
      );
    }
  }

  async getTestInstance(id: string) {
    return this.repository.findById(id);
  }
}
