"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponseSchema = void 0;
const zod_1 = require("zod");
const ApiResponseSchema = (dataSchema) => zod_1.z.object({
    success: zod_1.z.boolean(),
    message: zod_1.z.string(),
    data: dataSchema,
    timestamp: zod_1.z.string().datetime()
});
exports.ApiResponseSchema = ApiResponseSchema;
