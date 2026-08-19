import { Injectable } from "@nestjs/common";
import { BaseOracle } from "./base.oracle";

/**
 * 84. LOGIC_SCHEDULING_ORACLE
 */
@Injectable()
export class LogicSchedulingOracle extends BaseOracle {
  readonly key = "LOGIC_SCHEDULING_ORACLE";
  readonly name = "Interval Scheduling Optimization";
  readonly category = "GENERAL";
  readonly description = "Selects maximum number of mutually non-overlapping intervals (earliest finish time greedy).";
  readonly supportedDifficulties = ["HARD"];

  readonly parameterSchema = {
    intervalCount: { type: "integer", min: 3, max: 12, default: 6 },
    startOffset: { type: "integer", min: 1, max: 20, default: 1 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const count = typeof parameters.intervalCount === "number" ? Math.max(2, Math.min(12, parameters.intervalCount)) : 6;
    const offset = typeof parameters.startOffset === "number" ? parameters.startOffset : 1;

    const intervals = [];
    for (let i = 0; i < count; i++) {
      const start = (offset + i * 2 + 1) % 15;
      const duration = (i % 3) + 2;
      intervals.push({
        id: `INT_${i + 1}`,
        start,
        end: start + duration,
      });
    }
    return { intervals };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const intervals = Array.isArray(input.intervals) ? [...input.intervals] : [];

    // Sort by earliest finish time; tie-break by ID
    intervals.sort((a, b) => {
      if (a.end !== b.end) return a.end - b.end;
      return a.id.localeCompare(b.id);
    });

    const selected: Array<{ id: string; start: number; end: number }> = [];
    let lastEnd = -Infinity;

    for (const item of intervals) {
      if (typeof item.start === "number" && typeof item.end === "number" && item.start >= lastEnd) {
        selected.push(item);
        lastEnd = item.end;
      }
    }

    const selectedIds = selected.map((s) => s.id);

    return {
      totalIntervals: intervals.length,
      maxScheduledCount: selected.length,
      scheduledIntervals: selected,
      scheduledIds: selectedIds,
      result: selectedIds,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.intervals)) errors.push("Input property 'intervals' must be an array.");
    return errors;
  }
}

/**
 * 85. LOGIC_SHIFT_ALLOCATION_ORACLE
 */
@Injectable()
export class LogicShiftAllocationOracle extends BaseOracle {
  readonly key = "LOGIC_SHIFT_ALLOCATION_ORACLE";
  readonly name = "Employee Shift Allocation";
  readonly category = "GENERAL";
  readonly description = "Allocates employees to shifts deterministically based on skill match and employee ID.";
  readonly supportedDifficulties = ["HARD"];

  readonly parameterSchema = {
    employeeCount: { type: "integer", min: 3, max: 10, default: 5 },
    startId: { type: "integer", min: 100, max: 500, default: 100 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const count = typeof parameters.employeeCount === "number" ? Math.max(2, Math.min(10, parameters.employeeCount)) : 5;
    const startId = typeof parameters.startId === "number" ? parameters.startId : 100;

    const employees = [];
    for (let i = 0; i < count; i++) {
      employees.push({
        id: `EMP_${startId + i}`,
        skill: i % 2 === 0 ? "ENGINEER" : "SUPPORT",
        experienceYears: i + 1,
      });
    }

    const shifts = [
      { shiftId: "SHIFT_MORNING", requiredSkill: "ENGINEER", capacity: 2 },
      { shiftId: "SHIFT_EVENING", requiredSkill: "SUPPORT", capacity: 2 },
    ];

    return { employees, shifts };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const employees = Array.isArray(input.employees) ? [...input.employees] : [];
    const shifts = Array.isArray(input.shifts) ? input.shifts : [];

    // Sort employees by experienceYears desc, then by id asc for deterministic assignment
    employees.sort((a, b) => {
      if (b.experienceYears !== a.experienceYears) return b.experienceYears - a.experienceYears;
      return a.id.localeCompare(b.id);
    });

    const shiftAssignments: Record<string, string[]> = {};
    for (const sh of shifts) {
      shiftAssignments[sh.shiftId] = [];
    }

    const assignedEmployeeIds = new Set<string>();

    for (const sh of shifts) {
      const neededSkill = sh.requiredSkill;
      const cap = typeof sh.capacity === "number" ? sh.capacity : 1;

      for (const emp of employees) {
        if (
          !assignedEmployeeIds.has(emp.id) &&
          emp.skill === neededSkill &&
          shiftAssignments[sh.shiftId].length < cap
        ) {
          shiftAssignments[sh.shiftId].push(emp.id);
          assignedEmployeeIds.add(emp.id);
        }
      }
    }

    return {
      shiftAssignments,
      totalAssigned: assignedEmployeeIds.size,
      unassignedCount: employees.length - assignedEmployeeIds.size,
      result: shiftAssignments,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.employees)) errors.push("Input property 'employees' must be an array.");
    if (!Array.isArray(input.shifts)) errors.push("Input property 'shifts' must be an array.");
    return errors;
  }
}

/**
 * 86. LOGIC_SEAT_ALLOCATION_ORACLE
 */
@Injectable()
export class LogicSeatAllocationOracle extends BaseOracle {
  readonly key = "LOGIC_SEAT_ALLOCATION_ORACLE";
  readonly name = "College Merit Seat Allocation";
  readonly category = "GENERAL";
  readonly description = "Allocates applicant seats to institutions based on merit rank and choice preferences.";
  readonly supportedDifficulties = ["HARD"];

  readonly parameterSchema = {
    applicantCount: { type: "integer", min: 3, max: 10, default: 5 },
    baseScore: { type: "integer", min: 50, max: 100, default: 95 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const count = typeof parameters.applicantCount === "number" ? Math.max(2, Math.min(10, parameters.applicantCount)) : 5;
    const baseScore = typeof parameters.baseScore === "number" ? parameters.baseScore : 95;

    const applicants = [];
    for (let i = 0; i < count; i++) {
      applicants.push({
        id: `APP_${i + 1}`,
        meritScore: Math.max(1, baseScore - (i * 6)),
        preferences: ["INST_A", "INST_B", "INST_C"],
      });
    }

    const institutions: Record<string, number> = {
      INST_A: 2,
      INST_B: 2,
      INST_C: 2,
    };

    return { applicants, institutions };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const applicants = Array.isArray(input.applicants) ? [...input.applicants] : [];
    const capacity: Record<string, number> = input.institutions && typeof input.institutions === "object"
      ? { ...input.institutions }
      : {};

    // Sort applicants by meritScore descending, then by id ascending
    applicants.sort((a, b) => {
      if (b.meritScore !== a.meritScore) return b.meritScore - a.meritScore;
      return a.id.localeCompare(b.id);
    });

    const allocations: Record<string, string | null> = {};

    for (const app of applicants) {
      allocations[app.id] = null;
      const prefs = Array.isArray(app.preferences) ? app.preferences : [];

      for (const pref of prefs) {
        if (capacity[pref] && capacity[pref] > 0) {
          allocations[app.id] = pref;
          capacity[pref]--;
          break;
        }
      }
    }

    return {
      allocations,
      remainingCapacity: capacity,
      result: allocations,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.applicants)) errors.push("Input property 'applicants' must be an array.");
    if (!input.institutions || typeof input.institutions !== "object") {
      errors.push("Input property 'institutions' must be an object.");
    }
    return errors;
  }
}

/**
 * 87. LOGIC_RESOURCE_ALLOCATION_ORACLE
 */
@Injectable()
export class LogicResourceAllocationOracle extends BaseOracle {
  readonly key = "LOGIC_RESOURCE_ALLOCATION_ORACLE";
  readonly name = "Cloud Server Resource Allocation";
  readonly category = "GENERAL";
  readonly description = "Allocates finite server CPU and Memory to prioritized job requests.";
  readonly supportedDifficulties = ["HARD"];

  readonly parameterSchema = {
    jobCount: { type: "integer", min: 3, max: 10, default: 4 },
    startJobId: { type: "integer", min: 1, max: 100, default: 1 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const count = typeof parameters.jobCount === "number" ? Math.max(2, Math.min(10, parameters.jobCount)) : 4;
    const start = typeof parameters.startJobId === "number" ? parameters.startJobId : 1;

    const jobs = [];
    for (let i = 0; i < count; i++) {
      jobs.push({
        jobId: `JOB_${start + i}`,
        priority: 10 - i, // Higher number = higher priority
        requiredCpu: (i % 2) + 2,
        requiredMemoryGb: (i % 3) + 4,
      });
    }

    const availableResources = {
      cpuCores: 8,
      memoryGb: 16,
    };

    return { jobs, availableResources };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const jobs = Array.isArray(input.jobs) ? [...input.jobs] : [];
    let cpu = typeof input.availableResources?.cpuCores === "number" ? input.availableResources.cpuCores : 0;
    let mem = typeof input.availableResources?.memoryGb === "number" ? input.availableResources.memoryGb : 0;

    // Sort by priority desc, then jobId asc
    jobs.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.jobId.localeCompare(b.jobId);
    });

    const allocatedJobIds: string[] = [];
    const rejectedJobIds: string[] = [];

    for (const job of jobs) {
      const reqCpu = typeof job.requiredCpu === "number" ? job.requiredCpu : 0;
      const reqMem = typeof job.requiredMemoryGb === "number" ? job.requiredMemoryGb : 0;

      if (cpu >= reqCpu && mem >= reqMem) {
        cpu -= reqCpu;
        mem -= reqMem;
        allocatedJobIds.push(job.jobId);
      } else {
        rejectedJobIds.push(job.jobId);
      }
    }

    return {
      allocatedJobs: allocatedJobIds,
      rejectedJobs: rejectedJobIds,
      remainingCpu: cpu,
      remainingMemoryGb: mem,
      result: allocatedJobIds,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.jobs)) errors.push("Input property 'jobs' must be an array.");
    if (!input.availableResources || typeof input.availableResources !== "object") {
      errors.push("Input property 'availableResources' must be an object.");
    }
    return errors;
  }
}

/**
 * 88. LOGIC_DELIVERY_SCHEDULING_ORACLE
 */
@Injectable()
export class LogicDeliverySchedulingOracle extends BaseOracle {
  readonly key = "LOGIC_DELIVERY_SCHEDULING_ORACLE";
  readonly name = "Nearest Neighbor Delivery Routing";
  readonly category = "GENERAL";
  readonly description = "Determines optimal delivery package route using deterministic nearest-neighbor ordering.";
  readonly supportedDifficulties = ["HARD"];

  readonly parameterSchema = {
    deliveryCount: { type: "integer", min: 3, max: 10, default: 4 },
    coordOffset: { type: "integer", min: 1, max: 20, default: 1 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const count = typeof parameters.deliveryCount === "number" ? Math.max(2, Math.min(10, parameters.deliveryCount)) : 4;
    const offset = typeof parameters.coordOffset === "number" ? parameters.coordOffset : 1;

    const startLocation = { x: 0, y: 0 };
    const locations = [];
    for (let i = 0; i < count; i++) {
      locations.push({
        id: `LOC_${i + 1}`,
        x: (offset + i * 3 + 2) % 10 + 1,
        y: (offset + i * 4 + 1) % 10 + 1,
      });
    }

    return { startLocation, locations };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const start = input.startLocation || { x: 0, y: 0 };
    const unvisited = Array.isArray(input.locations) ? [...input.locations] : [];

    let current = { ...start };
    const route: Array<{ id: string; x: number; y: number; distance: number }> = [];
    let totalDistance = 0;

    const dist = (p1: { x: number; y: number }, p2: { x: number; y: number }) =>
      Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y); // Manhattan distance

    while (unvisited.length > 0) {
      let nearestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const d = dist(current, unvisited[i]);
        if (d < minDistance) {
          minDistance = d;
          nearestIdx = i;
        } else if (d === minDistance) {
          // Deterministic tie breaker by ID
          if (unvisited[i].id < unvisited[nearestIdx].id) {
            nearestIdx = i;
          }
        }
      }

      const nextLoc = unvisited.splice(nearestIdx, 1)[0];
      totalDistance += minDistance;
      route.push({ ...nextLoc, distance: minDistance });
      current = { x: nextLoc.x, y: nextLoc.y };
    }

    const routeSequence = route.map((r) => r.id);

    return {
      totalStops: route.length,
      totalDistance,
      routeSequence,
      route,
      result: routeSequence,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!input.startLocation || typeof input.startLocation !== "object") {
      errors.push("Input property 'startLocation' must be an object.");
    }
    if (!Array.isArray(input.locations)) {
      errors.push("Input property 'locations' must be an array.");
    }
    return errors;
  }
}
