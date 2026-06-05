import { ApiSuccessResponse, CreateTestRequest } from "../../types";

export interface IApiContract {
  createTest(request: CreateTestRequest): Promise<ApiSuccessResponse>;
}
