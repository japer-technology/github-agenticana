/**
 * Agenticana MCP — Evolution & Self-Improvement Tools
 *
 * Enables the MCP to trigger its own capability evolution:
 *   evolve_scan    — Scan for improvement opportunities
 *   evolve_apply   — Apply an evolution cycle
 *   distill_patterns — Extract reusable patterns from reasoning bank
 */

const { z } = require("zod");
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const toolNames = ["evolve_scan", "evolve_apply", "distill_patterns"];

function register(server, AgenticanaRoot) {
  const evolvePath = path.join(AgenticanaRoot, "scripts", "evolve.py");
  const distillPath = path.join(
    AgenticanaRoot,
    "scripts",
    "distill_patterns.py",
  );

  function runPython(scriptPath, args, timeout = 60000) {
    try {
      const result = execSync(`python "${scriptPath}" ${args}`, {
        encoding: "utf-8",
        cwd: AgenticanaRoot,
        timeout,
        maxBuffer: 1024 * 1024 * 5,
      });
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
        hint: "Evolution requires full Agenticana installation with write access",
      };
    }
  }

  // ── evolve_scan ────────────────────────────────────────────────────────────
  server.tool(
    "evolve_scan",
    "Scan Agenticana for improvement opportunities: unused patterns, missing capabilities, optimization gaps. Use this regularly to identify self-improvement areas.",
    {
      scope: z
        .enum(["mcp", "agents", "skills", "router", "all"])
        .default("all")
        .describe("Scan scope: which subsystem to analyze"),
      depth: z
        .enum(["quick", "normal", "deep"])
        .default("normal")
        .describe("Analysis depth"),
    },
    async ({ scope, depth }) => {
      const args = [
        "scan",
        `--scope ${scope}`,
        `--depth ${depth}`,
        "--json",
      ].join(" ");

      const result = runPython(evolvePath, args, 30000);

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
                scan_timestamp: new Date().toISOString(),
                scope,
                opportunities: result.opportunities || [],
                unused_patterns: result.unused_patterns || [],
                missing_capabilities: result.missing_capabilities || [],
                optimization_suggestions: result.optimizations || [],
                priority_score: result.priority_score,
                next_step:
                  result.opportunities?.length > 0
                    ? "Use evolve_apply to implement top-priority improvements"
                    : "No critical improvements detected",
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // ── evolve_apply ───────────────────────────────────────────────────────────
  server.tool(
    "evolve_apply",
    "Apply an evolution cycle: implement detected improvements. This is SELF-MODIFICATION - the MCP will update its own capabilities. Use with caution.",
    {
      target_area: z
        .string()
        .optional()
        .describe(
          'Specific area to evolve (e.g., "mcp-tools", "router-logic"), or omit for auto-select',
        ),
      auto_approve: z
        .boolean()
        .default(false)
        .describe(
          "Auto-approve changes without manual review (DANGEROUS - use only for minor improvements)",
        ),
      dryrun: z
        .boolean()
        .default(true)
        .describe(
          "Dry-run mode: plan changes but don't apply (default true for safety)",
        ),
    },
    async ({ target_area, auto_approve, dryrun }) => {
      const args = [
        "apply",
        target_area ? `--target "${target_area}"` : "",
        auto_approve ? "--auto-approve" : "",
        dryrun ? "--dryrun" : "--execute",
        "--json",
      ]
        .filter(Boolean)
        .join(" ");

      const result = runPython(evolvePath, args, 120000);

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

      // Log evolution to reasoning bank if successful
      if (!dryrun && result.changes_applied) {
        const rbPath = path.join(
          AgenticanaRoot,
          "scripts",
          "reasoning_bank.py",
        );
        try {
          execSync(
            `python "${rbPath}" record --task "Self-evolution cycle" --decision "${result.summary}" --outcome "Applied ${result.changes_applied} changes" --success true --agent "evolution-system" --tags evolution self-improvement`,
            { cwd: AgenticanaRoot, timeout: 5000 },
          );
        } catch {
          // Silent fail - evolution succeeded, logging is secondary
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                status: dryrun ? "plan-ready" : "applied",
                mode: dryrun ? "DRY-RUN" : "LIVE",
                changes_applied: result.changes_applied || 0,
                changes_planned: result.changes_planned || 0,
                summary: result.summary,
                files_modified: result.files_modified || [],
                new_capabilities: result.new_capabilities || [],
                rollback_available: result.rollback_point || null,
                warnings: result.warnings || [],
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // ── distill_patterns ───────────────────────────────────────────────────────
  server.tool(
    "distill_patterns",
    "Extract recurring patterns from the ReasoningBank and create reusable skills/templates. Run this after accumulating 10+ successful decisions.",
    {
      min_confidence: z
        .number()
        .min(0)
        .max(1)
        .default(0.7)
        .describe("Minimum confidence threshold for pattern extraction (0-1)"),
      min_occurrences: z
        .number()
        .int()
        .min(2)
        .max(20)
        .default(3)
        .describe("Minimum times a pattern must appear to be considered"),
      target: z
        .enum(["skills", "router", "agents", "all"])
        .default("skills")
        .describe("Where to apply extracted patterns"),
    },
    async ({ min_confidence, min_occurrences, target }) => {
      const args = [
        `--confidence ${min_confidence}`,
        `--occurrences ${min_occurrences}`,
        `--target ${target}`,
        "--json",
      ].join(" ");

      const result = runPython(distillPath, args, 45000);

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
                patterns_extracted: result.patterns_count || 0,
                patterns: result.patterns || [],
                applied_to: target,
                new_skills_created: result.skills_created || 0,
                router_rules_added: result.router_rules || 0,
                reasoning_bank_entries_analyzed: result.entries_analyzed || 0,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );
}

module.exports = { register, toolNames };
