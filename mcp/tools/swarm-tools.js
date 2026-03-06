/**
 * Agenticana MCP — Swarm Execution Tools
 *
 * Provides multi-agent parallel/sequential task execution capabilities:
 *   swarm_parse    — Convert natural language to swarm manifest
 *   swarm_dispatch — Execute a swarm manifest (parallel or sequential)
 *   swarm_status   — Check ongoing swarm execution status
 */

const { z } = require("zod");
const { execSync, spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const toolNames = ["swarm_parse", "swarm_dispatch", "swarm_status"];

// Track active swarms
const activeSwarms = new Map();

function register(server, AgenticanaRoot) {
  const nlSwarmPath = path.join(AgenticanaRoot, "scripts", "nl_swarm.py");
  const dispatcherPath = path.join(
    AgenticanaRoot,
    "scripts",
    "swarm_dispatcher.py",
  );
  const statusPath = path.join(AgenticanaRoot, "scripts", "swarm_status.py");

  function runPython(scriptPath, args, timeout = 30000) {
    try {
      const result = execSync(`python "${scriptPath}" ${args}`, {
        encoding: "utf-8",
        cwd: AgenticanaRoot,
        timeout,
        maxBuffer: 1024 * 1024 * 5, // 5MB buffer
      });
      // Try to parse as JSON, fallback to raw text
      try {
        return JSON.parse(result);
      } catch {
        return { output: result };
      }
    } catch (err) {
      return {
        error: err.message,
        stderr: err.stderr,
        code: err.code,
        hint: "Check that Python and required dependencies are installed",
      };
    }
  }

  // ── swarm_parse ────────────────────────────────────────────────────────────
  server.tool(
    "swarm_parse",
    'Parse natural language task description into a swarm manifest with auto-selected agents. Use this to convert "Add auth and write tests" into structured agent tasks.',
    {
      task: z
        .string()
        .describe(
          'Natural language task description (e.g., "Add auth to Django app, audit it, and write tests")',
        ),
      mode: z
        .enum(["parallel", "sequential"])
        .default("parallel")
        .describe(
          "Execution mode: parallel (concurrent) or sequential (one-by-one)",
        ),
    },
    async ({ task, mode }) => {
      const args = `"${task.replace(/"/g, '\\"')}" --mode ${mode} --json`;
      const result = runPython(nlSwarmPath, args);

      if (result.error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "error",
                  error: result.error,
                  hint: result.hint,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                status: "success",
                manifest: result,
                next_step: "Use swarm_dispatch with this manifest to execute",
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // ── swarm_dispatch ─────────────────────────────────────────────────────────
  server.tool(
    "swarm_dispatch",
    "Execute a swarm manifest with multiple agents in parallel or sequential mode. Returns execution results from all agents.",
    {
      manifest: z
        .union([
          z.string().describe("Path to manifest JSON file"),
          z.object({}).passthrough().describe("Inline manifest object"),
        ])
        .describe("Swarm manifest (from swarm_parse or custom)"),
      mode: z
        .enum(["parallel", "sequential"])
        .default("parallel")
        .describe("Execution mode"),
      shadow: z
        .boolean()
        .default(false)
        .describe("Shadow mode: plan only, no execution"),
      timeout: z
        .number()
        .int()
        .min(10)
        .max(600)
        .default(180)
        .describe("Timeout in seconds per agent"),
    },
    async ({ manifest, mode, shadow, timeout }) => {
      // Handle manifest as string (file path) or object
      let manifestPath;
      if (typeof manifest === "string") {
        manifestPath = path.isAbsolute(manifest)
          ? manifest
          : path.join(AgenticanaRoot, manifest);
        if (!fs.existsSync(manifestPath)) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    status: "error",
                    error: `Manifest file not found: ${manifestPath}`,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }
      } else {
        // Write inline manifest to temp file
        manifestPath = path.join(
          AgenticanaRoot,
          ".agenticana",
          "tmp",
          `swarm-${Date.now()}.json`,
        );
        fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      }

      const args = [
        `"${manifestPath}"`,
        `--mode ${mode}`,
        shadow ? "--shadow" : "",
        `--timeout ${timeout}`,
        "--json",
      ]
        .filter(Boolean)
        .join(" ");

      const result = runPython(dispatcherPath, args, timeout * 1000 + 10000);

      // Store swarm info for status tracking
      if (result.swarm_id) {
        activeSwarms.set(result.swarm_id, {
          startTime: Date.now(),
          mode,
          manifest: manifestPath,
          status: result.status || "running",
        });
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                status: result.error ? "error" : "success",
                ...result,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // ── swarm_status ───────────────────────────────────────────────────────────
  server.tool(
    "swarm_status",
    "Check the status of an ongoing or completed swarm execution. Returns progress, completed tasks, and pending tasks.",
    {
      swarm_id: z
        .string()
        .optional()
        .describe("Swarm ID to check (omit for latest)"),
    },
    async ({ swarm_id }) => {
      const args = swarm_id ? `--id "${swarm_id}"` : "--latest";
      const result = runPython(statusPath, args, 5000);

      // Merge with local tracking if available
      if (swarm_id && activeSwarms.has(swarm_id)) {
        const localInfo = activeSwarms.get(swarm_id);
        result.local_tracking = {
          started: new Date(localInfo.startTime).toISOString(),
          mode: localInfo.mode,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );
}

module.exports = { register, toolNames };
