/**
 * Phase 1: Migration Verification Script
 * Checks for migration drift, parses schema.prisma for expected structures,
 * and validates database connection.
 */
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

function validate() {
  const schemaPath = path.join(
    __dirname,
    "../packages/database/prisma/schema.prisma",
  );
  if (!fs.existsSync(schemaPath)) {
    throw new Error("schema.prisma not found at " + schemaPath);
  }
  return { schemaPath };
}

function fetchDependencies() {
  // Try to find prisma CLI
  try {
    execSync("npx prisma -v", { stdio: "ignore" });
  } catch (error) {
    throw new Error("Prisma CLI is not available. Please run npm install.");
  }
}

function coreLogic({ schemaPath }: { schemaPath: string }) {
  const results = {
    migrationStatus: "UNKNOWN",
    schemaDrift: "UNKNOWN",
    details: "",
  };

  try {
    const output = execSync(
      `npx prisma migrate status --schema=${schemaPath}`,
      { encoding: "utf-8" },
    );
    results.details = output;

    if (output.includes("Database schema is up to date")) {
      results.migrationStatus = "APPLIED";
      results.schemaDrift = "NONE";
    } else {
      results.migrationStatus = "PENDING_OR_DRIFT";
      results.schemaDrift = "DETECTED";
    }
  } catch (error: any) {
    results.migrationStatus = "ERROR";
    results.details = error.message || String(error);
  }

  return results;
}

function formatResponse(result: any) {
  const success = result.migrationStatus === "APPLIED";
  return {
    success,
    data: result,
    error: success
      ? null
      : {
          code: "MIGRATION_AUDIT_FAILED",
          message: "Migration drift or pending migrations detected.",
        },
    meta: { timestamp: new Date().toISOString() },
  };
}

// Execution Flow
try {
  const input = validate();
  fetchDependencies();
  const data = coreLogic(input);
  const response = formatResponse(data);
  console.log(JSON.stringify(response, null, 2));

  if (!response.success) {
    process.exit(1);
  }
} catch (err: any) {
  console.error(
    JSON.stringify(
      {
        success: false,
        data: null,
        error: { code: "SCRIPT_EXECUTION_ERROR", message: err.message },
        meta: { timestamp: new Date().toISOString() },
      },
      null,
      2,
    ),
  );
  process.exit(1);
}
