import { describe, it, expect } from "vitest";
import { UserResponseSchema } from "@intervu/shared";

describe("User Contract", () => {
  it("DTO ↔ Schema consistency", () => {
    const payload = {
      id: "cmqw29wmxp0001q9vxhgs0em6",
      email: "test@example.com",
      role: "CANDIDATE",
      createdAt: new Date(),
    };

    const result = UserResponseSchema.parse(payload);
    expect(result).toBeDefined();
    expect(result.id).toBe(payload.id);
  });
});
