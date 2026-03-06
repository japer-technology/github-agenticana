#!/usr/bin/env node
/**
 * Agenticana MCP v3 — Quick Test
 *
 * Verifies all tool modules load correctly and exports are valid.
 * Run: node mcp/test-tools.js
 */

const path = require("path");
const fs = require("fs");

const AgenticanaRoot = path.join(__dirname, "..");

console.log("🦅 Agenticana MCP v3.0 — Tool Test\n");

const toolModules = [
  "reasoning-bank-tools",
  "router-tools",
  "memory-tools",
  "agent-tools",
  "swarm-tools",
  "simulacrum-tools",
  "evolution-tools",
  "utility-tools",
  "meta-tools",
];

let passed = 0;
let failed = 0;

for (const moduleName of toolModules) {
  const modulePath = path.join(__dirname, "tools", `${moduleName}.js`);

  try {
    // Check file exists
    if (!fs.existsSync(modulePath)) {
      console.log(`❌ ${moduleName}: File not found`);
      failed++;
      continue;
    }

    // Try to require
    const mod = require(modulePath);

    // Check exports
    if (!mod.register || typeof mod.register !== "function") {
      console.log(`❌ ${moduleName}: Missing or invalid 'register' export`);
      failed++;
      continue;
    }

    if (!mod.toolNames || !Array.isArray(mod.toolNames)) {
      console.log(`❌ ${moduleName}: Missing or invalid 'toolNames' export`);
      failed++;
      continue;
    }

    if (mod.toolNames.length === 0) {
      console.log(`⚠️  ${moduleName}: No tools defined`);
      failed++;
      continue;
    }

    console.log(
      `✅ ${moduleName}: ${mod.toolNames.length} tools (${mod.toolNames.join(", ")})`,
    );
    passed++;
  } catch (err) {
    console.log(`❌ ${moduleName}: ${err.message}`);
    failed++;
  }
}

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log("✅ All tool modules loaded successfully!");
  console.log("\nTotal tools available:");

  let totalTools = 0;
  toolModules.forEach((name) => {
    try {
      const mod = require(path.join(__dirname, "tools", `${name}.js`));
      totalTools += mod.toolNames.length;
    } catch {
      /* skip */
    }
  });

  console.log(`🎯 ${totalTools} tools ready to use`);
  process.exit(0);
} else {
  console.log("❌ Some modules failed to load. Check errors above.");
  process.exit(1);
}
