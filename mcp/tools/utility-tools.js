/**
 * Agenticana MCP — Utility & Governance Tools
 *
 * Essential operations for quality, security, and documentation:
 *   guardian_check  — Pre-commit quality gate
 *   pow_sign        — Proof-of-work commit signing
 *   adr_create      — Generate architecture decision record
 *   context_trim    — Token-aware file trimming
 *   audit_full      — Complete system audit
 */

const { z } = require("zod");
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const toolNames = [
  "guardian_check",
  "pow_sign",
  "adr_create",
  "context_trim",
  "audit_full",
];

function register(server, AgenticanaRoot) {
  const guardianPath = path.join(AgenticanaRoot, "scripts", "guardian_mode.py");
  const powPath = path.join(AgenticanaRoot, "scripts", "pow_commit.py");
  const adrPath = path.join(AgenticanaRoot, "scripts", "adr_manual.py");
  const trimPath = path.join(AgenticanaRoot, "scripts", "context_trimmer.py");
  const auditPath = path.join(AgenticanaRoot, "scripts", "verify_all.py");

  function runPython(scriptPath, args, timeout = 30000) {
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
      };
    }
  }

  // ── guardian_check ─────────────────────────────────────────────────────────
  server.tool(
    "guardian_check",
    "Run pre-commit quality gate: checks for blockers, security issues, test coverage. Use before any commit to ensure quality standards.",
    {
      strict: z
        .boolean()
        .default(false)
        .describe("Strict mode: treat warnings as errors"),
      scope: z
        .enum(["staged", "all", "modified"])
        .default("staged")
        .describe("Files to check"),
    },
    async ({ strict, scope }) => {
      const args = [
        "status",
        strict ? "--strict" : "",
        `--scope ${scope}`,
        "--json",
      ]
        .filter(Boolean)
        .join(" ");

      const result = runPython(guardianPath, args, 45000);

      if (result.error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "check-failed",
                  error: result.error,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      const approved =
        (result.blockers || 0) === 0 &&
        (!strict || (result.warnings || 0) === 0);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                status: approved ? "APPROVED" : "BLOCKED",
                blockers: result.blockers || 0,
                warnings: result.warnings || 0,
                checks_passed: result.checks_passed || 0,
                checks_total: result.checks_total || 0,
                issues: result.issues || [],
                recommendation: approved
                  ? "Safe to commit"
                  : `Fix ${result.blockers} blocker(s) before commit`,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // ── pow_sign ───────────────────────────────────────────────────────────────
  server.tool(
    "pow_sign",
    "Sign work with proof-of-work commit. Adds cryptographic proof of computational effort to commit message.",
    {
      message: z.string().describe("Commit message"),
      difficulty: z
        .number()
        .int()
        .min(1)
        .max(6)
        .default(4)
        .describe("PoW difficulty (1-6, higher = more effort)"),
      auto_commit: z
        .boolean()
        .default(false)
        .describe("Auto-commit after signing (requires git repo)"),
    },
    async ({ message, difficulty, auto_commit }) => {
      const args = [
        "sign",
        `--message "${message.replace(/"/g, '\\"')}"`,
        `--difficulty ${difficulty}`,
        auto_commit ? "--commit" : "--no-commit",
        "--json",
      ].join(" ");

      const result = runPython(powPath, args, difficulty * 15000 + 5000);

      if (result.error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "error",
                  error: result.error,
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
                status: "signed",
                commit_hash: result.commit_hash,
                pow_nonce: result.nonce,
                pow_hash: result.hash,
                attempts: result.attempts,
                time_seconds: result.time_seconds,
                committed: auto_commit,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // ── adr_create ─────────────────────────────────────────────────────────────
  server.tool(
    "adr_create",
    "Generate an Architecture Decision Record (ADR). Use after making significant architectural choices to document the reasoning.",
    {
      title: z
        .string()
        .describe('ADR title (e.g., "Use PostgreSQL for primary database")'),
      context: z.string().describe("The context or problem being addressed"),
      decision: z.string().describe("The decision made"),
      consequences: z
        .string()
        .describe("Expected consequences (positive and negative)"),
      alternatives: z
        .array(z.string())
        .optional()
        .describe("Alternative options considered"),
      status: z
        .enum(["proposed", "accepted", "deprecated", "superseded"])
        .default("accepted")
        .describe("ADR status"),
    },
    async ({
      title,
      context,
      decision,
      consequences,
      alternatives,
      status,
    }) => {
      const altArgs = alternatives?.length
        ? alternatives
            .map((a) => `--alternative "${a.replace(/"/g, '\\"')}"`)
            .join(" ")
        : "";

      const args = [
        `--title "${title.replace(/"/g, '\\"')}"`,
        `--context "${context.replace(/"/g, '\\"')}"`,
        `--decision "${decision.replace(/"/g, '\\"')}"`,
        `--consequences "${consequences.replace(/"/g, '\\"')}"`,
        altArgs,
        `--status ${status}`,
        "--json",
      ]
        .filter(Boolean)
        .join(" ");

      const result = runPython(adrPath, args);

      if (result.error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "error",
                  error: result.error,
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
                status: "created",
                adr_number: result.adr_number,
                adr_path: result.file_path,
                title,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // ── context_trim ───────────────────────────────────────────────────────────
  server.tool(
    "context_trim",
    "Trim file content to fit token budget while preserving relevant sections. Use when file is too large for context window.",
    {
      file_path: z
        .string()
        .describe("Path to file to trim (relative to workspace root)"),
      pattern: z
        .string()
        .describe("Search pattern to focus on (regex supported)"),
      max_lines: z
        .number()
        .int()
        .min(10)
        .max(1000)
        .default(80)
        .describe("Maximum lines to return"),
      all_matches: z
        .boolean()
        .default(true)
        .describe("Include all pattern matches or just first"),
    },
    async ({ file_path, pattern, max_lines, all_matches }) => {
      const fullPath = path.isAbsolute(file_path)
        ? file_path
        : path.join(AgenticanaRoot, file_path);

      if (!fs.existsSync(fullPath)) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "error",
                  error: `File not found: ${file_path}`,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      const args = [
        `"${fullPath}"`,
        `"${pattern.replace(/"/g, '\\"')}"`,
        max_lines,
        all_matches ? "--all-matches" : "",
        "--json",
      ]
        .filter(Boolean)
        .join(" ");

      const result = runPython(trimPath, args);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                status: "success",
                file: file_path,
                pattern,
                lines_returned: result.lines_count || 0,
                matches_found: result.matches || 0,
                content: result.trimmed_content || result.output,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // ── audit_full ─────────────────────────────────────────────────────────────
  server.tool(
    "audit_full",
    "Run complete Agenticana system audit: check all agents, skills, scripts for compliance and issues.",
    {
      scope: z
        .enum(["agents", "skills", "scripts", "mcp", "all"])
        .default("all")
        .describe("Audit scope"),
      fix: z.boolean().default(false).describe("Auto-fix minor issues"),
    },
    async ({ scope, fix }) => {
      const args = [
        ".",
        `--scope ${scope}`,
        fix ? "--fix" : "--no-fix",
        "--json",
      ].join(" ");

      const result = runPython(auditPath, args, 90000);

      if (result.error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "audit-failed",
                  error: result.error,
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
                status: "completed",
                scope,
                issues_found: result.issues_count || 0,
                issues_fixed: fix ? result.fixed_count || 0 : 0,
                compliance_score: result.compliance_score || 0,
                issues: result.issues || [],
                recommendations: result.recommendations || [],
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
