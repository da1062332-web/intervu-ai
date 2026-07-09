import { Injectable, BadRequestException } from "@nestjs/common";

interface Relation {
  from: string;
  to: string;
  type: string;
}

interface LogicalGraph {
  entities: string[];
  relations: Relation[];
}

@Injectable()
export class EntityGeneratorService {
  private readonly defaultNames = [
    "Rohan",
    "Amit",
    "Neha",
    "Priya",
    "Rahul",
    "Anjali",
    "Vikram",
    "Kiran",
  ];

  private readonly defaultRelations = ["father", "mother", "brother", "sister", "wife", "husband"];

  /**
   * Generates a cycle-free directed relationship graph using template rules.
   */
  generateGraph(template: { hybridConfig?: any }): LogicalGraph {
    const config = template.hybridConfig || {};
    const namePool = config.entitySchema?.names || this.defaultNames;
    const relationPool = config.relationSchema?.relations || this.defaultRelations;

    // Pick 3-5 random entities depending on complexity
    const entityCount = Math.floor(Math.random() * 3) + 3; // 3 to 5
    const entities: string[] = [];
    const shuffled = [...namePool].sort(() => 0.5 - Math.random());
    for (let i = 0; i < Math.min(entityCount, shuffled.length); i++) {
      entities.push(shuffled[i]);
    }

    const relations: Relation[] = [];
    const adjList = new Map<string, string[]>();

    // Connect entities sequentially to guarantee connectedness without cycle issues
    for (let i = 0; i < entities.length - 1; i++) {
      const from = entities[i];
      const to = entities[i + 1];
      const type = relationPool[Math.floor(Math.random() * relationPool.length)];

      relations.push({ from, to, type });

      if (!adjList.has(from)) adjList.set(from, []);
      adjList.get(from)!.push(to);
    }

    // Add 1 extra relation for complexity if possible
    if (entities.length > 3) {
      let attempts = 0;
      while (attempts < 10) {
        attempts++;
        const from = entities[Math.floor(Math.random() * entities.length)];
        const to = entities[Math.floor(Math.random() * entities.length)];

        if (from === to) continue;
        
        // Check if relation already exists
        const exists = relations.some(
          (r) => (r.from === from && r.to === to) || (r.from === to && r.to === from),
        );
        if (exists) continue;

        const type = relationPool[Math.floor(Math.random() * relationPool.length)];

        // Test cycle
        const tempAdj = new Map<string, string[]>();
        for (const [k, v] of adjList.entries()) {
          tempAdj.set(k, [...v]);
        }
        if (!tempAdj.has(from)) tempAdj.set(from, []);
        tempAdj.get(from)!.push(to);

        if (!this.hasCycle(tempAdj)) {
          relations.push({ from, to, type });
          adjList.clear();
          for (const [k, v] of tempAdj.entries()) {
            adjList.set(k, v);
          }
          break;
        }
      }
    }

    return {
      entities,
      relations,
    };
  }

  /**
   * Directed cycle detection using DFS
   */
  private hasCycle(adjList: Map<string, string[]>): boolean {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (node: string): boolean => {
      visited.add(node);
      recStack.add(node);

      const neighbors = adjList.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        } else if (recStack.has(neighbor)) {
          return true;
        }
      }

      recStack.delete(node);
      return false;
    };

    for (const node of adjList.keys()) {
      if (!visited.has(node)) {
        if (dfs(node)) return true;
      }
    }

    return false;
  }
}
