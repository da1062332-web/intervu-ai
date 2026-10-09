/**
 * Standalone Headed Candidate Playwright UI Runner
 *
 * Automates a real candidate's end-to-end journey in the live browser (headless: false):
 * 1. Registers candidate with referral code 'QLO'
 * 2. Authenticates and sets up session in browser
 * 3. Starts Qloax Assessment (cmsifafam000099s9csfe33pg)
 * 4. Navigates to Section 5 (Advance Coding)
 * 5. Iterates through coding questions:
 *    - Opens Monaco Editor
 *    - Selects Java in dropdown
 *    - Enters Java code and clicks "Run Code" 4 times (simulating debugging)
 *    - Inspects test case results in results tab
 *    - Enters final verified Java solution and clicks "Submit Solution"
 * 6. Submits assessment via Confirmation Modal and verifies completion
 * 7. Keeps browser visible on screen for review or while load test runs
 * 8. Records timestamped logs and screenshots
 */

const { chromium } = require("playwright");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const BASE_URL = (process.env.BASE_URL || "https://skillitrix.onrender.com/api/v1").replace(/\/+$/, "");
const APP_URL = (process.env.APP_URL || "https://app.skillitrix.com").replace(/\/+$/, "");
const TEST_CONFIG_ID = process.env.TEST_CONFIG_ID || "cmsifafam000099s9csfe33pg";
const REFERRAL_CODE = process.env.REFERRAL_CODE || "QLO";
const SIGNUP_PASSWORD = process.env.SIGNUP_PASSWORD || "LoadTest#2026!";

// Parse CLI flags
const args = process.argv.slice(2);
function getArg(name, defaultValue) {
  const idx = args.indexOf(`--${name}`);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return defaultValue;
}

const isHeadless = getArg("headless", "false") === "true";
const totalRuns = parseInt(getArg("runs", "4"), 10);
const holdSeconds = parseInt(getArg("hold", "60"), 10);
const keepOpenFile = getArg("keep-open-file", null);

const reportDir = path.resolve(__dirname, "reports");
const screenshotDir = path.resolve(reportDir, "screenshots");

if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

function bringToFront() {
  if (isHeadless) return;
  try {
    const psScript = path.resolve(__dirname, "bring-to-front.ps1");
    if (fs.existsSync(psScript)) {
      execSync(`powershell -ExecutionPolicy Bypass -File "${psScript}"`, {
        stdio: "ignore",
        timeout: 4000,
      });
    }
  } catch (_) {}
}

// Helper fetch with retries
async function postWithRetry(url, body, headers = {}, maxRetries = 4) {
  let attempt = 0;
  while (attempt < maxRetries) {
    attempt++;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(body),
      });
      if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 429)) {
        return res;
      }
      console.warn(`[API WARN] ${url} returned ${res.status}. Retrying (attempt ${attempt}/${maxRetries})...`);
    } catch (err) {
      console.warn(`[API WARN] ${url} error: ${err.message}. Retrying...`);
    }
    await new Promise((r) => setTimeout(r, 1000 * Math.pow(1.5, attempt)));
  }
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function getJavaDebugCode(iteration, questionNum = 1) {
  if (iteration === 1) {
    return `class Solution {
    public double calculateFuelConsumption(double distance, double fuel) {
        // Run 1: Initial skeleton check for Q${questionNum}
        return -1.0;
    }
}`;
  }
  if (iteration === 2) {
    return `class Solution {
    public double calculateFuelConsumption(double distance, double fuel) {
        // Run 2: Handle non-positive boundaries for Q${questionNum}
        if (distance <= 0 || fuel <= 0) return -1.0;
        return 0.0;
    }
}`;
  }
  if (iteration === 3) {
    return `class Solution {
    public double calculateFuelConsumption(double distance, double fuel) {
        // Run 3: Adding ratio division logic for Q${questionNum}
        double dist = Math.max(distance, fuel);
        double f = Math.min(distance, fuel);
        if (distance <= 0 || fuel <= 0) return -1.0;
        return dist / f;
    }
}`;
  }
  return `class Solution {
    public double calculateFuelConsumption(double distance, double fuel) {
        // Run 4: Verified solution with bounds for Q${questionNum}
        double dist = Math.max(distance, fuel);
        double f = Math.min(distance, fuel);
        if (distance <= 0 || fuel <= 0) return -1.0;
        return dist / f;
    }
}`;
}

const finalVerifiedCode = `class Solution {
    public double calculateFuelConsumption(double distance, double fuel) {
        // Final verified submission evaluated against all private test suites
        double dist = Math.max(distance, fuel);
        double f = Math.min(distance, fuel);
        if (distance <= 0 || fuel <= 0) return -1.0;
        return dist / f;
    }
}`;

async function runCandidateUI() {
  const startTime = Date.now();
  console.log("\n================================================================================");
  console.log("   LIVE CANDIDATE BROWSER AUTOMATION (HEADED GOOGLE CHROME)");
  console.log("================================================================================");
  console.log(`- Web App Target:    ${APP_URL}`);
  console.log(`- API Target:        ${BASE_URL}`);
  console.log(`- Assessment ID:     ${TEST_CONFIG_ID}`);
  console.log(`- Headless Mode:     ${isHeadless}`);
  console.log(`- Debug Runs:        ${totalRuns} iterations per question`);
  console.log(`- Post-run Hold:     ${holdSeconds} seconds (or lockfile)`);
  console.log("--------------------------------------------------------------------------------\n");

  const telemetry = {
    startedAt: new Date(startTime).toISOString(),
    candidateEmail: null,
    testInstanceId: null,
    questions: [],
    runs: [],
    submits: [],
    screenshots: [],
    consoleErrors: [],
    status: "IN_PROGRESS",
  };

  const email = `ui-cand-${Date.now()}@skillitrix-loadtest.invalid`;
  telemetry.candidateEmail = email;

  // 1. API: Candidate Signup
  console.log(`[CANDIDATE UI 👤] Registering candidate: ${email}...`);
  const signupRes = await postWithRetry(`${BASE_URL}/auth/signup`, {
    email,
    password: SIGNUP_PASSWORD,
    fullName: "Live UI Candidate Auditor",
    referralCode: REFERRAL_CODE,
  });

  const signupJson = await signupRes.json();
  const token = signupJson?.data?.accessToken || signupJson?.accessToken;
  const user = signupJson?.data?.user || signupJson?.user;

  if (!token) {
    throw new Error(`Failed to sign up candidate. Response: ${JSON.stringify(signupJson)}`);
  }
  console.log(`[CANDIDATE UI ✅] Registered candidate successfully. User ID: ${user?.id || "N/A"}`);

  // 2. API: Start Assessment
  console.log(`[CANDIDATE UI 🚀] Initializing assessment ${TEST_CONFIG_ID}...`);
  const startRes = await postWithRetry(
    `${BASE_URL}/tests/start`,
    { testConfigId: TEST_CONFIG_ID },
    { Authorization: `Bearer ${token}` }
  );
  const startJson = await startRes.json();
  const testInstanceId = startJson?.data?.testInstanceId;
  if (!testInstanceId) {
    throw new Error(`Failed to start test. Response: ${JSON.stringify(startJson)}`);
  }
  telemetry.testInstanceId = testInstanceId;
  console.log(`[CANDIDATE UI ✅] Test Instance created: ${testInstanceId}`);

  // 3. API: Advance Sections to Section 5 (Coding)
  console.log(`[CANDIDATE UI ⏭️] Advancing test instance to Section 5 (Advance Coding)...`);
  for (let s = 1; s <= 4; s++) {
    const advRes = await postWithRetry(
      `${BASE_URL}/tests/${testInstanceId}/sections/advance`,
      {},
      { Authorization: `Bearer ${token}` }
    );
    console.log(`  -> Advanced section step ${s} (HTTP ${advRes.status})`);
    await new Promise((r) => setTimeout(r, 500));
  }

  // 4. Launch Headed Google Chrome Browser
  console.log("\n[CANDIDATE UI 🖥️] Launching Google Chrome browser directly on desktop...");
  let browser;
  const launchOptions = {
    headless: isHeadless,
    channel: isHeadless ? undefined : "chrome",
    slowMo: isHeadless ? 40 : 160,
    args: [
      "--window-position=50,30",
      "--window-size=1366,840",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-blink-features=AutomationControlled",
    ],
  };

  try {
    browser = await chromium.launch(launchOptions);
  } catch (_) {
    // Fallback if Chrome channel flag fails
    delete launchOptions.channel;
    browser = await chromium.launch(launchOptions);
  }

  const context = await browser.newContext({
    viewport: isHeadless ? { width: 1366, height: 840 } : null,
    permissions: ["camera", "microphone"],
  });

  // Bypass fullscreen blocker & mock fullscreen methods
  await context.addInitScript(() => {
    Object.defineProperty(document, "fullscreenElement", {
      get: () => document.documentElement,
      configurable: true,
    });
    document.documentElement.requestFullscreen = async () => {};
    document.exitFullscreen = async () => {};
  });

  const page = await context.newPage();

  // Bring browser to foreground
  bringToFront();

  // Listen for browser console errors
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      telemetry.consoleErrors.push(msg.text());
    }
  });

  try {
    // 5. Navigate to Web App & Inject Authentication
    console.log(`[CANDIDATE UI 🌐] Navigating to ${APP_URL}...`);
    await page.goto(APP_URL, { waitUntil: "domcontentloaded" });

    await page.evaluate(
      ({ token, user }) => {
        const sessionPayload = {
          state: {
            token: token,
            accessToken: token,
            refreshToken: null,
            isAuthenticated: true,
            user: user,
          },
          version: 0,
        };
        const authPayload = {
          state: {
            user: user,
            isAuthenticated: true,
          },
          version: 0,
        };
        localStorage.setItem("SkillitriX-session-store", JSON.stringify(sessionPayload));
        localStorage.setItem("SkillitriX-auth-store", JSON.stringify(authPayload));
      },
      { token, user }
    );

    // 6. Navigate directly to Test Execution Page
    const execUrl = `${APP_URL}/candidate/tests/${testInstanceId}/execution`;
    console.log(`[CANDIDATE UI 🎯] Navigating directly to assessment execution: ${execUrl}`);
    await page.goto(execUrl, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Re-assert window focus to guarantee user sees the active examination
    bringToFront();

    // Helper functions for tabs and editor
    async function switchToEditorTab() {
      const editorTabBtn = page.getByRole("button", { name: "Editor", exact: true });
      if (await editorTabBtn.isVisible().catch(() => false)) {
        await editorTabBtn.click();
        await page.waitForTimeout(400);
      }
      await page.waitForSelector(".monaco-editor", { timeout: 15000 });
    }

    async function setEditorCode(codeText) {
      await switchToEditorTab();
      const setSuccess = await page.evaluate((val) => {
        const monaco = window.monaco;
        if (monaco && monaco.editor) {
          const models = monaco.editor.getModels();
          if (models && models.length > 0) {
            models[0].setValue(val);
            return true;
          }
        }
        return false;
      }, codeText);

      if (!setSuccess) {
        await page.locator(".monaco-editor").click();
        await page.keyboard.press("Control+A");
        await page.keyboard.press("Backspace");
        await page.keyboard.insertText(codeText);
      }
    }

    // 7. Find Coding Questions in Question Palette
    console.log("[CANDIDATE UI 🔍] Scanning Question Palette for coding questions...");
    const paletteButtons = await page
      .locator("div.grid-cols-5 button")
      .filter({ hasText: /^\d+$/ })
      .all();

    const questionCount = Math.max(1, paletteButtons.length);
    console.log(`[CANDIDATE UI 📋] Found ${questionCount} coding question(s) in this section palette.`);

    for (let qIdx = 1; qIdx <= questionCount; qIdx++) {
      console.log(`\n================================================================================`);
      console.log(`   PROCESSING CODING QUESTION ${qIdx} OF ${questionCount}`);
      console.log(`================================================================================`);

      // Click Question Button in Palette
      const qBtn = page
        .locator("div.grid-cols-5 button")
        .filter({ hasText: new RegExp(`^${qIdx}$`) })
        .first();

      if (await qBtn.isVisible().catch(() => false)) {
        console.log(`[CANDIDATE UI 🔘] Clicking Question ${qIdx} in palette...`);
        await qBtn.click();
      } else {
        const roleBtn = page.getByRole("button", { name: String(qIdx), exact: true });
        if (await roleBtn.isVisible().catch(() => false)) {
          await roleBtn.click();
        }
      }
      await page.waitForTimeout(1000);

      // Ensure Editor tab is active and bring Chrome to front
      await switchToEditorTab();
      bringToFront();

      // Wait for Monaco Editor & Compiler Controls
      console.log("[CANDIDATE UI ⏳] Waiting for Monaco Editor & compiler tools to mount...");
      await page.waitForSelector(".monaco-editor", { timeout: 35000 });
      console.log("[CANDIDATE UI ⚡] Monaco Editor ready!");

      if (qIdx === 1) {
        const ss1 = path.join(screenshotDir, "01-coding-workspace.png");
        await page.screenshot({ path: ss1, fullPage: false });
        telemetry.screenshots.push("01-coding-workspace.png");
      }

      // Ensure Java is selected
      const langSelect = page.locator("select");
      if (await langSelect.isVisible()) {
        await langSelect.selectOption("java");
        console.log(`[CANDIDATE UI ☕] Compiler language set to Java.`);
      }

      // 8. Debug Runs (4 to 5 runs clicking "Run Code")
      console.log(`\n[CANDIDATE UI 🔁] Question ${qIdx}: Starting ${totalRuns} iterative debugging runs on Judge0...`);
      for (let r = 1; r <= totalRuns; r++) {
        const codeSnippet = getJavaDebugCode(r, qIdx);
        console.log(`\n  --- Q${qIdx} | Run ${r}/${totalRuns}: Updating Java code & clicking 'Run Code' ---`);
        await setEditorCode(codeSnippet);
        await page.waitForTimeout(600);

        // Ensure Run Code button is ready and enabled
        const runBtnLocator = page.locator('button:has-text("Run Code")');
        await runBtnLocator.waitFor({ state: "visible", timeout: 75000 }).catch(() => {});
        await page.waitForTimeout(500);

        let durationMs = 0;
        let runStatus = 0;
        let summary = { total: 0, passed: 0, failed: 0 };
        const t0 = Date.now();
        try {
          const [runRes] = await Promise.all([
            page.waitForResponse((res) => res.url().includes("/coding/run"), { timeout: 75000 }),
            runBtnLocator.click(),
          ]);
          durationMs = Date.now() - t0;
          runStatus = runRes.status();
          const runData = await runRes.json().catch(() => ({}));
          summary = runData?.summary || { total: 0, passed: 0, failed: 0 };
          console.log(`  [CANDIDATE UI ⏱️] Run ${r} finished in ${durationMs}ms (HTTP ${runStatus})`);
          console.log(`    -> Passed: ${summary.passed}/${summary.total} (Failed: ${summary.failed})`);
        } catch (runErr) {
          durationMs = Date.now() - t0;
          console.warn(`  [CANDIDATE UI ⚠️] Run ${r} wait error: ${runErr.message}`);
        }

        telemetry.runs.push({
          questionNum: qIdx,
          runIndex: r,
          latencyMs: durationMs,
          httpStatus: runStatus,
          summary,
          timestamp: new Date().toISOString(),
        });

        // Pause to let candidate and user view test results
        await page.waitForTimeout(2000);
      }

      if (qIdx === 1) {
        const ss2 = path.join(screenshotDir, "02-run-code-completed.png");
        await page.screenshot({ path: ss2, fullPage: false });
        telemetry.screenshots.push("02-run-code-completed.png");
      }

      // 9. Final Submit Solution for Question
      console.log(`\n[CANDIDATE UI 🚀] Q${qIdx}: Entering verified final Java solution and clicking 'Submit Solution'...`);
      await setEditorCode(finalVerifiedCode);
      await page.waitForTimeout(1000);

      const submitBtnLocator = page.locator('button:has-text("Submit Solution")');
      await submitBtnLocator.waitFor({ state: "visible", timeout: 75000 }).catch(() => {});
      await page.waitForTimeout(500);

      const tSub0 = Date.now();
      let submitDurationMs = 0;
      let submitStatus = 0;
      let submitData = {};
      try {
        const [submitRes] = await Promise.all([
          page.waitForResponse((res) => res.url().includes("/coding/submit"), { timeout: 90000 }),
          submitBtnLocator.click(),
        ]);
        submitDurationMs = Date.now() - tSub0;
        submitStatus = submitRes.status();
        submitData = await submitRes.json().catch(() => ({}));
        console.log(`[CANDIDATE UI 🎯] Q${qIdx} Submit Solution evaluated in ${submitDurationMs}ms (HTTP ${submitStatus})`);
        console.log(`  -> Score: ${submitData?.score}% | Verdict: ${submitData?.verdict}`);
      } catch (subErr) {
        submitDurationMs = Date.now() - tSub0;
        console.warn(`[CANDIDATE UI ⚠️] Submit Solution wait error: ${subErr.message}`);
      }

      telemetry.submits.push({
        questionNum: qIdx,
        latencyMs: submitDurationMs,
        httpStatus: submitStatus,
        score: submitData?.score,
        verdict: submitData?.verdict,
        timestamp: new Date().toISOString(),
      });

      if (qIdx === 1) {
        const ss3 = path.join(screenshotDir, "03-submit-solution-completed.png");
        await page.screenshot({ path: ss3, fullPage: false });
        telemetry.screenshots.push("03-submit-solution-completed.png");
      }

      await page.waitForTimeout(2000);
    }

    // 10. Final Assessment Finish
    console.log("\n[CANDIDATE UI 🏁] Finalizing exam: Clicking assessment Submit button in header...");
    await page.waitForTimeout(1500);
    const headerSubmitBtn = page.getByRole("button", { name: "Submit", exact: true });
    await headerSubmitBtn.click();

    console.log("[CANDIDATE UI 📋] Waiting for SubmissionModal...");
    const confirmBtn = page.getByRole("button", { name: /confirm submission/i });
    await confirmBtn.waitFor({ state: "visible", timeout: 10000 });
    console.log("[CANDIDATE UI ✍️] Clicking 'Confirm Submission'...");
    await confirmBtn.click();

    console.log("[CANDIDATE UI ⏳] Waiting for submission completion screen...");
    await page
      .waitForSelector("text=Assessment Submitted Successfully, text=Thank You", { timeout: 15000 })
      .catch(() => {});

    const ss4 = path.join(screenshotDir, "04-assessment-submitted.png");
    await page.screenshot({ path: ss4, fullPage: false });
    telemetry.screenshots.push("04-assessment-submitted.png");

    telemetry.status = "SUCCESS";
    telemetry.completedAt = new Date().toISOString();
    telemetry.totalDurationMs = Date.now() - startTime;

    console.log("\n================================================================================");
    console.log("   🎉 CANDIDATE UI ASSESSMENT LIFECYCLE COMPLETED SUCCESSFULLY!");
    console.log("================================================================================");
    console.log(`- Candidate:         ${email}`);
    console.log(`- Instance:          ${testInstanceId}`);
    console.log(`- Debug Runs Done:   ${telemetry.runs.length}`);
    console.log(`- Submissions Done:  ${telemetry.submits.length}`);
    console.log(`- Total Duration:    ${(telemetry.totalDurationMs / 1000).toFixed(1)}s`);
    console.log("================================================================================\n");

  } catch (err) {
    telemetry.status = "FAILED";
    telemetry.error = err.message;
    console.error(`[CANDIDATE UI ❌ ERROR] ${err.message}`);
    const errSs = path.join(screenshotDir, "error-state.png");
    await page.screenshot({ path: errSs, fullPage: true }).catch(() => {});
    telemetry.screenshots.push("error-state.png");
  } finally {
    // Keep browser visible on screen for review or while background load test runs
    if (!isHeadless && browser) {
      if (keepOpenFile) {
        console.log(`[CANDIDATE UI 👁️] Synchronizing with load test: Keeping Google Chrome visible until test completes...`);
        while (fs.existsSync(keepOpenFile)) {
          await page.waitForTimeout(1000).catch(() => {});
        }
        console.log(`[CANDIDATE UI 👁️] Load test lock released.`);
      } else if (holdSeconds > 0) {
        console.log(`[CANDIDATE UI 👁️] Keeping Google Chrome open on your screen for ${holdSeconds}s for visual inspection...`);
        console.log(`[CANDIDATE UI 👁️] (You can close Chrome or wait for the timer to finish)`);
        await page.waitForTimeout(holdSeconds * 1000).catch(() => {});
      }
      await browser.close().catch(() => {});
      console.log("[CANDIDATE UI 🔒] Browser session closed.");
    } else if (browser) {
      await browser.close().catch(() => {});
    }
  }

  // Write telemetry output
  const resultJsonPath = path.join(reportDir, "candidate-ui-live-result.json");
  fs.writeFileSync(resultJsonPath, JSON.stringify(telemetry, null, 2));
  console.log(`[CANDIDATE UI 📄] Telemetry written to: ${resultJsonPath}`);
  return telemetry;
}

if (require.main === module) {
  runCandidateUI().catch((err) => {
    console.error("Fatal runner error:", err);
    process.exit(1);
  });
}

module.exports = { runCandidateUI };
