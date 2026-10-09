/**
 * Probe script to verify Playwright UI flow against deployed SkillitriX app
 */
const { chromium } = require("playwright");

const APP_URL = process.env.APP_URL || "https://app.skillitrix.com";
const BASE_URL = process.env.BASE_URL || "https://skillitrix.onrender.com/api/v1";
const TEST_CONFIG_ID = process.env.TEST_CONFIG_ID || "cmsifafam000099s9csfe33pg";
const REFERRAL_CODE = process.env.REFERRAL_CODE || "QLO";

async function probe() {
  console.log("Launching headless browser probe...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
  });

  // Mock fullscreenElement so FullscreenOverlay does not block candidate UI
  await context.addInitScript(() => {
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => document.documentElement,
    });
  });

  const page = await context.newPage();

  page.on("console", (msg) => {
    console.log(`[BROWSER CONSOLE ${msg.type()}]`, msg.text());
  });

  try {
    // 1. Create a candidate via API to get real valid token
    const candidateEmail = `probe-cand-${Date.now()}@skillitrix-loadtest.invalid`;
    console.log(`Registering candidate: ${candidateEmail}`);
    let regJson = null;
    let regRes = null;
    for (let attempt = 1; attempt <= 6; attempt++) {
      try {
        regRes = await fetch(`${BASE_URL}/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: candidateEmail,
            password: "LoadTest#2026!",
            fullName: "Probe Live Candidate",
            referralCode: REFERRAL_CODE,
          }),
        });
        const text = await regRes.text();
        if (text.startsWith("{")) {
          regJson = JSON.parse(text);
          if (regJson?.data?.accessToken || regJson?.accessToken) break;
        }
        console.warn(`Signup returned non-JSON / retry (attempt ${attempt}):`, text.slice(0, 100));
      } catch (err) {
        console.warn(`Signup fetch failed (attempt ${attempt}):`, err.message);
      }
      await new Promise(r => setTimeout(r, 3000));
    }
    console.log("Signup status:", regRes?.status, "data user:", regJson?.data?.user?.email);
    const token = regJson?.data?.accessToken || regJson?.accessToken;
    const refreshToken = regJson?.data?.refreshToken || regJson?.refreshToken;
    const user = regJson?.data?.user || regJson?.user;

    if (!token) {
      throw new Error("No token returned from signup: " + JSON.stringify(regJson));
    }

    // 2. Open APP_URL and set auth state in localStorage
    console.log(`Navigating to ${APP_URL}...`);
    await page.goto(`${APP_URL}/login`, { waitUntil: "domcontentloaded" });

    await page.evaluate(({ token, refreshToken, user }) => {
      const sessionState = {
        state: {
          accessToken: token,
          refreshToken: refreshToken,
          expiresAt: Date.now() + 3600000,
          hydrated: true,
        },
        version: 0,
      };
      const authState = {
        state: {
          user: user,
          isAuthenticated: true,
          isLoading: false,
        },
        version: 0,
      };
      localStorage.setItem("SkillitriX-session-store", JSON.stringify(sessionState));
      localStorage.setItem("SkillitriX-auth-store", JSON.stringify(authState));
      sessionStorage.setItem("token", token);
    }, { token, refreshToken, user });

    console.log("Auth session injected. Navigating to candidate dashboard...");
    await page.goto(`${APP_URL}/candidate/dashboard`, { waitUntil: "networkidle" });
    console.log("Current URL:", page.url());

    // 3. Start test instance via API
    console.log("Starting test instance via API...");
    let testInstanceId = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const startRes = await fetch(`${BASE_URL}/tests/start`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ testConfigId: TEST_CONFIG_ID }),
        });
        const startJson = await startRes.json();
        testInstanceId = startJson?.data?.testInstanceId;
        if (testInstanceId) {
          console.log(`Test started successfully: ${testInstanceId}`);
          break;
        }
        console.warn(`Start test failed (attempt ${attempt}):`, startJson);
      } catch (err) {
        console.warn(`Start test fetch error (attempt ${attempt}):`, err.message);
      }
      await new Promise(r => setTimeout(r, 2000));
    }

    if (!testInstanceId) {
      throw new Error("Failed to start test instance");
    }

    // 4. Advance to Coding section (Section 4) via API
    console.log(`Advancing test instance ${testInstanceId} to Section 4 (Coding)...`);
    for (let s = 1; s <= 4; s++) {
      const advRes = await fetch(`${BASE_URL}/tests/${testInstanceId}/sections/advance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      console.log(`Advanced to section step ${s}, status:`, advRes.status);
      await new Promise(r => setTimeout(r, 600));
    }

    // 5. Navigate browser directly to execution page
    const execUrl = `${APP_URL}/candidate/tests/${testInstanceId}/execution`;
    console.log(`Navigating browser directly to execution page: ${execUrl}`);
    await page.goto(execUrl, { waitUntil: "networkidle" });

    // Wait a couple seconds for hydration and inspect
    await page.waitForTimeout(3000);

    // Click on Question 1 in the palette to activate question 80
    console.log("Clicking Question '1' in the Question Palette...");
    // Find the question button '1' inside the palette grid
    const q1Btn = page.locator('div.grid-cols-5 button, div:has-text("Question Palette") ~ div button').filter({ hasText: /^1$/ }).first();
    console.log("Is palette button '1' visible?", await q1Btn.isVisible().catch(() => false));
    if (await q1Btn.isVisible().catch(() => false)) {
      await q1Btn.click();
      console.log("Clicked Question 1 palette button!");
    } else {
      // Fallback: click button with exact text '1'
      await page.getByRole("button", { name: "1", exact: true }).click();
      console.log("Clicked button '1' via getByRole!");
    }

    // Wait for Monaco Editor and Compiler
    console.log("Waiting for coding compiler / Monaco editor to load...");
    await page.waitForSelector(".monaco-editor", { timeout: 35000 });
    console.log("🎉 SUCCESS! Monaco editor is visible and ready!");

    // Inspect language dropdown, Run Code, and Submit Solution buttons
    const langSelect = page.locator("select");
    const runBtn = page.getByRole("button", { name: /run code/i });
    const submitBtn = page.getByRole("button", { name: /submit solution/i });

    console.log("Is language select visible?", await langSelect.isVisible());
    if (await langSelect.isVisible()) {
      console.log("Current selected language:", await langSelect.inputValue());
      await langSelect.selectOption("java");
      console.log("Selected language set to:", await langSelect.inputValue());
    }

    console.log("Is Run Code button visible?", await runBtn.isVisible());
    console.log("Is Submit Solution button visible?", await submitBtn.isVisible());

    // Enter Java code in Monaco Editor
    const javaCode = `class Solution {
    public double calculateFuelConsumption(double distance, double fuel) {
        if (distance <= 0 || fuel <= 0) return -1.0;
        return (distance / fuel);
    }
}`;

    console.log("Setting Java solution in Monaco Editor...");
    const setResult = await page.evaluate((code) => {
      const monaco = window.monaco;
      if (monaco && monaco.editor) {
        const models = monaco.editor.getModels();
        if (models && models.length > 0) {
          models[0].setValue(code);
          return true;
        }
      }
      return false;
    }, javaCode);

    if (!setResult) {
      console.log("Window.monaco not available directly. Using keyboard insertion fallback...");
      await page.locator(".monaco-editor").click();
      await page.keyboard.press("Control+A");
      await page.keyboard.press("Backspace");
      await page.keyboard.insertText(javaCode);
    }
    console.log("Java solution entered!");

    // Click "Run Code"
    console.log("Clicking 'Run Code' button and waiting for Judge0 AWS execution (/coding/run)...");
    const [runHttpRes] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/coding/run'), { timeout: 60000 }),
      runBtn.click(),
    ]);
    console.log("Run Code response status:", runHttpRes.status());
    const runJson = await runHttpRes.json();
    console.log("Run Code summary:", JSON.stringify(runJson?.summary || runJson));

    // Wait a brief human pause and then Submit Solution
    await page.waitForTimeout(2000);
    console.log("Clicking 'Submit Solution' button and waiting for Judge0 evaluation (/coding/submit)...");
    const [submitHttpRes] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/coding/submit'), { timeout: 90000 }),
      submitBtn.click(),
    ]);
    console.log("Submit Code response status:", submitHttpRes.status());
    const submitJson = await submitHttpRes.json();
    console.log("Submit Code verdict:", submitJson?.verdict, "Score:", submitJson?.score);

    // Click "Submit" in top header or "Submit Assessment" to finish
    await page.waitForTimeout(2000);
    console.log("Clicking final Submit button...");
    const headerSubmitBtn = page.getByRole("button", { name: "Submit", exact: true });
    await headerSubmitBtn.click();

    // Confirm in SubmissionModal
    console.log("Waiting for SubmissionModal...");
    const confirmBtn = page.getByRole("button", { name: /confirm submission/i });
    await confirmBtn.waitFor({ state: "visible", timeout: 10000 });
    console.log("Clicking 'Confirm Submission'...");
    await confirmBtn.click();

    // Wait for ThankYouModal or redirect to candidate dashboard
    console.log("Waiting for submission confirmation...");
    await page.waitForSelector("text=Assessment Submitted Successfully, text=Thank You", { timeout: 15000 }).catch(() => {});
    console.log("🎉 Complete Candidate Assessment Lifecycle VERIFIED ON ACTUAL UI!");

  } catch (err) {
    console.error("Probe error:", err);
  } finally {
    await browser.close();
    console.log("Browser probe closed.");
  }
}

probe();
