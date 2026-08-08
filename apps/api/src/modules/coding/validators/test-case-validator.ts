import { Injectable } from "@nestjs/common";
import { GeneratedTestSuite } from "../generators/test-suite-generator.service";

@Injectable()
export class TestCaseValidator {
  validate(testSuite: GeneratedTestSuite): string[] {
    const errors: string[] = [];

    if (!testSuite) {
      errors.push("TestSuite object is missing.");
      return errors;
    }

    if (!testSuite.publicTests || testSuite.publicTests.length === 0) {
      errors.push("TestSuite does not contain any public test cases.");
    }

    if (!testSuite.hiddenTests || testSuite.hiddenTests.length === 0) {
      errors.push("TestSuite does not contain any hidden test cases.");
    }

    const allTests = [
      ...testSuite.publicTests,
      ...testSuite.hiddenTests,
      ...testSuite.stressTests,
      ...testSuite.boundaryTests,
    ];

    for (let i = 0; i < allTests.length; i++) {
      const test = allTests[i];
      if (!test.input || Object.keys(test.input).length === 0) {
        errors.push(
          `Test case #${i + 1} has an empty or invalid input payload.`,
        );
      }
      if (test.expectedOutput === undefined || test.expectedOutput === null) {
        errors.push(`Test case #${i + 1} has undefined expected output.`);
      }
    }

    return errors;
  }
}
