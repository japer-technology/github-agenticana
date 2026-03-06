/**
 * Agenticana MCP — Simulacrum (Debate) Tools
 *
 * Enables cross-model logic debate for architecture decisions:
 *   simulacrum_debate — Multi-round debate across different models
 *   simulacrum_quick  — Fast single-round consensus check
 */

const { z } = require("zod");
const { execSync } = require("child_process");
const path = require("path");

const toolNames = ["simulacrum_debate", "simulacrum_quick"];

function register(server, AgenticanaRoot) {
  const multiModelPath = path.join(
    AgenticanaRoot,
    "scripts",
    "multi_model_simulacrum.py",
  );
  const quickConsensusPath = path.join(
    AgenticanaRoot,
    "scripts",
    "quick_consensus.py",
  );

  function runPython(scriptPath, args, timeout = 60000) {
    try {
      const result = execSync(`python "${scriptPath}" ${args}`, {
        encoding: "utf-8",
        cwd: AgenticanaRoot,
        timeout,
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer for debate transcripts
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
        hint: "Ensure API keys are configured for the requested models",
      };
    }
  }

  // ── simulacrum_debate ──────────────────────────────────────────────────────
  server.tool(
    "simulacrum_debate",
    "Run a multi-model debate on an architecture question. Models debate across rounds to reach consensus. Use before major architectural decisions or when exploring complex tradeoffs.",
    {
      question: z
        .string()
        .describe(
          'The architecture question or decision to debate (e.g., "Should we use microservices or monolith?")',
        ),
      models: z
        .array(z.string())
        .default(["gpt-4", "claude-3-opus", "gemini-pro"])
        .describe("Array of model names to participate in debate"),
      rounds: z
        .number()
        .int()
        .min(1)
        .max(5)
        .default(2)
        .describe("Number of debate rounds (1-5)"),
      format: z
        .enum(["full", "summary", "decision-only"])
        .default("summary")
        .describe(
          "Output format: full transcript, summary, or just the final decision",
        ),
    },
    async ({ question, models, rounds, format }) => {
      const modelsArg = models.map((m) => `--model "${m}"`).join(" ");
      const args = [
        `"${question.replace(/"/g, '\\"')}"`,
        modelsArg,
        `--rounds ${rounds}`,
        `--format ${format}`,
        "--json",
      ].join(" ");

      const result = runPython(multiModelPath, args, rounds * 30000 + 10000);

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
                question,
                models_participated: models.length,
                rounds_completed: result.rounds_completed || rounds,
                consensus_score: result.consensus_score,
                final_decision: result.decision,
                reasoning: result.reasoning,
                dissenting_views: result.dissenting_views || [],
                full_transcript:
                  format === "full" ? result.transcript : undefined,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // ── simulacrum_quick ───────────────────────────────────────────────────────
  server.tool(
    "simulacrum_quick",
    "Fast single-round consensus check on a decision. Use when you have a proposed solution and want quick validation from multiple perspectives.",
    {
      question: z.string().describe("The question or context"),
      decision: z
        .string()
        .describe("The proposed decision or approach to validate"),
      perspectives: z
        .array(z.string())
        .default(["security", "performance", "maintainability"])
        .describe("Evaluation perspectives to check"),
    },
    async ({ question, decision, perspectives }) => {
      const perspectivesArg = perspectives
        .map((p) => `--perspective "${p}"`)
        .join(" ");
      const args = [
        `"${question.replace(/"/g, '\\"')}"`,
        `"${decision.replace(/"/g, '\\"')}"`,
        perspectivesArg,
        "--json",
      ].join(" ");

      const result = runPython(quickConsensusPath, args, 20000);

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

      // Calculate agreement score
      const agreementScore =
        result.agreement_score ||
        (result.approvals || 0) / (perspectives.length || 1);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                status: "success",
                question,
                proposed_decision: decision,
                agreement_score: agreementScore,
                recommendation:
                  agreementScore >= 0.7
                    ? "APPROVED"
                    : agreementScore >= 0.5
                      ? "REVIEW"
                      : "REJECTED",
                perspectives_checked: perspectives,
                concerns: result.concerns || [],
                improvements: result.improvements || [],
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
