import { Injectable } from "@nestjs/common";
import { BaseOracle } from "./base.oracle";

/**
 * 62. MATRIX_TRANSPOSE_ORACLE
 */
@Injectable()
export class MatrixTransposeOracle extends BaseOracle {
  readonly key = "MATRIX_TRANSPOSE_ORACLE";
  readonly name = "Matrix Transpose";
  readonly category = "MATRIX";
  readonly description = "Computes the transpose of an M x N matrix.";
  readonly supportedDifficulties = ["MEDIUM"];

  readonly parameterSchema = {
    rows: { type: "integer", min: 1, max: 8, default: 3 },
    cols: { type: "integer", min: 1, max: 8, default: 3 },
    startVal: { type: "integer", min: 1, max: 100, default: 1 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const rows = typeof parameters.rows === "number" ? Math.max(1, Math.min(8, parameters.rows)) : 3;
    const cols = typeof parameters.cols === "number" ? Math.max(1, Math.min(8, parameters.cols)) : 3;
    const startVal = typeof parameters.startVal === "number" ? parameters.startVal : 1;

    const matrix: number[][] = [];
    let count = startVal;
    for (let r = 0; r < rows; r++) {
      const row: number[] = [];
      for (let c = 0; c < cols; c++) {
        row.push(count++);
      }
      matrix.push(row);
    }
    return { matrix, rows, cols };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const matrix = Array.isArray(input.matrix) ? input.matrix : [];
    if (matrix.length === 0 || !Array.isArray(matrix[0])) {
      return { transposedMatrix: [], result: [] };
    }

    const rows = matrix.length;
    const cols = matrix[0].length;
    const transposed: number[][] = [];

    for (let c = 0; c < cols; c++) {
      const newRow: number[] = [];
      for (let r = 0; r < rows; r++) {
        newRow.push(matrix[r][c]);
      }
      transposed.push(newRow);
    }

    return {
      transposedMatrix: transposed,
      result: transposed,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.matrix)) errors.push("Input property 'matrix' must be a 2D array.");
    return errors;
  }
}

/**
 * 63. MATRIX_DIAGONAL_SUM_ORACLE
 */
@Injectable()
export class MatrixDiagonalSumOracle extends BaseOracle {
  readonly key = "MATRIX_DIAGONAL_SUM_ORACLE";
  readonly name = "Matrix Diagonal Sum";
  readonly category = "MATRIX";
  readonly description = "Calculates the sum of primary and secondary diagonals of a square matrix.";
  readonly supportedDifficulties = ["MEDIUM"];

  readonly parameterSchema = {
    size: { type: "integer", min: 1, max: 8, default: 3 },
    startVal: { type: "integer", min: 1, max: 100, default: 1 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const size = typeof parameters.size === "number" ? Math.max(1, Math.min(8, parameters.size)) : 3;
    const startVal = typeof parameters.startVal === "number" ? parameters.startVal : 1;

    const matrix: number[][] = [];
    let count = startVal;
    for (let r = 0; r < size; r++) {
      const row: number[] = [];
      for (let c = 0; c < size; c++) {
        row.push(count++);
      }
      matrix.push(row);
    }
    return { matrix, size };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const matrix = Array.isArray(input.matrix) ? input.matrix : [];
    const n = matrix.length;

    let primarySum = 0;
    let secondarySum = 0;

    for (let i = 0; i < n; i++) {
      if (Array.isArray(matrix[i])) {
        primarySum += matrix[i][i] || 0;
        secondarySum += matrix[i][n - 1 - i] || 0;
      }
    }

    const totalDiagonalSum = primarySum + secondarySum;

    return {
      primarySum,
      secondarySum,
      totalDiagonalSum,
      result: totalDiagonalSum,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.matrix)) errors.push("Input property 'matrix' must be an array.");
    return errors;
  }
}

/**
 * 64. MATRIX_ROW_SUM_ORACLE
 */
@Injectable()
export class MatrixRowSumOracle extends BaseOracle {
  readonly key = "MATRIX_ROW_SUM_ORACLE";
  readonly name = "Matrix Row Sum";
  readonly category = "MATRIX";
  readonly description = "Calculates the sum of each row in a matrix.";
  readonly supportedDifficulties = ["MEDIUM"];

  readonly parameterSchema = {
    rows: { type: "integer", min: 1, max: 8, default: 3 },
    cols: { type: "integer", min: 1, max: 8, default: 3 },
    startVal: { type: "integer", min: 1, max: 100, default: 1 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const rows = typeof parameters.rows === "number" ? Math.max(1, Math.min(8, parameters.rows)) : 3;
    const cols = typeof parameters.cols === "number" ? Math.max(1, Math.min(8, parameters.cols)) : 3;
    const startVal = typeof parameters.startVal === "number" ? parameters.startVal : 1;

    const matrix: number[][] = [];
    let count = startVal;
    for (let r = 0; r < rows; r++) {
      const row: number[] = [];
      for (let c = 0; c < cols; c++) {
        row.push(count++);
      }
      matrix.push(row);
    }
    return { matrix };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const matrix = Array.isArray(input.matrix) ? input.matrix : [];
    const rowSums: number[] = [];

    for (const row of matrix) {
      if (Array.isArray(row)) {
        const sum = row.reduce((acc, curr) => acc + (typeof curr === "number" ? curr : 0), 0);
        rowSums.push(sum);
      }
    }

    return {
      rowSums,
      result: rowSums,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.matrix)) errors.push("Input property 'matrix' must be an array.");
    return errors;
  }
}

/**
 * 65. MATRIX_COLUMN_SUM_ORACLE
 */
@Injectable()
export class MatrixColumnSumOracle extends BaseOracle {
  readonly key = "MATRIX_COLUMN_SUM_ORACLE";
  readonly name = "Matrix Column Sum";
  readonly category = "MATRIX";
  readonly description = "Calculates the sum of each column in a matrix.";
  readonly supportedDifficulties = ["MEDIUM"];

  readonly parameterSchema = {
    rows: { type: "integer", min: 1, max: 8, default: 3 },
    cols: { type: "integer", min: 1, max: 8, default: 3 },
    startVal: { type: "integer", min: 1, max: 100, default: 1 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const rows = typeof parameters.rows === "number" ? Math.max(1, Math.min(8, parameters.rows)) : 3;
    const cols = typeof parameters.cols === "number" ? Math.max(1, Math.min(8, parameters.cols)) : 3;
    const startVal = typeof parameters.startVal === "number" ? parameters.startVal : 1;

    const matrix: number[][] = [];
    let count = startVal;
    for (let r = 0; r < rows; r++) {
      const row: number[] = [];
      for (let c = 0; c < cols; c++) {
        row.push(count++);
      }
      matrix.push(row);
    }
    return { matrix };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const matrix = Array.isArray(input.matrix) ? input.matrix : [];
    if (matrix.length === 0 || !Array.isArray(matrix[0])) {
      return { columnSums: [], result: [] };
    }

    const rows = matrix.length;
    const cols = matrix[0].length;
    const columnSums: number[] = [];

    for (let c = 0; c < cols; c++) {
      let sum = 0;
      for (let r = 0; r < rows; r++) {
        sum += typeof matrix[r][c] === "number" ? matrix[r][c] : 0;
      }
      columnSums.push(sum);
    }

    return {
      columnSums,
      result: columnSums,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.matrix)) errors.push("Input property 'matrix' must be an array.");
    return errors;
  }
}

/**
 * 66. MATRIX_SEARCH_ORACLE
 */
@Injectable()
export class MatrixSearchOracle extends BaseOracle {
  readonly key = "MATRIX_SEARCH_ORACLE";
  readonly name = "Matrix Search";
  readonly category = "MATRIX";
  readonly description = "Searches for a target value in a 2D matrix, returning [row, col] or [-1, -1].";
  readonly supportedDifficulties = ["MEDIUM"];

  readonly parameterSchema = {
    rows: { type: "integer", min: 1, max: 8, default: 3 },
    cols: { type: "integer", min: 1, max: 8, default: 3 },
    target: { type: "integer", min: 1, max: 50, default: 5 },
    startVal: { type: "integer", min: 1, max: 100, default: 1 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const rows = typeof parameters.rows === "number" ? Math.max(1, Math.min(8, parameters.rows)) : 3;
    const cols = typeof parameters.cols === "number" ? Math.max(1, Math.min(8, parameters.cols)) : 3;
    const target = typeof parameters.target === "number" ? parameters.target : 5;
    const startVal = typeof parameters.startVal === "number" ? parameters.startVal : 1;

    const matrix: number[][] = [];
    let count = startVal;
    for (let r = 0; r < rows; r++) {
      const row: number[] = [];
      for (let c = 0; c < cols; c++) {
        row.push(count++);
      }
      matrix.push(row);
    }
    return { matrix, target };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const matrix = Array.isArray(input.matrix) ? input.matrix : [];
    const target = input.target;

    let position = [-1, -1];
    for (let r = 0; r < matrix.length; r++) {
      if (Array.isArray(matrix[r])) {
        for (let c = 0; c < matrix[r].length; c++) {
          if (matrix[r][c] === target) {
            position = [r, c];
            break;
          }
        }
      }
      if (position[0] !== -1) break;
    }

    return {
      found: position[0] !== -1,
      row: position[0],
      col: position[1],
      position,
      result: position,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.matrix)) errors.push("Input property 'matrix' must be an array.");
    return errors;
  }
}

/**
 * 67. MATRIX_BOUNDARY_TRAVERSAL_ORACLE
 */
@Injectable()
export class MatrixBoundaryTraversalOracle extends BaseOracle {
  readonly key = "MATRIX_BOUNDARY_TRAVERSAL_ORACLE";
  readonly name = "Matrix Boundary Traversal";
  readonly category = "MATRIX";
  readonly description = "Traverses the outer boundary elements of a matrix in clockwise order.";
  readonly supportedDifficulties = ["MEDIUM"];

  readonly parameterSchema = {
    rows: { type: "integer", min: 1, max: 8, default: 3 },
    cols: { type: "integer", min: 1, max: 8, default: 3 },
    startVal: { type: "integer", min: 1, max: 100, default: 1 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const rows = typeof parameters.rows === "number" ? Math.max(1, Math.min(8, parameters.rows)) : 3;
    const cols = typeof parameters.cols === "number" ? Math.max(1, Math.min(8, parameters.cols)) : 3;
    const startVal = typeof parameters.startVal === "number" ? parameters.startVal : 1;

    const matrix: number[][] = [];
    let count = startVal;
    for (let r = 0; r < rows; r++) {
      const row: number[] = [];
      for (let c = 0; c < cols; c++) {
        row.push(count++);
      }
      matrix.push(row);
    }
    return { matrix };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const matrix = Array.isArray(input.matrix) ? input.matrix : [];
    if (matrix.length === 0 || !Array.isArray(matrix[0])) {
      return { boundaryElements: [], result: [] };
    }

    const rows = matrix.length;
    const cols = matrix[0].length;
    const boundary: number[] = [];

    if (rows === 1) {
      for (let c = 0; c < cols; c++) boundary.push(matrix[0][c]);
    } else if (cols === 1) {
      for (let r = 0; r < rows; r++) boundary.push(matrix[r][0]);
    } else {
      for (let c = 0; c < cols; c++) boundary.push(matrix[0][c]);
      for (let r = 1; r < rows; r++) boundary.push(matrix[r][cols - 1]);
      for (let c = cols - 2; c >= 0; c--) boundary.push(matrix[rows - 1][c]);
      for (let r = rows - 2; r >= 1; r--) boundary.push(matrix[r][0]);
    }

    return {
      boundaryElements: boundary,
      result: boundary,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.matrix)) errors.push("Input property 'matrix' must be an array.");
    return errors;
  }
}

/**
 * 68. MATRIX_SPIRAL_TRAVERSAL_ORACLE
 */
@Injectable()
export class MatrixSpiralTraversalOracle extends BaseOracle {
  readonly key = "MATRIX_SPIRAL_TRAVERSAL_ORACLE";
  readonly name = "Matrix Spiral Traversal";
  readonly category = "MATRIX";
  readonly description = "Traverses all elements of a matrix in clockwise spiral order.";
  readonly supportedDifficulties = ["MEDIUM"];

  readonly parameterSchema = {
    rows: { type: "integer", min: 1, max: 6, default: 3 },
    cols: { type: "integer", min: 1, max: 6, default: 3 },
    startVal: { type: "integer", min: 1, max: 100, default: 1 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const rows = typeof parameters.rows === "number" ? Math.max(1, Math.min(6, parameters.rows)) : 3;
    const cols = typeof parameters.cols === "number" ? Math.max(1, Math.min(6, parameters.cols)) : 3;
    const startVal = typeof parameters.startVal === "number" ? parameters.startVal : 1;

    const matrix: number[][] = [];
    let count = startVal;
    for (let r = 0; r < rows; r++) {
      const row: number[] = [];
      for (let c = 0; c < cols; c++) {
        row.push(count++);
      }
      matrix.push(row);
    }
    return { matrix };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const matrix = Array.isArray(input.matrix) ? input.matrix : [];
    if (matrix.length === 0 || !Array.isArray(matrix[0])) {
      return { spiralOrder: [], result: [] };
    }

    let top = 0;
    let bottom = matrix.length - 1;
    let left = 0;
    let right = matrix[0].length - 1;
    const spiral: number[] = [];

    while (top <= bottom && left <= right) {
      for (let c = left; c <= right; c++) spiral.push(matrix[top][c]);
      top++;

      for (let r = top; r <= bottom; r++) spiral.push(matrix[r][right]);
      right--;

      if (top <= bottom) {
        for (let c = right; c >= left; c--) spiral.push(matrix[bottom][c]);
        bottom--;
      }

      if (left <= right) {
        for (let r = bottom; r >= top; r--) spiral.push(matrix[r][left]);
        left++;
      }
    }

    return {
      spiralOrder: spiral,
      result: spiral,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.matrix)) errors.push("Input property 'matrix' must be an array.");
    return errors;
  }
}

/**
 * 69. MATRIX_ROTATION_ORACLE
 */
@Injectable()
export class MatrixRotationOracle extends BaseOracle {
  readonly key = "MATRIX_ROTATION_ORACLE";
  readonly name = "Rotate Matrix 90 Degrees Clockwise";
  readonly category = "MATRIX";
  readonly description = "Rotates an N x N square matrix 90 degrees clockwise.";
  readonly supportedDifficulties = ["MEDIUM"];

  readonly parameterSchema = {
    size: { type: "integer", min: 1, max: 6, default: 3 },
    startVal: { type: "integer", min: 1, max: 100, default: 1 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const size = typeof parameters.size === "number" ? Math.max(1, Math.min(6, parameters.size)) : 3;
    const startVal = typeof parameters.startVal === "number" ? parameters.startVal : 1;

    const matrix: number[][] = [];
    let count = startVal;
    for (let r = 0; r < size; r++) {
      const row: number[] = [];
      for (let c = 0; c < size; c++) {
        row.push(count++);
      }
      matrix.push(row);
    }
    return { matrix, size };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const matrix = Array.isArray(input.matrix) ? input.matrix : [];
    const n = matrix.length;
    if (n === 0) return { rotatedMatrix: [], result: [] };

    const rotated: number[][] = [];
    for (let c = 0; c < n; c++) {
      const newRow: number[] = [];
      for (let r = n - 1; r >= 0; r--) {
        newRow.push(matrix[r][c]);
      }
      rotated.push(newRow);
    }

    return {
      rotatedMatrix: rotated,
      result: rotated,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.matrix)) errors.push("Input property 'matrix' must be an array.");
    return errors;
  }
}
