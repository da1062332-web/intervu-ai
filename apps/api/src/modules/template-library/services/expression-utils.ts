import * as math from "mathjs";

export const SUPPORTED_MATHJS_FUNCTIONS = new Set(["gcd"]);

export interface ExpressionAnalysis {
  identifiers: string[];
  functionNames: string[];
}

export function analyzeMathjsExpression(expression: string): ExpressionAnalysis {
  try {
    const nodes = math.parse(expression);
    const identifiers = new Set<string>();
    const functionNames = new Set<string>();

    nodes.traverse((node: any, path: any, parent: any) => {
      if (!node) {
        return;
      }

      if (node.isFunctionNode) {
        const fn = node.fn;
        if (fn && fn.isSymbolNode && typeof fn.name === "string") {
          functionNames.add(fn.name);
        } else if (fn && typeof fn.name === "string") {
          functionNames.add(fn.name);
        }
      }

      if (node.isSymbolNode) {
        if (parent && parent.isFunctionNode && parent.fn === node) {
          return;
        }
        identifiers.add(node.name);
      }
    });

    return {
      identifiers: Array.from(identifiers),
      functionNames: Array.from(functionNames),
    };
  } catch {
    return { identifiers: [], functionNames: [] };
  }
}

export function getUnsupportedMathjsFunctions(expression: string): string[] {
  const analysis = analyzeMathjsExpression(expression);
  return analysis.functionNames.filter(
    (name) => !SUPPORTED_MATHJS_FUNCTIONS.has(name),
  );
}
