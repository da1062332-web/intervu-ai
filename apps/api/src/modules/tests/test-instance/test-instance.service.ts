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
    } catch {
      throw new InternalServerErrorException(
        "TEST_CREATION_FAILED: Failed to create test instance",
      );
    }
  }

  async getTestInstance(id: string) {
    return this.repository.findById(id);
  }
}
