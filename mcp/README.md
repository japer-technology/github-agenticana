# Agenticana MCP Server v3.0 🦅

**Secretary Bird Edition** — Self-evolving AI agent platform with 31+ tools

[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)](https://github.com/yourusername/Agenticana)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## What is This?

An MCP (Model Context Protocol) server that exposes the full power of Agenticana — a sovereign AI developer OS with memory, routing, swarm execution, logic debate, and **self-evolution**.

Think of it as giving your AI assistant superpowers: multi-agent coordination, cross-model debates, automatic learning from past work, and the ability to improve itself.

---

## 🚀 Features

### 31+ Tools Across 9 Categories

| Category          | Tools   | Purpose                                       |
| ----------------- | ------- | --------------------------------------------- |
| **ReasoningBank** | 3 tools | Learn from past decisions, retrieve patterns  |
| **Router**        | 2 tools | Optimize model selection & cost               |
| **Memory**        | 3 tools | Persistent key-value storage                  |
| **Agents**        | 3 tools | List & inspect 20 specialist agents           |
| **Swarm**         | 3 tools | Execute multi-agent parallel/sequential tasks |
| **Simulacrum**    | 2 tools | Cross-model debate & consensus                |
| **Evolution**     | 3 tools | **Self-improvement & pattern extraction**     |
| **Utilities**     | 5 tools | Quality gates, PoW commits, ADR, audits       |
| **Meta**          | 4 tools | Introspection, health checks, telemetry       |

### Key Capabilities

✅ **Self-Evolution** — The MCP can scan for improvements and upgrade itself
✅ **Swarm Execution** — Run 3+ agents in parallel on complex tasks
✅ **Simulacrum Debate** — Multi-model consensus before architecture decisions
✅ **ReasoningBank** — Learn from every task, never solve the same problem twice
✅ **Model Router** — Auto-select cheapest/fastest model for each task
✅ **Quality Gates** — Guardian mode blocks bad commits
✅ **PoW Commits** — Cryptographic proof of work for important changes
✅ **Full Audit** — Scan entire codebase for compliance

---

## 📦 Installation

### 1. Prerequisites

- **Node.js** ≥ 20.0.0
- **Python** ≥ 3.10 (for backend scripts)
- MCP-compatible host (Claude Desktop, Claude Code, etc.)

### 2. Install Dependencies

```bash
cd mcp
npm install
```

### 3. Configure MCP Host

#### For Claude Desktop

Edit `~/.claude_desktop_config.json` (macOS/Linux) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "Agenticana": {
      "command": "node",
      "args": ["C:\\Users\\YourName\\_Projects\\Agentica\\mcp\\server.js"]
    }
  }
}
```

#### For VS Code (Copilot Chat)

Add to `.vscode/settings.json`:

```json
{
  "github.copilot.chat.mcp.servers": {
    "Agenticana": {
      "command": "node",
      "args": ["./mcp/server.js"]
    }
  }
}
```

### 4. Restart Your MCP Host

Tools will appear automatically in the tool picker.

---

## 🎯 Quick Start

### Example 1: Check What's Available

**Tool:** `mcp_introspect`

```json
{}
```

**Returns:** All 31 tools, version, capabilities

---

### Example 2: Execute a Multi-Agent Swarm

**Step 1 — Parse Natural Language**

**Tool:** `swarm_parse`

```json
{
  "task": "Add JWT authentication to our Express API, write unit tests, and audit security",
  "mode": "sequential"
}
```

**Returns:** JSON manifest with 3 agents selected (backend-specialist, test-engineer, security-auditor)

**Step 2 — Execute the Swarm**

**Tool:** `swarm_dispatch`

```json
{
  "manifest": { ... },
  "mode": "sequential",
  "shadow": false
}
```

**Returns:** Execution results from all 3 agents

---

### Example 3: Run a Cross-Model Debate

**Tool:** `simulacrum_debate`

```json
{
  "question": "Should we use microservices or monolith for this 3-person startup?",
  "models": ["gpt-4", "claude-3-opus", "gemini-pro"],
  "rounds": 2,
  "format": "summary"
}
```

**Returns:** Consensus decision with reasoning + dissenting views

---

### Example 4: Self-Evolution Cycle

**Step 1 — Scan for Improvements**

**Tool:** `evolve_scan`

```json
{
  "scope": "mcp",
  "depth": "normal"
}
```

**Returns:** List of improvement opportunities

**Step 2 — Apply Evolution (Dry-Run)**

**Tool:** `evolve_apply`

```json
{
  "target_area": "mcp-tools",
  "dryrun": true,
  "auto_approve": false
}
```

**Returns:** Planned changes (no files modified yet)

**Step 3 — Execute Evolution** ⚠️

```json
{
  "target_area": "mcp-tools",
  "dryrun": false,
  "auto_approve": true
}
```

**Returns:** Applied changes + rollback point

---

## 📚 Tool Reference

### ReasoningBank Tools

#### `reasoningbank_retrieve`

Query past agent decisions. Use **before** planning.

**Params:**

- `query` (string) — Task description
- `k` (number, default 5) — Number of results

#### `reasoningbank_record`

Store a new decision. Use **after** completing a task.

**Params:**

- `task`, `decision`, `outcome`, `success`, `agent`, `tags`

#### `reasoningbank_distill`

Extract recurring patterns.

---

### Swarm Tools

#### `swarm_parse`

Convert natural language to swarm manifest.

#### `swarm_dispatch`

Execute swarm (parallel or sequential).

#### `swarm_status`

Check swarm progress.

---

### Evolution Tools ⚠️

#### `evolve_scan`

Scan for improvement opportunities.

#### `evolve_apply`

**Self-modify the MCP.** Use dryrun first!

#### `distill_patterns`

Extract patterns from ReasoningBank.

---

### Meta Tools

#### `mcp_introspect`

Get all capabilities.

#### `mcp_health`

Health check + diagnostics.

#### `mcp_telemetry`

Usage statistics.

#### `mcp_discover`

Auto-discover new scripts.

---

## ⚙️ Configuration

### Environment Variables

```bash
# Optional: override memory file location
export Agenticana_MEMORY_FILE="/path/to/custom/memory.json"

# Optional: set log level
export Agenticana_LOG_LEVEL="debug"
```

### Cache Settings

Caching is automatic. Adjust in `mcp/lib/cache.js`:

```javascript
const globalCache = new LRUCache(50, 5 * 60 * 1000); // 50 items, 5min TTL
```

---

## 🧪 Testing

```bash
npm test  # Coming soon
```

Manual test:

```bash
node server.js --test
```

---

## 🛠️ Development

### Add a New Tool

1. Create `mcp/tools/your-category-tools.js`
2. Export `{ register, toolNames }`
3. Import in `server.js`
4. Register: `yourTools.register(server, Agenticana_ROOT)`

### Debug Mode

```bash
NODE_ENV=development node server.js
```

---

## 🔒 Security

- All Python scripts are executed in the Agenticana workspace
- Input sanitization via Zod schemas
- No `eval()` or `exec()` of user input
- File paths validated before access
- Evolution tools default to `dryrun: true`

---

## 📈 Performance

- **Tool invocation:** <500ms avg (excluding Python execution)
- **Cache hit rate:** ~70% for `agent_list`, `skill_list`
- **Memory usage:** <50MB base + tool execution
- **Concurrent tools:** Up to 10 (stdio transport limit)

---

## 🐛 Troubleshooting

### "Python not found"

**Fix:** Ensure Python 3.10+ is in PATH

```bash
python --version  # Should show 3.10+
```

### "Script timeout"

**Fix:** Increase timeout in tool definition

```javascript
runPython(scriptPath, args, 60000); // 60s
```

### "Permission denied"

**Fix:** Check file permissions

```bash
chmod +x scripts/*.py
```

---

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

---

## 📄 License

MIT — See [LICENSE](../LICENSE)

---

## 🦅 About Secretary Bird

The Secretary Bird is a raptor that stomps on snakes with precision. It observes, calculates, then strikes with overwhelming force.

Agenticana v3 embodies this:
**Observe** (reasoningbank_retrieve)
**Calculate** (router_route)
**Strike** (swarm_dispatch)

---

## 🤝 Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md)

---

## 🔗 Links

- [Main Documentation](../README.md)
- [Architecture](../ARCHITECTURE.md)
- [Roadmap](../ROADMAP.md)
- [How to Use on Your Project](../HOW-TO-USE-ON-YOUR-PROJECT.md)

---

**Made with 🦅 by the Agenticana community**
