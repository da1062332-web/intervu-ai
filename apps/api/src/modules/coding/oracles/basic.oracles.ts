import { Injectable } from "@nestjs/common";
import { BaseOracle } from "./base.oracle";

/**
 * 1. BASIC_ELIGIBILITY_CHECK_ORACLE
 */
@Injectable()
export class BasicEligibilityCheckOracle extends BaseOracle {
  readonly key = "BASIC_ELIGIBILITY_CHECK_ORACLE";
  readonly name = "Eligibility Check";
  readonly category = "BASIC";
  readonly description = "Determines whether a candidate satisfies multiple eligibility conditions.";
  readonly supportedDifficulties = ["EASY"];

  readonly parameterSchema = {
    age: { type: "integer", min: 0, max: 100, default: 22 },
    score: { type: "integer", min: 0, max: 100, default: 75 },
    experience: { type: "integer", min: 0, max: 50, default: 2 },
    minAge: { type: "integer", min: 0, max: 100, default: 18 },
    minScore: { type: "integer", min: 0, max: 100, default: 60 },
    minExperience: { type: "integer", min: 0, max: 50, default: 1 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const age = typeof parameters.age === "number" ? parameters.age : 22;
    const score = typeof parameters.score === "number" ? parameters.score : 75;
    const experience = typeof parameters.experience === "number" ? parameters.experience : 2;
    const minAge = typeof parameters.minAge === "number" ? parameters.minAge : 18;
    const minScore = typeof parameters.minScore === "number" ? parameters.minScore : 60;
    const minExperience = typeof parameters.minExperience === "number" ? parameters.minExperience : 1;

    return {
      age,
      score,
      experience,
      criteria: {
        minAge,
        minScore,
        minExperience,
      },
    };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const age = typeof input.age === "number" ? input.age : 0;
    const score = typeof input.score === "number" ? input.score : 0;
    const experience = typeof input.experience === "number" ? input.experience : 0;
    const minAge = typeof input.criteria?.minAge === "number" ? input.criteria.minAge : 18;
    const minScore = typeof input.criteria?.minScore === "number" ? input.criteria.minScore : 60;
    const minExperience = typeof input.criteria?.minExperience === "number" ? input.criteria.minExperience : 1;

    const isEligible = age >= minAge && score >= minScore && experience >= minExperience;
    const status = isEligible ? "ELIGIBLE" : "NOT_ELIGIBLE";

    return {
      eligible: isEligible,
      status,
      result: status,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.age !== "number" || input.age < 0 || input.age > 100) {
      errors.push("Input property 'age' must be an integer between 0 and 100.");
    }
    if (typeof input.score !== "number" || input.score < 0 || input.score > 100) {
      errors.push("Input property 'score' must be an integer between 0 and 100.");
    }
    if (typeof input.experience !== "number" || input.experience < 0 || input.experience > 50) {
      errors.push("Input property 'experience' must be an integer between 0 and 50.");
    }
    return errors;
  }
}

/**
 * 2. BASIC_DISCOUNT_CALCULATOR_ORACLE
 */
@Injectable()
export class BasicDiscountCalculatorOracle extends BaseOracle {
  readonly key = "BASIC_DISCOUNT_CALCULATOR_ORACLE";
  readonly name = "Discount Calculator";
  readonly category = "BASIC";
  readonly description = "Calculates the final purchase price after applying discount rules.";
  readonly supportedDifficulties = ["EASY"];

  readonly parameterSchema = {
    price: { type: "integer", min: 0, max: 1000000, default: 6500 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const price = typeof parameters.price === "number" ? Math.max(0, parameters.price) : 6500;
    return { price };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const price = typeof input.price === "number" ? Math.max(0, input.price) : 0;

    let discountPercentage = 0;
    if (price >= 10000) {
      discountPercentage = 15;
    } else if (price >= 5000) {
      discountPercentage = 10;
    } else if (price >= 1000) {
      discountPercentage = 5;
    } else {
      discountPercentage = 0;
    }

    const discountAmount = Math.round((price * discountPercentage) / 100);
    const finalPrice = Math.max(0, price - discountAmount);

    return {
      originalPrice: price,
      discountPercentage,
      discountAmount,
      finalPrice,
      result: finalPrice,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.price !== "number" || input.price < 0 || input.price > 1000000) {
      errors.push("Input property 'price' must be a non-negative number up to 1,000,000.");
    }
    return errors;
  }
}

/**
 * 3. BASIC_BILL_CALCULATOR_ORACLE
 */
@Injectable()
export class BasicBillCalculatorOracle extends BaseOracle {
  readonly key = "BASIC_BILL_CALCULATOR_ORACLE";
  readonly name = "Bill Calculator";
  readonly category = "BASIC";
  readonly description = "Calculates a bill from item quantities, prices and applicable charges.";
  readonly supportedDifficulties = ["EASY"];

  readonly parameterSchema = {
    itemCount: { type: "integer", min: 1, max: 10, default: 2 },
    unitPrice: { type: "integer", min: 50, max: 5000, default: 1200 },
    quantity: { type: "integer", min: 1, max: 20, default: 3 },
    taxRate: { type: "integer", min: 0, max: 100, default: 5 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const itemCount = typeof parameters.itemCount === "number" ? Math.max(1, Math.min(10, parameters.itemCount)) : 2;
    const basePrice = typeof parameters.unitPrice === "number" ? parameters.unitPrice : 1200;
    const baseQty = typeof parameters.quantity === "number" ? parameters.quantity : 3;
    const taxRate = typeof parameters.taxRate === "number" ? parameters.taxRate : 5;

    const items = [];
    for (let i = 0; i < itemCount; i++) {
      items.push({
        name: `Item_${i + 1}`,
        quantity: Math.max(1, baseQty + i),
        unitPrice: Math.max(1, basePrice + (i * 250)),
      });
    }

    return {
      items,
      taxRate,
    };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const items = Array.isArray(input.items) ? input.items : [];
    const taxRate = typeof input.taxRate === "number" ? input.taxRate : 5;

    let subtotal = 0;
    for (const item of items) {
      const q = typeof item.quantity === "number" ? item.quantity : 0;
      const p = typeof item.unitPrice === "number" ? item.unitPrice : 0;
      subtotal += q * p;
    }

    let discountPercentage = 0;
    if (subtotal >= 10000) {
      discountPercentage = 10;
    } else if (subtotal >= 5000) {
      discountPercentage = 5;
    }

    const discountAmount = Math.round((subtotal * discountPercentage) / 100);
    const discountedSubtotal = subtotal - discountAmount;
    const taxAmount = Math.round((discountedSubtotal * taxRate) / 100);
    const finalBill = discountedSubtotal + taxAmount;

    return {
      subtotal,
      discountPercentage,
      discountAmount,
      taxRate,
      taxAmount,
      finalBill,
      result: finalBill,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.items)) {
      errors.push("Input property 'items' must be an array.");
    }
    return errors;
  }
}

/**
 * 4. BASIC_SALARY_CALCULATOR_ORACLE
 */
@Injectable()
export class BasicSalaryCalculatorOracle extends BaseOracle {
  readonly key = "BASIC_SALARY_CALCULATOR_ORACLE";
  readonly name = "Salary Calculator";
  readonly category = "BASIC";
  readonly description = "Calculates final salary using salary components and business rules.";
  readonly supportedDifficulties = ["EASY"];

  readonly parameterSchema = {
    baseSalary: { type: "integer", min: 10000, max: 10000000, default: 60000 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const baseSalary = typeof parameters.baseSalary === "number" ? parameters.baseSalary : 60000;
    return { baseSalary };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const baseSalary = typeof input.baseSalary === "number" ? Math.max(0, input.baseSalary) : 0;

    const hra = Math.round(baseSalary * 0.2); // 20%
    const da = Math.round(baseSalary * 0.1); // 10%
    const grossSalary = baseSalary + hra + da;

    let taxPercentage = 0;
    if (baseSalary >= 100000) {
      taxPercentage = 20;
    } else if (baseSalary >= 50000) {
      taxPercentage = 10;
    } else {
      taxPercentage = 0;
    }

    const taxAmount = Math.round((grossSalary * taxPercentage) / 100);
    const netSalary = grossSalary - taxAmount;

    return {
      baseSalary,
      hra,
      da,
      grossSalary,
      taxPercentage,
      taxAmount,
      netSalary,
      result: netSalary,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.baseSalary !== "number" || input.baseSalary < 0) {
      errors.push("Input property 'baseSalary' must be a non-negative number.");
    }
    return errors;
  }
}

/**
 * 5. BASIC_TAX_CALCULATOR_ORACLE
 */
@Injectable()
export class BasicTaxCalculatorOracle extends BaseOracle {
  readonly key = "BASIC_TAX_CALCULATOR_ORACLE";
  readonly name = "Tax Slab Calculator";
  readonly category = "BASIC";
  readonly description = "Calculates tax using configurable income slabs.";
  readonly supportedDifficulties = ["EASY", "MEDIUM"];

  readonly parameterSchema = {
    income: { type: "integer", min: 0, max: 100000000, default: 750000 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const income = typeof parameters.income === "number" ? Math.max(0, parameters.income) : 750000;
    return { income };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const income = typeof input.income === "number" ? Math.max(0, input.income) : 0;

    let totalTax = 0;

    if (income > 1000000) {
      totalTax += (income - 1000000) * 0.3; // 30% on amount above 10L
      totalTax += 500000 * 0.2; // 20% on 5L to 10L (100,000)
      totalTax += 250000 * 0.05; // 5% on 2.5L to 5L (12,500)
    } else if (income > 500000) {
      totalTax += (income - 500000) * 0.2; // 20% on amount between 5L and 10L
      totalTax += 250000 * 0.05; // 5% on 2.5L to 5L (12,500)
    } else if (income > 250000) {
      totalTax += (income - 250000) * 0.05; // 5% on amount between 2.5L and 5L
    } else {
      totalTax = 0;
    }

    const roundedTax = Math.round(totalTax);
    const effectiveRate = income > 0 ? parseFloat(((roundedTax / income) * 100).toFixed(2)) : 0;

    return {
      income,
      totalTax: roundedTax,
      effectiveTaxRate: effectiveRate,
      result: roundedTax,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.income !== "number" || input.income < 0) {
      errors.push("Input property 'income' must be a non-negative integer.");
    }
    return errors;
  }
}
