import { UpdateTemplateDatasetConfigDto } from "../packages/shared/src/dto/template.dto";

function test(payload: any) {
  const result = UpdateTemplateDatasetConfigDto.validate(payload);
  if (!result.success) {
    console.log("❌ Failed validation for payload:", JSON.stringify(payload));
    console.log("Errors:", JSON.stringify(result.error.format(), null, 2));
  } else {
    console.log("✅ Passed validation for payload:", JSON.stringify(payload));
  }
}

console.log("Running DTO validation tests...\n");

// Test 1: Full correct payload
test({
  datasetId: "cmrdb07ma005x94gqjnydv8em",
  selectionMethod: "RANDOM",
  sampleSize: 1,
  shuffle: true,
  allowReuse: true,
  variableMapping: { role: "jobTitle" },
});

// Test 2: Missing datasetId (required)
test({
  selectionMethod: "RANDOM",
  sampleSize: 1,
});

// Test 3: Null selectionMethod
test({
  datasetId: "cmrdb07ma005x94gqjnydv8em",
  selectionMethod: null,
});

// Test 4: Array in variableMapping (invalid, should be object with string values)
test({
  datasetId: "cmrdb07ma005x94gqjnydv8em",
  variableMapping: ["role", "jobTitle"],
});

// Test 5: Number values in variableMapping
test({
  datasetId: "cmrdb07ma005x94gqjnydv8em",
  variableMapping: { role: 123 },
});
