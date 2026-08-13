export interface CycleDetectionResult {
  hasCycle: boolean;
  cycle?: string[];
}

/**
 * Extracts unique word tokens from the expression that match derived variable names,
 * indicating a dependency relationship.
 */
export function extractReferencedVariables(expression: string, derivedNames: string[]): string[] {
  if (!expression) return [];
  const words = expression.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
  return Array.from(new Set(words)).filter((word) => derivedNames.includes(word));
}

/**
 * Detects circular dependencies within a list of derived variables using Depth First Search (DFS).
 */
export function detectCircularDependencies(
  derivedVariables: { name: string; expression: string }[]
): CycleDetectionResult {
  const derivedNames = derivedVariables.map((v) => v.name);

  // Build adjacency list (directed graph) where name -> list of referenced derived variables
  const graph = new Map<string, string[]>();
  for (const v of derivedVariables) {
    const refs = extractReferencedVariables(v.expression, derivedNames);
    graph.set(v.name, refs);
  }

  const visited = new Set<string>();
  const recStack = new Set<string>();
  const path: string[] = [];

  function dfs(node: string): string[] | null {
    visited.add(node);
    recStack.add(node);
    path.push(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        const cyclePath = dfs(neighbor);
        if (cyclePath) return cyclePath;
      } else if (recStack.has(neighbor)) {
        // Cycle detected! Collect the cycle path starting from the neighbor
        const cycleStartIndex = path.indexOf(neighbor);
        return [...path.slice(cycleStartIndex), neighbor];
      }
    }

    recStack.delete(node);
    path.pop();
    return null;
  }

  // Run DFS for each node to cover all component subgraphs
  for (const name of derivedNames) {
    if (!visited.has(name)) {
      const cyclePath = dfs(name);
      if (cyclePath) {
        return {
          hasCycle: true,
          cycle: cyclePath,
        };
      }
    }
  }

  return { hasCycle: false };
}
