/**
 * Agenticana MCP — Meta-Capabilities & Telemetry Tools
 *
 * Self-awareness and monitoring tools:
 *   mcp_introspect — Get complete MCP capabilities
 *   mcp_health     — Health check and diagnostics
 *   mcp_telemetry  — Usage statistics and performance
 *   mcp_discover   — Auto-discover new Python scripts
 */

const { z } = require("zod");
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const toolNames = [
  "mcp_introspect",
  "mcp_health",
  "mcp_telemetry",
  "mcp_discover",
];

// Telemetry tracking
const telemetry = {
  toolCalls: new Map(),
  errors: new Map(),
  startTime: Date.now(),
};

function register(server, AgenticanaRoot) {
  const { formatResponse, formatError } = require("../lib/cache");

  // ── mcp_introspect ─────────────────────────────────────────────────────────
  server.tool(
    "mcp_introspect",
    "Get complete MCP server capabilities: all available tools, schemas, version info. Use this to understand what the MCP can do.",
    {},
    async () => {
      try {
        // Collect all registered tools
        const toolsDir = path.join(__dirname);
        const toolFiles = fs
          .readdirSync(toolsDir)
          .filter((f) => f.endsWith("-tools.js"));

        const allTools = [];
        for (const file of toolFiles) {
          try {
            const mod = require(path.join(toolsDir, file));
            if (mod.toolNames) {
              allTools.push({
                module: file.replace("-tools.js", ""),
                tools: mod.toolNames,
              });
            }
          } catch {
            /* skip */
          }
        }

        const packageJson = JSON.parse(
          fs.readFileSync(
            path.join(AgenticanaRoot, "mcp", "package.json"),
            "utf8",
          ),
        );

        return formatResponse({
          name: "Agenticana MCP",
          version: packageJson.version,
          capabilities: {
            tool_count: allTools.reduce((sum, m) => sum + m.tools.length, 0),
            modules: allTools,
            features: [
              "ReasoningBank (memory & learning)",
              "Model Router (cost optimization)",
              "Swarm Execution (multi-agent)",
              "Simulacrum Debate (consensus)",
              "Self-Evolution (auto-improvement)",
              "Governance (quality gates)",
              "Utilities (ADR, PoW, trimming)",
              "Meta-capabilities (introspection)",
            ],
          },
          transport: "stdio",
          node_version: process.version,
        });
      } catch (err) {
        return formatError(err, { tool: "mcp_introspect" });
      }
    },
  );

  // ── mcp_health ─────────────────────────────────────────────────────────────
  server.tool(
    "mcp_health",
    "Health check: verify Python availability, script accessibility, memory status. Use for diagnostics.",
    {
      verbose: z
        .boolean()
        .default(false)
        .describe("Include detailed diagnostics"),
    },
    async ({ verbose }) => {
      try {
        const checks = {
          python: false,
          scripts_dir: false,
          reasoning_bank: false,
          memory_file: false,
        };

        // Check Python
        try {
          execSync("python --version", { encoding: "utf-8", timeout: 3000 });
          checks.python = true;
        } catch {
          /* fail */
        }

        // Check scripts directory
        const scriptsDir = path.join(AgenticanaRoot, "scripts");
        checks.scripts_dir = fs.existsSync(scriptsDir);

        // Check reasoning bank
        const rbPath = path.join(AgenticanaRoot, "memory", "reasoning-bank");
        checks.reasoning_bank = fs.existsSync(rbPath);

        // Check memory file
        const memFile = path.join(AgenticanaRoot, "memory", "memory.json");
        checks.memory_file = fs.existsSync(memFile);

        const allHealthy = Object.values(checks).every(Boolean);

        const response = {
          status: allHealthy ? "HEALTHY" : "DEGRADED",
          checks,
          uptime_ms: Date.now() - telemetry.startTime,
          memory_usage: process.memoryUsage(),
        };

        if (verbose) {
          response.details = {
            node_version: process.version,
            platform: process.platform,
            Agenticana_root: AgenticanaRoot,
            cwd: process.cwd(),
          };
        }

        return formatResponse(response);
      } catch (err) {
        return formatError(err, { tool: "mcp_health" });
      }
    },
  );

  // ── mcp_telemetry ──────────────────────────────────────────────────────────
  server.tool(
    "mcp_telemetry",
    "Get usage statistics: most called tools, error rates, avg execution times. Use for performance monitoring.",
    {
      reset: z
        .boolean()
        .default(false)
        .describe("Reset counters after reading"),
    },
    async ({ reset }) => {
      try {
        const toolStats = Array.from(telemetry.toolCalls.entries())
          .map(([tool, count]) => ({ tool, count }))
          .sort((a, b) => b.count - a.count);

        const errorStats = Array.from(telemetry.errors.entries())
          .map(([tool, count]) => ({ tool, count }))
          .sort((a, b) => b.count - a.count);

        const totalCalls = Array.from(telemetry.toolCalls.values()).reduce(
          (sum, count) => sum + count,
          0,
        );

        const totalErrors = Array.from(telemetry.errors.values()).reduce(
          (sum, count) => sum + count,
          0,
        );

        const response = {
          uptime_seconds: Math.floor((Date.now() - telemetry.startTime) / 1000),
          total_tool_calls: totalCalls,
          total_errors: totalErrors,
          error_rate:
            totalCalls > 0 ? (totalErrors / totalCalls).toFixed(3) : 0,
          most_used_tools: toolStats.slice(0, 10),
          tools_with_errors: errorStats,
        };

        if (reset) {
          telemetry.toolCalls.clear();
          telemetry.errors.clear();
          telemetry.startTime = Date.now();
          response.note = "Telemetry counters reset";
        }

        return formatResponse(response);
      } catch (err) {
        return formatError(err, { tool: "mcp_telemetry" });
      }
    },
  );

  // ── mcp_discover ───────────────────────────────────────────────────────────
  server.tool(
    "mcp_discover",
    "Auto-discover new Python scripts in scripts/ directory that could be exposed as MCP tools. Suggests tool wrappers.",
    {
      auto_generate: z
        .boolean()
        .default(false)
        .describe("Auto-generate tool wrapper code (experimental)"),
    },
    async ({ auto_generate }) => {
      try {
        const scriptsDir = path.join(AgenticanaRoot, "scripts");
        const pyFiles = fs
          .readdirSync(scriptsDir)
          .filter((f) => f.endsWith(".py"));

        // Check which scripts have __main__ entry point
        const discoveredScripts = [];
        for (const file of pyFiles) {
          try {
            const content = fs.readFileSync(
              path.join(scriptsDir, file),
              "utf8",
            );
            if (
              content.includes('if __name__ == "__main__"') ||
              content.includes("def main(")
            ) {
              // Extract docstring if present
              const docMatch = content.match(/"""([\s\S]*?)"""/);
              const description = docMatch
                ? docMatch[1].split("\n")[0].trim()
                : "No description available";

              discoveredScripts.push({
                file,
                name: file.replace(".py", "").replace(/_/g, "-"),
                description,
                has_argparse: content.includes("argparse"),
              });
            }
          } catch {
            /* skip */
          }
        }

        // Filter out already exposed scripts
        const exposedScripts = [
          "reasoning_bank.py",
          "router_cli.py",
          "nl_swarm.py",
          "swarm_dispatcher.py",
          "swarm_status.py",
          "multi_model_simulacrum.py",
          "real_simulacrum.py",
          "evolve.py",
          "distill_patterns.py",
          "guardian_mode.py",
          "pow_commit.py",
          "adr_generator.py",
          "context_trimmer.py",
          "verify_all.py",
        ];

        const newDiscoveries = discoveredScripts.filter(
          (s) => !exposedScripts.includes(s.file),
        );

        const response = {
          scripts_scanned: pyFiles.length,
          discovered_count: newDiscoveries.length,
          new_scripts: newDiscoveries,
          suggestions:
            newDiscoveries.length > 0
              ? "Consider creating tool wrappers for high-value scripts"
              : "All major scripts are already exposed",
        };

        if (auto_generate && newDiscoveries.length > 0) {
          response.note = "Auto-generation not yet implemented";
          response.manual_steps = [
            "1. Create new tool module in mcp/tools/",
            "2. Import and register in server.js",
            "3. Test with sample invocations",
          ];
        }

        return formatResponse(response);
      } catch (err) {
        return formatError(err, { tool: "mcp_discover" });
      }
    },
  );

  // ── Telemetry Middleware ───────────────────────────────────────────────────
  // Hook into server to track tool calls (if SDK supports)
  // This would require MCP SDK hooks - placeholder for future
}

module.exports = { register, toolNames, telemetry };
