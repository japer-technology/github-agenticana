/**
 * Agenticana v3 — MCP Server (Secretary Bird Edition)
 *
 * Exposes Agenticana capabilities as MCP tools usable in any MCP-compatible host.
 * Supports both stdio transport (Claude Desktop) and HTTP.
 *
 * Tools exposed (31+ total):
 *   ReasoningBank:  reasoningbank_retrieve, reasoningbank_record, reasoningbank_distill
 *   Router:         router_route, router_stats
 *   Memory:         memory_store, memory_search, memory_consolidate
 *   Agents:         agent_list, agent_get, skill_list
 *   Swarm:          swarm_parse, swarm_dispatch, swarm_status
 *   Simulacrum:     simulacrum_debate, simulacrum_quick
 *   Evolution:      evolve_scan, evolve_apply, distill_patterns
 *   Utilities:      guardian_check, pow_sign, adr_create, context_trim, audit_full
 *   Meta:           mcp_introspect, mcp_health, mcp_telemetry, mcp_discover
 *
 * Usage:
 *   node mcp/server.js          → default stdio transport
 *   node mcp/server.js --http   → HTTP transport on port 3737
 *
 * Claude Desktop config (~/.claude_desktop_config.json):
 *   "mcpServers": {
 *     "Agenticana": {
 *       "command": "node",
 *       "args": ["path/to/AGENTICANA/mcp/server.js"]
 *     }
 *   }
 */

const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const {
  StdioServerTransport,
} = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");
const path = require("path");
const fs = require("fs");

const Agenticana_ROOT = path.join(__dirname, "..");

// ── Register all tool modules ─────────────────────────────────────────────────
const reasoningBankTools = require("./tools/reasoning-bank-tools");
const routerTools = require("./tools/router-tools");
const memoryTools = require("./tools/memory-tools");
const agentTools = require("./tools/agent-tools");
const swarmTools = require("./tools/swarm-tools");
const simulacrumTools = require("./tools/simulacrum-tools");
const evolutionTools = require("./tools/evolution-tools");
const utilityTools = require("./tools/utility-tools");
const metaTools = require("./tools/meta-tools");

// ── Create MCP Server ─────────────────────────────────────────────────────────
const server = new McpServer({
  name: "Agenticana",
  version: "3.0.0",
});

// ── Register tool groups ──────────────────────────────────────────────────────
reasoningBankTools.register(server, Agenticana_ROOT);
routerTools.register(server, Agenticana_ROOT);
memoryTools.register(server, Agenticana_ROOT);
agentTools.register(server, Agenticana_ROOT);
swarmTools.register(server, Agenticana_ROOT);
simulacrumTools.register(server, Agenticana_ROOT);
evolutionTools.register(server, Agenticana_ROOT);
utilityTools.register(server, Agenticana_ROOT);
metaTools.register(server, Agenticana_ROOT);

// ── Start transport ───────────────────────────────────────────────────────────
async function main() {
  const useHttp = process.argv.includes("--http");

  if (useHttp) {
    // HTTP transport (future: StreamableHTTP)
    console.error(
      "[Agenticana MCP] HTTP transport not yet implemented, falling back to stdio",
    );
  }

  // Default: stdio transport (works with Claude Desktop and Claude Code)
  const transport = new StdioServerTransport();
  await server.connect(transport);

  const allToolNames = [
    ...reasoningBankTools.toolNames,
    ...routerTools.toolNames,
    ...memoryTools.toolNames,
    ...agentTools.toolNames,
    ...swarmTools.toolNames,
    ...simulacrumTools.toolNames,
    ...evolutionTools.toolNames,
    ...utilityTools.toolNames,
    ...metaTools.toolNames,
  ];

  console.error(`[Agenticana MCP v3.0] 🦅 Secretary Bird Edition`);
  console.error(`[Agenticana MCP] Server started on stdio`);
  console.error(`[Agenticana MCP] Tools registered: ${allToolNames.length}`);
  console.error(
    `[Agenticana MCP] Capabilities: ReasoningBank, Router, Memory, Agents, Swarm, Simulacrum, Evolution, Utilities, Meta`,
  );
}

main().catch((err) => {
  console.error("[Agenticana MCP] Fatal error:", err);
  process.exit(1);
});
