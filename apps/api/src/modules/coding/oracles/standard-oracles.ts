/**
 * Standard Oracles Registry Barrel Export.
 * Exports all 95 active TCS Advanced Coding Catalog Oracles.
 */

// 1. BASIC (6 Oracles including BasicGradeCalculatorOracle)
export { BasicGradeCalculatorOracle } from "./basic-grade-calculator.oracle";
export {
  BasicEligibilityCheckOracle,
  BasicDiscountCalculatorOracle,
  BasicBillCalculatorOracle,
  BasicSalaryCalculatorOracle,
  BasicTaxCalculatorOracle,
} from "./basic.oracles";

// 2. STRING (14 Oracles)
export {
  StringPalindromeOracle,
  StringReverseOracle,
  StringCaseConversionOracle,
  StringVowelCountOracle,
  StringCharacterCountOracle,
  StringFrequencyOracle,
  StringSubstringCountOracle,
  StringAnagramOracle,
  StringWordCountOracle,
  StringLargestWordOracle,
  StringRemoveSpacesOracle,
  StringFirstNonRepeatingOracle,
  StringRemoveDuplicatesOracle,
  StringWordFrequencyOracle,
} from "./string.oracles";

// 3. ARRAY (16 Oracles)
export {
  ArraySumOracle,
  ArrayMaxOracle,
  ArrayMinOracle,
  ArrayReverseOracle,
  ArrayCountEvenOracle,
  ArrayFrequencyOracle,
  ArraySecondLargestOracle,
  ArrayRotationOracle,
  ArrayLeftRotationOracle,
  ArrayRemoveDuplicatesOracle,
  ArrayMoveZerosOracle,
  ArrayLinearSearchOracle,
  ArrayBinarySearchOracle,
  ArrayMissingNumberOracle,
  ArrayDuplicateNumberOracle,
  ArrayCommonElementsOracle,
} from "./array.oracles";

// 4. MATH (12 Oracles)
export {
  MathPrimeCheckOracle,
  MathGcdOracle,
  MathLcmOracle,
  MathDigitSumOracle,
  MathDigitCountOracle,
  MathNumberReverseOracle,
  MathDigitProductOracle,
  MathArmstrongOracle,
  MathPerfectNumberOracle,
  MathNumberPalindromeOracle,
  MathDigitFrequencyOracle,
  MathFactorialOracle,
} from "./math.oracles";

// 5. RECURSION (6 Oracles)
export {
  RecursionFactorialOracle,
  RecursionFibonacciOracle,
  RecursionPowerOracle,
  RecursionSumNOracle,
  RecursionDigitSumOracle,
  RecursionDigitCountOracle,
} from "./recursion.oracles";

// 6. SORT (8 Oracles)
export {
  SortBubbleSortOracle,
  SortSelectionSortOracle,
  SortInsertionSortOracle,
  SortMergeSortedArraysOracle,
  SortCheckSortedOracle,
  SortCustomOrderOracle,
  SortByFrequencyOracle,
  SortEvenOddOracle,
} from "./sort.oracles";

// 7. MATRIX (8 Oracles)
export {
  MatrixTransposeOracle,
  MatrixDiagonalSumOracle,
  MatrixRowSumOracle,
  MatrixColumnSumOracle,
  MatrixSearchOracle,
  MatrixBoundaryTraversalOracle,
  MatrixSpiralTraversalOracle,
  MatrixRotationOracle,
} from "./matrix.oracles";

// 8. SIMULATION (9 Oracles)
export {
  SimulationBankAccountOracle,
  SimulationAtmTransactionOracle,
  SimulationInventoryOracle,
  SimulationBillingOracle,
  SimulationLibraryFineOracle,
  SimulationSalaryOracle,
  SimulationElectricityBillOracle,
  SimulationTicketBookingOracle,
  SimulationOrderProcessingOracle,
} from "./simulation.oracles";

// 9. DP (5 Oracles)
export {
  DpCoinChangeOracle,
  DpMinStepsOracle,
  DpKnapsackOracle,
  DpClimbingStairsOracle,
  DpMaxSubarrayOracle,
} from "./dp.oracles";

// 10. LOGIC (5 Oracles)
export {
  LogicSchedulingOracle,
  LogicShiftAllocationOracle,
  LogicSeatAllocationOracle,
  LogicResourceAllocationOracle,
  LogicDeliverySchedulingOracle,
} from "./logic.oracles";

// 11. LOOP (6 Oracles)
export {
  LoopStarPatternOracle,
  LoopNumberPatternOracle,
  LoopPyramidPatternOracle,
  LoopInvertedPatternOracle,
  LoopMultiplicationTableOracle,
  LoopRangeSumOracle,
} from "./loop.oracles";
