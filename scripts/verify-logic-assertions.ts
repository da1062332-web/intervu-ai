import { PRNG, generateVariables, evaluateConstraints, hydrateString, evaluateExpression } from "@intervu-ai/generation";

async function run() {
  console.log("==========================================");
  console.log("Asserting Variable, Option, and Constraint Logic");
  console.log("==========================================\n");

  // 1. Define template metadata
  const template = {
    variables: [
      { name: "speed", type: "integer", min: 50, max: 100 },
      { name: "time", type: "static", value: 2 },
      { name: "distance", type: "formula", formula: "speed * time" }
    ],
    constraints: [
      { rule: "speed >= 80", severity: "critical" }, // Enforces speed is at least 80
      { rule: "distance <= 180", severity: "critical" } // Enforces distance is at most 180 (so speed <= 90)
    ],
    structure: {
      questionTemplate: "A train travels at {speed} km/h for {time} hours.",
      optionsTemplate: ["{distance}", "100", "150", "190"]
    },
    solutionSchema: {
      formula: "distance"
    }
  };

  console.log("Template Configuration:");
  console.log(`- Variables: speed [50-100], time [2], distance [speed * time]`);
  console.log(`- Constraints: speed >= 80, distance <= 180`);
  console.log(`- Expected Speed range after constraints: [80-90]\n`);

  let runCount = 100;
  let success = true;

  console.log(`Running ${runCount} simulations to check parameters & constraint matching...`);

  for (let i = 1; i <= runCount; i++) {
    const prng = new PRNG(Math.floor(Math.random() * 1000000));
    
    // Generate variables
    const vars = generateVariables(template.variables as any, prng);
    
    // Evaluate constraints
    const constraintCheck = evaluateConstraints(template.constraints as any, vars);
    
    if (!constraintCheck.isValid) {
      // If constraints are violated, the generator loops to retry.
      // This is expected during random generation, so we skip assertions for this set
      // and only assert on sets that PASS constraints (representing what the user gets).
      continue;
    }

    // Hydrate options
    const options = template.structure.optionsTemplate.map(opt => hydrateString(opt, vars));
    const ans = String(evaluateExpression(template.solutionSchema.formula, vars));

    // --- ASSERTIONS ---
    
    // 1. Variable validation
    const speed = Number(vars.speed);
    const time = Number(vars.time);
    const distance = Number(vars.distance);

    if (isNaN(speed) || speed < 50 || speed > 100) {
      console.error(`❌ Variable 'speed' value ${speed} out of bounds!`);
      success = false;
    }
    if (time !== 2) {
      console.error(`❌ Variable 'time' value ${time} is incorrect!`);
      success = false;
    }
    if (distance !== speed * time) {
      console.error(`❌ Variable 'distance' calculation ${distance} !== ${speed} * ${time}!`);
      success = false;
    }

    // 2. Constraint validation
    if (speed < 80) {
      console.error(`❌ Constraint 'speed >= 80' violated! Speed was ${speed}`);
      success = false;
    }
    if (distance > 180) {
      console.error(`❌ Constraint 'distance <= 180' violated! Distance was ${distance}`);
      success = false;
    }

    // 3. Option formatting & uniqueness
    const duplicates = options.filter((item, index) => options.indexOf(item) !== index);
    if (duplicates.length > 0) {
      console.error(`❌ Duplicate options generated: ${options.join(", ")}`);
      success = false;
    }

    // 4. Correct answer check
    const correctMatches = options.filter(opt => opt === ans);
    if (correctMatches.length !== 1) {
      console.error(`❌ Found ${correctMatches.length} matching answers in options ${options.join(", ")} for answer ${ans}`);
      success = false;
    }
  }

  if (success) {
    console.log("\n✅ ALL ASSERTIONS PASSED!");
    console.log("- Variables generated are strictly valid type and range.");
    console.log("- Generated questions strictly follow all template constraints.");
    console.log("- Options are generated properly and are fully unique.");
    console.log("- Exactly one valid option matches the correct answer.");
  } else {
    console.log("\n❌ VERIFICATION FAILED. Check errors above.");
  }
}

run();
