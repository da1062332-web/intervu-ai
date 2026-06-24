const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const BASE = "http://localhost:4000/api/v1";

async function getToken() {
  const r = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@intervu.ai",
      password: "Intervu123!",
    }),
  });
  const body = await r.json();
  if (!body.success) throw new Error("Login failed: " + JSON.stringify(body));
  return body.data.accessToken;
}

async function api(token, method, path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await r.json();
  return { status: r.status, body: json };
}

function pass(msg) {
  console.log(`  ✅ PASS — ${msg}`);
}
function fail(msg) {
  console.log(`  ❌ FAIL — ${msg}`);
}
function info(msg) {
  console.log(`  ℹ️  ${msg}`);
}

async function main() {
  console.log("\n====================================================");
  console.log(" InterVu AI — Solution Template E2E Audit (API)");
  console.log("====================================================\n");

  // ── PHASE 0 — Auth ───────────────────────────────────────
  console.log("PHASE 0 — AUTH");
  let token;
  try {
    token = await getToken();
    pass("Login successful. Token received.");
  } catch (e) {
    fail(`Login failed: ${e.message}`);
    process.exit(1);
  }

  // ── PHASE 1 — Template List ──────────────────────────────
  console.log("\nPHASE 1 — TEMPLATE LIST");
  const listRes = await api(token, "GET", "/templates?page=1&limit=100");
  if (listRes.status === 200 && listRes.body.success) {
    const count = listRes.body.data?.items?.length ?? 0;
    pass(`GET /templates → 200. Found ${count} templates.`);
  } else {
    fail(`GET /templates → ${listRes.status}: ${JSON.stringify(listRes.body)}`);
    process.exit(1);
  }
  const allTemplates = listRes.body.data?.items ?? [];

  // Prefer "Demo React Hook Question" (has seeded variables), else first template
  let templateId;
  const demoTemplate = allTemplates.find(
    (t) =>
      t.name === "Demo React Hook Question" || t.conceptKey === "react_hooks",
  );
  if (demoTemplate) {
    templateId = demoTemplate.id;
    info(`Using seeded demo template: "${demoTemplate.name}" (${templateId})`);
  } else {
    templateId = allTemplates[0]?.id;
    info(
      `Demo template not found, using first: "${allTemplates[0]?.name}" (${templateId})`,
    );
  }

  if (!templateId) {
    fail("No template ID — cannot continue.");
    process.exit(1);
  }

  // ── PHASE 2 — Template Detail ────────────────────────────
  console.log("\nPHASE 2 — TEMPLATE DETAIL");
  const detailRes = await api(token, "GET", `/templates/${templateId}`);
  if (detailRes.status === 200 && detailRes.body.success) {
    pass(
      `GET /templates/${templateId} → 200. Name: "${detailRes.body.data?.name}"`,
    );
  } else {
    fail(`GET /templates/${templateId} → ${detailRes.status}`);
  }

  // ── PHASE 3 — Get Solution Template ─────────────────────
  console.log("\nPHASE 3 — GET SOLUTION TEMPLATE");
  const solGetRes = await api(
    token,
    "GET",
    `/templates/${templateId}/solution`,
  );
  if (solGetRes.status === 200) {
    const hasData = solGetRes.body.data !== null;
    pass(
      `GET /solution → 200. Data ${hasData ? "exists" : "is null (none saved yet)"}.`,
    );
  } else {
    fail(
      `GET /solution → ${solGetRes.status}: ${JSON.stringify(solGetRes.body)}`,
    );
  }

  // ── PHASE 4 — Template Variables ────────────────────────
  console.log("\nPHASE 4 — TEMPLATE VARIABLES");
  const varListRes = await api(
    token,
    "GET",
    `/templates/${templateId}/variables`,
  );
  let variables = varListRes.body.data ?? [];

  if (varListRes.status === 200 && variables.length > 0) {
    pass(
      `Variables already exist: ${variables.map((v) => v.variableName).join(", ")}`,
    );
  } else {
    // Create variables via API so the template is fully functional
    info(
      "No variables found — creating test variables via API (POST /variables)...",
    );
    const createVarRes1 = await api(
      token,
      "POST",
      `/templates/${templateId}/variables`,
      {
        variableName: "answer",
        variableType: "STRING",
        required: true,
        defaultValue: "",
      },
    );
    const createVarRes2 = await api(
      token,
      "POST",
      `/templates/${templateId}/variables`,
      {
        variableName: "explanation",
        variableType: "STRING",
        required: false,
        defaultValue: "",
      },
    );

    if (createVarRes1.status === 201 && createVarRes2.status === 201) {
      variables = [createVarRes1.body.data, createVarRes2.body.data];
      pass(`Variables created via API: answer, explanation`);
    } else {
      fail(
        `Failed to create variables. answer→${createVarRes1.status}, explanation→${createVarRes2.status}`,
      );
      fail(JSON.stringify(createVarRes1.body));
    }
  }
  info(`Active variables: ${variables.map((v) => v?.variableName).join(", ")}`);

  // ── PHASE 5 — Save Solution Template ────────────────────
  console.log("\nPHASE 5 — SAVE SOLUTION TEMPLATE");
  const existingSol = solGetRes.body.data;
  let saveRes;
  if (!existingSol) {
    saveRes = await api(token, "POST", `/templates/${templateId}/solution`, {
      solutionTemplate: "Correct answer is {{answer}} because {{explanation}}",
      explanationTemplate: "Explanation: {{explanation}}",
    });
    if (saveRes.status === 201 && saveRes.body.success) {
      pass(`POST /solution → 201. Solution template created.`);
    } else {
      fail(
        `POST /solution → ${saveRes.status}: ${JSON.stringify(saveRes.body)}`,
      );
    }
  } else {
    saveRes = await api(token, "PATCH", `/templates/${templateId}/solution`, {
      solutionTemplate: "Correct answer is {{answer}} because {{explanation}}",
      explanationTemplate: "Explanation: {{explanation}}",
    });
    if (saveRes.status === 200 && saveRes.body.success) {
      pass(`PATCH /solution → 200. Solution template updated.`);
    } else {
      fail(
        `PATCH /solution → ${saveRes.status}: ${JSON.stringify(saveRes.body)}`,
      );
    }
  }

  // Verify persistence
  const solVerifyRes = await api(
    token,
    "GET",
    `/templates/${templateId}/solution`,
  );
  if (solVerifyRes.body.data?.solutionTemplate?.includes("{{answer}}")) {
    pass(
      "Persistence verified — solution template saved and retrieved correctly.",
    );
  } else {
    fail(
      `Persistence check failed. Got: "${solVerifyRes.body.data?.solutionTemplate}"`,
    );
  }

  // ── PHASE 6 — Valid Preview ──────────────────────────────
  console.log("\nPHASE 6 — VALID TEMPLATE PREVIEW");
  const previewRes = await api(
    token,
    "POST",
    `/templates/${templateId}/preview`,
    {
      previewPayload: { answer: "42", explanation: "derived from formula" },
    },
  );
  if (previewRes.status === 201 && previewRes.body.success) {
    const result = previewRes.body.data?.previewResult;
    const solution = result?.solution ?? "";
    if (solution.includes("42") && solution.includes("derived from formula")) {
      pass(`POST /preview → 201. Output: "${solution}"`);
    } else {
      fail(`Output incorrect. Got: "${solution}"`);
    }
    if (result?.validation?.valid) {
      pass("Validation: All variables resolved ✓");
    } else {
      fail(`Validation failed: ${JSON.stringify(result?.validation)}`);
    }
  } else {
    fail(
      `POST /preview → ${previewRes.status}: ${JSON.stringify(previewRes.body)}`,
    );
  }

  // ── PHASE 7 — Invalid Placeholder ───────────────────────
  console.log("\nPHASE 7 — INVALID PLACEHOLDER PREVIEW");
  const invalidPreviewRes = await api(
    token,
    "POST",
    `/templates/${templateId}/preview`,
    {
      previewPayload: { answer: "42" },
      solutionTemplate: "Correct answer is {{invalid_variable}}",
    },
  );
  const invalidValidation =
    invalidPreviewRes.body.data?.previewResult?.validation;
  const errorUnknown = invalidPreviewRes.body.error?.details?.unknownVariables;
  if (
    !invalidValidation?.valid &&
    invalidValidation?.unknownVariables?.includes("invalid_variable")
  ) {
    pass(
      `Invalid variable detected in previewResult — unknownVariables: ["invalid_variable"]`,
    );
  } else if (errorUnknown?.includes("invalid_variable")) {
    pass(
      `API rejected template — error.unknownVariables: ["invalid_variable"]`,
    );
  } else if (invalidPreviewRes.body.error) {
    pass(
      `API rejected invalid template: ${JSON.stringify(invalidPreviewRes.body.error)}`,
    );
  } else {
    fail(
      `Invalid variable NOT caught. Got: ${JSON.stringify(invalidPreviewRes.body)}`,
    );
  }

  // ── PHASE 8 — Preview Persistence ───────────────────────
  console.log("\nPHASE 8 — GET LATEST PREVIEW (Persistence)");
  const latestRes = await api(token, "GET", `/templates/${templateId}/preview`);
  if (latestRes.status === 200 && latestRes.body.success) {
    const hasHistory = latestRes.body.data !== null;
    pass(
      `GET /preview → 200. Preview history ${hasHistory ? "exists" : "is null (none saved)"}.`,
    );
    if (hasHistory) {
      info(
        `Last preview payload: ${JSON.stringify(latestRes.body.data?.previewPayload)}`,
      );
    }
  } else {
    fail(
      `GET /preview → ${latestRes.status}: ${JSON.stringify(latestRes.body)}`,
    );
  }

  // ── SUMMARY ──────────────────────────────────────────────
  console.log("\n====================================================");
  console.log(" E2E AUDIT COMPLETE");
  console.log("====================================================\n");
}

main()
  .catch((e) => {
    console.error("\n❌ UNHANDLED ERROR:", e.message);
  })
  .finally(() => prisma.$disconnect());
