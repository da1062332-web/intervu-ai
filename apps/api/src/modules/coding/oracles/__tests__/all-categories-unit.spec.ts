import * as StandardOracles from "../standard-oracles";

describe("TCS Advanced Coding Catalog - Category-Specific Unit Tests", () => {
  describe("1. BASIC Category", () => {
    it("BASIC_ELIGIBILITY_CHECK_ORACLE: handles eligible and non-eligible candidates", () => {
      const oracle = new StandardOracles.BasicEligibilityCheckOracle();

      const passInput = oracle.generateInput({ age: 25, score: 80, experience: 3, minAge: 18, minScore: 60, minExperience: 1 });
      const passOutput = oracle.generateExpectedOutput(passInput);
      expect(passOutput.eligible).toBe(true);
      expect(passOutput.status).toBe("ELIGIBLE");

      const failInput = oracle.generateInput({ age: 17, score: 80, experience: 3, minAge: 18, minScore: 60, minExperience: 1 });
      const failOutput = oracle.generateExpectedOutput(failInput);
      expect(failOutput.eligible).toBe(false);
      expect(failOutput.status).toBe("NOT_ELIGIBLE");
    });

    it("BASIC_DISCOUNT_CALCULATOR_ORACLE: computes tiered discount slabs accurately", () => {
      const oracle = new StandardOracles.BasicDiscountCalculatorOracle();

      expect(oracle.generateExpectedOutput({ price: 500 }).finalPrice).toBe(500); // 0%
      expect(oracle.generateExpectedOutput({ price: 2000 }).finalPrice).toBe(1900); // 5% off
      expect(oracle.generateExpectedOutput({ price: 6000 }).finalPrice).toBe(5400); // 10% off
      expect(oracle.generateExpectedOutput({ price: 20000 }).finalPrice).toBe(17000); // 15% off
    });

    it("BASIC_BILL_CALCULATOR_ORACLE: computes subtotal, tiered discount, and tax", () => {
      const oracle = new StandardOracles.BasicBillCalculatorOracle();
      const input = {
        items: [
          { quantity: 2, unitPrice: 2000 },
          { quantity: 2, unitPrice: 1000 },
        ],
        taxRate: 5,
      };
      // subtotal = 4000 + 2000 = 6000 -> 5% discount = 300 -> 5700 -> 5% tax = 285 -> finalBill = 5985
      const output = oracle.generateExpectedOutput(input);
      expect(output.subtotal).toBe(6000);
      expect(output.discountAmount).toBe(300);
      expect(output.taxAmount).toBe(285);
      expect(output.finalBill).toBe(5985);
    });

    it("BASIC_SALARY_CALCULATOR_ORACLE: computes HRA, DA, tax, and net salary", () => {
      const oracle = new StandardOracles.BasicSalaryCalculatorOracle();
      const input = { baseSalary: 100000 };
      // hra = 20000, da = 10000, gross = 130000, tax 20% on gross = 26000, net = 104000
      const output = oracle.generateExpectedOutput(input);
      expect(output.hra).toBe(20000);
      expect(output.da).toBe(10000);
      expect(output.grossSalary).toBe(130000);
      expect(output.taxAmount).toBe(26000);
      expect(output.netSalary).toBe(104000);
    });

    it("BASIC_TAX_CALCULATOR_ORACLE: calculates progressive income tax slabs", () => {
      const oracle = new StandardOracles.BasicTaxCalculatorOracle();

      expect(oracle.generateExpectedOutput({ income: 200000 }).totalTax).toBe(0);
      // 400,000 -> 5% of 150,000 = 7,500
      expect(oracle.generateExpectedOutput({ income: 400000 }).totalTax).toBe(7500);
      // 800,000 -> 12,500 + 20% of 300,000 (60,000) = 72,500
      expect(oracle.generateExpectedOutput({ income: 800000 }).totalTax).toBe(72500);
      // 1,200,000 -> 12,500 + 100,000 + 30% of 200,000 (60,000) = 172,500
      expect(oracle.generateExpectedOutput({ income: 1200000 }).totalTax).toBe(172500);
    });
  });

  describe("2. STRING Category", () => {
    it("STRING_PALINDROME_ORACLE: verifies palindrome forward and backward", () => {
      const oracle = new StandardOracles.StringPalindromeOracle();
      expect(oracle.generateExpectedOutput({ str: "racecar" }).isPalindrome).toBe(true);
      expect(oracle.generateExpectedOutput({ str: "hello" }).isPalindrome).toBe(false);
    });

    it("STRING_REVERSE_ORACLE: reverses string", () => {
      const oracle = new StandardOracles.StringReverseOracle();
      expect(oracle.generateExpectedOutput({ str: "abcde" }).reversedStr).toBe("edcba");
    });

    it("STRING_CASE_CONVERSION_ORACLE: converts uppercase and lowercase", () => {
      const oracle = new StandardOracles.StringCaseConversionOracle();
      expect(oracle.generateExpectedOutput({ str: "abc 123", mode: "UPPERCASE" }).convertedStr).toBe("ABC 123");
      expect(oracle.generateExpectedOutput({ str: "XYZ 789", mode: "LOWERCASE" }).convertedStr).toBe("xyz 789");
    });

    it("STRING_VOWEL_COUNT_ORACLE: counts vowels", () => {
      const oracle = new StandardOracles.StringVowelCountOracle();
      expect(oracle.generateExpectedOutput({ str: "Education" }).count).toBe(5);
    });

    it("STRING_CHARACTER_COUNT_ORACLE: counts specific character", () => {
      const oracle = new StandardOracles.StringCharacterCountOracle();
      expect(oracle.generateExpectedOutput({ str: "banana", targetChar: "a" }).count).toBe(3);
    });

    it("STRING_FREQUENCY_ORACLE: character frequency map", () => {
      const oracle = new StandardOracles.StringFrequencyOracle();
      expect(oracle.generateExpectedOutput({ str: "aab" }).frequencies).toEqual({ a: 2, b: 1 });
    });

    it("STRING_SUBSTRING_COUNT_ORACLE: overlapping substring count", () => {
      const oracle = new StandardOracles.StringSubstringCountOracle();
      expect(oracle.generateExpectedOutput({ str: "aaaa", sub: "aa" }).count).toBe(3);
    });

    it("STRING_ANAGRAM_ORACLE: anagram check", () => {
      const oracle = new StandardOracles.StringAnagramOracle();
      expect(oracle.generateExpectedOutput({ str1: "listen", str2: "silent" }).isAnagram).toBe(true);
      expect(oracle.generateExpectedOutput({ str1: "apple", str2: "peach" }).isAnagram).toBe(false);
    });

    it("STRING_WORD_COUNT_ORACLE: counts words", () => {
      const oracle = new StandardOracles.StringWordCountOracle();
      expect(oracle.generateExpectedOutput({ sentence: "   Hello   world from   AI  " }).wordCount).toBe(4);
    });

    it("STRING_LARGEST_WORD_ORACLE: finds largest word", () => {
      const oracle = new StandardOracles.StringLargestWordOracle();
      expect(oracle.generateExpectedOutput({ sentence: "Find the largest word in this text" }).largestWord).toBe("largest");
    });

    it("STRING_REMOVE_SPACES_ORACLE: removes all spaces", () => {
      const oracle = new StandardOracles.StringRemoveSpacesOracle();
      expect(oracle.generateExpectedOutput({ str: "a b  c   d" }).resultStr).toBe("abcd");
    });

    it("STRING_FIRST_NON_REPEATING_ORACLE: first non-repeating character", () => {
      const oracle = new StandardOracles.StringFirstNonRepeatingOracle();
      expect(oracle.generateExpectedOutput({ str: "swiss" }).char).toBe("w");
    });

    it("STRING_REMOVE_DUPLICATES_ORACLE: removes duplicate characters", () => {
      const oracle = new StandardOracles.StringRemoveDuplicatesOracle();
      expect(oracle.generateExpectedOutput({ str: "banana" }).resultStr).toBe("ban");
    });

    it("STRING_WORD_FREQUENCY_ORACLE: word frequency map", () => {
      const oracle = new StandardOracles.StringWordFrequencyOracle();
      expect(oracle.generateExpectedOutput({ sentence: "to be or not to be" }).frequencies).toEqual({
        to: 2,
        be: 2,
        or: 1,
        not: 1,
      });
    });
  });

  describe("3. ARRAY Category", () => {
    it("ARRAY_SUM_ORACLE / MAX / MIN / REVERSE / COUNT_EVEN / FREQUENCY", () => {
      expect(new StandardOracles.ArraySumOracle().generateExpectedOutput({ arr: [1, 2, 3, 4] }).sum).toBe(10);
      expect(new StandardOracles.ArrayMaxOracle().generateExpectedOutput({ arr: [5, 12, 3] }).max).toBe(12);
      expect(new StandardOracles.ArrayMinOracle().generateExpectedOutput({ arr: [5, 12, 3] }).min).toBe(3);
      expect(new StandardOracles.ArrayReverseOracle().generateExpectedOutput({ arr: [1, 2, 3] }).reversedArr).toEqual([3, 2, 1]);
      expect(new StandardOracles.ArrayCountEvenOracle().generateExpectedOutput({ arr: [1, 2, 3, 4, 6] }).evenCount).toBe(3);
      expect(new StandardOracles.ArrayFrequencyOracle().generateExpectedOutput({ arr: [1, 2, 2, 3] }).frequencies).toEqual({ "1": 1, "2": 2, "3": 1 });
    });

    it("ARRAY_SECOND_LARGEST_ORACLE: handles duplicate maximums correctly", () => {
      const oracle = new StandardOracles.ArraySecondLargestOracle();
      expect(oracle.generateExpectedOutput({ arr: [10, 10, 9, 8] }).secondLargest).toBe(9);
      expect(oracle.generateExpectedOutput({ arr: [5, 5, 5] }).secondLargest).toBe(-1);
    });

    it("ARRAY_ROTATION_ORACLE / LEFT_ROTATION", () => {
      expect(new StandardOracles.ArrayRotationOracle().generateExpectedOutput({ arr: [1, 2, 3, 4, 5], k: 2 }).rotatedArr).toEqual([4, 5, 1, 2, 3]);
      expect(new StandardOracles.ArrayLeftRotationOracle().generateExpectedOutput({ arr: [1, 2, 3, 4, 5], k: 2 }).rotatedArr).toEqual([3, 4, 5, 1, 2]);
    });

    it("ARRAY_REMOVE_DUPLICATES / MOVE_ZEROS / LINEAR_SEARCH / BINARY_SEARCH", () => {
      expect(new StandardOracles.ArrayRemoveDuplicatesOracle().generateExpectedOutput({ arr: [1, 2, 2, 3, 1] }).uniqueArr).toEqual([1, 2, 3]);
      expect(new StandardOracles.ArrayMoveZerosOracle().generateExpectedOutput({ arr: [0, 1, 0, 3, 12] }).resultArr).toEqual([1, 3, 12, 0, 0]);
      expect(new StandardOracles.ArrayLinearSearchOracle().generateExpectedOutput({ arr: [10, 20, 30], target: 20 }).index).toBe(1);
      expect(new StandardOracles.ArrayBinarySearchOracle().generateExpectedOutput({ arr: [10, 20, 30, 40], target: 30 }).index).toBe(2);
    });

    it("ARRAY_MISSING_NUMBER / DUPLICATE_NUMBER / COMMON_ELEMENTS", () => {
      expect(new StandardOracles.ArrayMissingNumberOracle().generateExpectedOutput({ arr: [0, 1, 2, 4, 5], n: 5 }).missingNumber).toBe(3);
      expect(new StandardOracles.ArrayDuplicateNumberOracle().generateExpectedOutput({ arr: [1, 3, 4, 2, 2] }).duplicateNumber).toBe(2);
      expect(new StandardOracles.ArrayCommonElementsOracle().generateExpectedOutput({ arr1: [1, 2, 3, 4], arr2: [3, 4, 5, 6] }).commonElements).toEqual([3, 4]);
    });
  });

  describe("4. MATH Category", () => {
    it("MATH_PRIME_CHECK / GCD / LCM", () => {
      expect(new StandardOracles.MathPrimeCheckOracle().generateExpectedOutput({ n: 17 }).isPrime).toBe(true);
      expect(new StandardOracles.MathPrimeCheckOracle().generateExpectedOutput({ n: 18 }).isPrime).toBe(false);
      expect(new StandardOracles.MathGcdOracle().generateExpectedOutput({ a: 48, b: 18 }).gcd).toBe(6);
      expect(new StandardOracles.MathLcmOracle().generateExpectedOutput({ a: 12, b: 15 }).lcm).toBe(60);
    });

    it("MATH_DIGIT_SUM / COUNT / REVERSE / PRODUCT", () => {
      expect(new StandardOracles.MathDigitSumOracle().generateExpectedOutput({ n: 1234 }).digitSum).toBe(10);
      expect(new StandardOracles.MathDigitCountOracle().generateExpectedOutput({ n: 98765 }).digitCount).toBe(5);
      expect(new StandardOracles.MathNumberReverseOracle().generateExpectedOutput({ n: 12345 }).reversedNumber).toBe(54321);
      expect(new StandardOracles.MathDigitProductOracle().generateExpectedOutput({ n: 234 }).digitProduct).toBe(24);
    });

    it("MATH_ARMSTRONG / PERFECT / PALINDROME / DIGIT_FREQUENCY / FACTORIAL", () => {
      expect(new StandardOracles.MathArmstrongOracle().generateExpectedOutput({ n: 153 }).isArmstrong).toBe(true);
      expect(new StandardOracles.MathArmstrongOracle().generateExpectedOutput({ n: 154 }).isArmstrong).toBe(false);
      expect(new StandardOracles.MathPerfectNumberOracle().generateExpectedOutput({ n: 28 }).isPerfect).toBe(true);
      expect(new StandardOracles.MathNumberPalindromeOracle().generateExpectedOutput({ n: 12321 }).isPalindrome).toBe(true);
      expect(new StandardOracles.MathDigitFrequencyOracle().generateExpectedOutput({ n: 1123 }).frequencies).toEqual({ "1": 2, "2": 1, "3": 1 });
      expect(new StandardOracles.MathFactorialOracle().generateExpectedOutput({ n: 5 }).factorial).toBe(120);
    });
  });

  describe("5. RECURSION Category", () => {
    it("RECURSION_FACTORIAL / FIBONACCI / POWER / SUM_N / DIGIT_SUM / DIGIT_COUNT", () => {
      expect(new StandardOracles.RecursionFactorialOracle().generateExpectedOutput({ n: 6 }).factorial).toBe(720);
      expect(new StandardOracles.RecursionFibonacciOracle().generateExpectedOutput({ n: 7 }).fibonacci).toBe(13);
      expect(new StandardOracles.RecursionPowerOracle().generateExpectedOutput({ base: 2, exp: 5 }).power).toBe(32);
      expect(new StandardOracles.RecursionSumNOracle().generateExpectedOutput({ n: 10 }).sum).toBe(55);
      expect(new StandardOracles.RecursionDigitSumOracle().generateExpectedOutput({ n: 456 }).digitSum).toBe(15);
      expect(new StandardOracles.RecursionDigitCountOracle().generateExpectedOutput({ n: 123456 }).digitCount).toBe(6);
    });
  });

  describe("6. SORT Category", () => {
    it("SORT_BUBBLE / SELECTION / INSERTION / MERGE / CHECK_SORTED / CUSTOM / BY_FREQUENCY / EVEN_ODD", () => {
      expect(new StandardOracles.SortBubbleSortOracle().generateExpectedOutput({ arr: [5, 2, 8, 1] }).sortedArr).toEqual([1, 2, 5, 8]);
      expect(new StandardOracles.SortSelectionSortOracle().generateExpectedOutput({ arr: [5, 2, 8, 1] }).sortedArr).toEqual([1, 2, 5, 8]);
      expect(new StandardOracles.SortInsertionSortOracle().generateExpectedOutput({ arr: [5, 2, 8, 1] }).sortedArr).toEqual([1, 2, 5, 8]);
      expect(new StandardOracles.SortMergeSortedArraysOracle().generateExpectedOutput({ arr1: [1, 4], arr2: [2, 3] }).mergedArr).toEqual([1, 2, 3, 4]);
      expect(new StandardOracles.SortCheckSortedOracle().generateExpectedOutput({ arr: [1, 2, 3, 4] }).isSorted).toBe(true);
      expect(new StandardOracles.SortCustomOrderOracle().generateExpectedOutput({ arr: [1, 4, 2], order: "DESCENDING" }).sortedArr).toEqual([4, 2, 1]);
      expect(new StandardOracles.SortByFrequencyOracle().generateExpectedOutput({ arr: [4, 5, 6, 5, 4, 3] }).sortedArr).toEqual([4, 4, 5, 5, 3, 6]);
      expect(new StandardOracles.SortEvenOddOracle().generateExpectedOutput({ arr: [5, 2, 8, 1, 3, 4] }).sortedArr).toEqual([2, 4, 8, 1, 3, 5]);
    });
  });

  describe("7. MATRIX Category", () => {
    it("MATRIX_TRANSPOSE / DIAGONAL_SUM / ROW_SUM / COLUMN_SUM / SEARCH / BOUNDARY / SPIRAL / ROTATION", () => {
      const mat = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ];
      expect(new StandardOracles.MatrixTransposeOracle().generateExpectedOutput({ matrix: mat }).transposedMatrix).toEqual([
        [1, 4, 7],
        [2, 5, 8],
        [3, 6, 9],
      ]);
      expect(new StandardOracles.MatrixDiagonalSumOracle().generateExpectedOutput({ matrix: mat }).primarySum).toBe(15);
      expect(new StandardOracles.MatrixRowSumOracle().generateExpectedOutput({ matrix: mat }).rowSums).toEqual([6, 15, 24]);
      expect(new StandardOracles.MatrixColumnSumOracle().generateExpectedOutput({ matrix: mat }).columnSums).toEqual([12, 15, 18]);
      expect(new StandardOracles.MatrixSearchOracle().generateExpectedOutput({ matrix: mat, target: 5 }).position).toEqual([1, 1]);
      expect(new StandardOracles.MatrixBoundaryTraversalOracle().generateExpectedOutput({ matrix: mat }).boundaryElements).toEqual([1, 2, 3, 6, 9, 8, 7, 4]);
      expect(new StandardOracles.MatrixSpiralTraversalOracle().generateExpectedOutput({ matrix: mat }).spiralOrder).toEqual([1, 2, 3, 6, 9, 8, 7, 4, 5]);
      expect(new StandardOracles.MatrixRotationOracle().generateExpectedOutput({ matrix: mat }).rotatedMatrix).toEqual([
        [7, 4, 1],
        [8, 5, 2],
        [9, 6, 3],
      ]);
    });
  });

  describe("8. SIMULATION Category", () => {
    it("SIMULATION_BANK_ACCOUNT: processes deposits and withdrawals with balance tracking", () => {
      const oracle = new StandardOracles.SimulationBankAccountOracle();
      const output = oracle.generateExpectedOutput({
        initialBalance: 1000,
        transactions: [
          { type: "DEPOSIT", amount: 500 },
          { type: "WITHDRAW", amount: 2000 },
          { type: "WITHDRAW", amount: 300 },
        ],
      });
      expect(output.finalBalance).toBe(1200);
      expect(output.successfulTransactions).toBe(2);
      expect(output.failedTransactions).toBe(1);
    });

    it("SIMULATION_ATM_TRANSACTION: dispenses optimal denomination breakdown", () => {
      const oracle = new StandardOracles.SimulationAtmTransactionOracle();
      const output = oracle.generateExpectedOutput({
        amount: 3800,
        denominations: [2000, 500, 200, 100],
      });
      expect(output.success).toBe(true);
      expect(output.breakdown).toEqual({ "2000": 1, "500": 3, "200": 1, "100": 1 });
      expect(output.totalNotes).toBe(6);
    });

    it("SIMULATION_INVENTORY: tracks stock and calculates total revenue", () => {
      const oracle = new StandardOracles.SimulationInventoryOracle();
      const output = oracle.generateExpectedOutput({
        inventory: { A: { stock: 10, unitPrice: 50 } },
        operations: [
          { type: "PURCHASE", item: "A", quantity: 4 },
          { type: "RESTOCK", item: "A", quantity: 5 },
          { type: "PURCHASE", item: "A", quantity: 20 },
        ],
      });
      expect(output.totalRevenue).toBe(200); // 4 * 50
      expect(output.finalInventory.A.stock).toBe(11); // 10 - 4 + 5 = 11
    });

    it("SIMULATION_BILLING: computes tier discounts and invoice", () => {
      const oracle = new StandardOracles.SimulationBillingOracle();
      const output = oracle.generateExpectedOutput({
        membershipTier: "GOLD",
        items: [{ price: 1000 }, { price: 1000 }],
        taxRate: 10,
      });
      // subtotal 2000 -> 15% discount (300) -> 1700 -> 10% tax (170) -> 1870
      expect(output.subtotal).toBe(2000);
      expect(output.discountAmount).toBe(300);
      expect(output.finalAmount).toBe(1870);
    });

    it("SIMULATION_LIBRARY_FINE / SALARY / ELECTRICITY / TICKET / ORDER", () => {
      expect(new StandardOracles.SimulationLibraryFineOracle().generateExpectedOutput({ daysOverdue: 7, membershipType: "STUDENT" }).finalFine).toBe(16); // (10+10) - 20% = 16
      expect(new StandardOracles.SimulationSalaryOracle().generateExpectedOutput({ hoursWorked: 48, hourlyRate: 50 }).regularPay).toBe(2000);
      expect(new StandardOracles.SimulationElectricityBillOracle().generateExpectedOutput({ unitsConsumed: 150, connectionType: "DOMESTIC" }).totalBill).toBeGreaterThan(0);
      expect(new StandardOracles.SimulationTicketBookingOracle().generateExpectedOutput({ totalSeats: 10, requests: [{ userId: "u1", seats: 6 }, { userId: "u2", seats: 6 }] }).confirmedCount).toBe(1);
      expect(new StandardOracles.SimulationOrderProcessingOracle().generateExpectedOutput({ orders: [{ orderId: "o1", priority: "NORMAL" }, { orderId: "o2", priority: "HIGH" }] }).processingSequence).toEqual(["o2", "o1"]);
    });
  });

  describe("9. DP Category", () => {
    it("DP_COIN_CHANGE / MIN_STEPS / KNAPSACK / CLIMBING_STAIRS / MAX_SUBARRAY", () => {
      expect(new StandardOracles.DpCoinChangeOracle().generateExpectedOutput({ coins: [1, 2, 5], amount: 11 }).minCoins).toBe(3); // 5+5+1
      expect(new StandardOracles.DpMinStepsOracle().generateExpectedOutput({ n: 10 }).minSteps).toBe(3); // 10 -> 9 -> 3 -> 1
      expect(new StandardOracles.DpKnapsackOracle().generateExpectedOutput({ weights: [1, 2, 3], values: [10, 15, 40], capacity: 5 }).maxValue).toBe(55); // 15 + 40
      expect(new StandardOracles.DpClimbingStairsOracle().generateExpectedOutput({ n: 5 }).ways).toBe(8);
      expect(new StandardOracles.DpMaxSubarrayOracle().generateExpectedOutput({ arr: [-2, 1, -3, 4, -1, 2, 1, -5, 4] }).maxSubarraySum).toBe(6);
    });
  });

  describe("10. LOGIC Category", () => {
    it("LOGIC_SCHEDULING / SHIFT_ALLOCATION / SEAT_ALLOCATION / RESOURCE_ALLOCATION / DELIVERY_SCHEDULING", () => {
      const sched = new StandardOracles.LogicSchedulingOracle().generateExpectedOutput({
        intervals: [
          { id: "i1", start: 1, end: 4 },
          { id: "i2", start: 3, end: 5 },
          { id: "i3", start: 0, end: 6 },
          { id: "i4", start: 5, end: 7 },
        ],
      });
      expect(sched.scheduledIds).toEqual(["i1", "i4"]);

      const shifts = new StandardOracles.LogicShiftAllocationOracle().generateExpectedOutput({
        employees: [
          { id: "e1", skill: "ENGINEER", experienceYears: 5 },
          { id: "e2", skill: "SUPPORT", experienceYears: 2 },
        ],
        shifts: [{ shiftId: "s1", requiredSkill: "ENGINEER", capacity: 1 }],
      });
      expect(shifts.shiftAssignments.s1).toEqual(["e1"]);

      const seats = new StandardOracles.LogicSeatAllocationOracle().generateExpectedOutput({
        applicants: [{ id: "a1", meritScore: 90, preferences: ["instA"] }],
        institutions: { instA: 1 },
      });
      expect(seats.allocations.a1).toBe("instA");

      const res = new StandardOracles.LogicResourceAllocationOracle().generateExpectedOutput({
        jobs: [{ jobId: "j1", priority: 10, requiredCpu: 4, requiredMemoryGb: 8 }],
        availableResources: { cpuCores: 8, memoryGb: 16 },
      });
      expect(res.allocatedJobs).toEqual(["j1"]);

      const delivery = new StandardOracles.LogicDeliverySchedulingOracle().generateExpectedOutput({
        startLocation: { x: 0, y: 0 },
        locations: [{ id: "l1", x: 1, y: 1 }, { id: "l2", x: 5, y: 5 }],
      });
      expect(delivery.routeSequence).toEqual(["l1", "l2"]);
    });
  });
});
