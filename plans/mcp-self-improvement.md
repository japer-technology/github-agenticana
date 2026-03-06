# Agenticana MCP Self-Improvement Plan

**Created:** 2026-03-06
**Status:** In Progress
**Agent:** orchestrator
**Goal:** Enhance MCP server with self-evolution, swarm execution, and advanced capabilities

## Current State Analysis

### Existing Tools (11 total)

1. **ReasoningBank Tools (3)**
   - `reasoningbank_retrieve` — Query past decisions
   - `reasoningbank_record` — Store new decisions
   - `reasoningbank_distill` — Extract patterns

2. **Router Tools (2)**
   - `router_route` — Get model recommendation
   - `router_stats` — View router config

3. **Memory Tools (3)**
   - `memory_store` — Persist key/value data
   - `memory_search` — Search memory entries
   - `memory_consolidate` — Prune stale entries

4. **Agent Tools (3)**
   - `agent_list` — List all agents
   - `agent_get` — Get agent specification
   - `skill_list` — List available skills

### Available Scripts Not Yet Exposed

- `agentica_cli.py` — Main CLI orchestrator
- `nl_swarm.py` — Natural language to swarm manifest
- `swarm_dispatcher.py` — Execute multi-agent swarms
- `multi_model_simulacrum.py` — Cross-model debate system
- `evolve.py` — Self-evolution cycle
- `guardian_mode.py` — Git guardian and quality gate
- `pow_commit.py` — Proof-of-work commit signing
- `adr_generator.py` — Architecture decision records
- `context_trimmer.py` — Token-aware file trimming
- `sentinel.py` — Watchdog for long-running tasks
- `sovereign_intel.py` — Competitor analysis
- `verify_all.py` — Full system audit

---

## Phase 1: Add Swarm Execution Tools ⚡

**Purpose:** Enable multi-agent parallel/sequential task execution from MCP

### New Tools

1. **`swarm_parse`** — Convert natural language to swarm manifest
   - Input: task description
   - Output: JSON manifest with selected agents and task breakdown
   - Uses: `nl_swarm.py`

2. **`swarm_dispatch`** — Execute a swarm manifest
   - Input: manifest (JSON or file path), mode (parallel/sequential)
   - Output: Execution results with agent outputs
   - Uses: `swarm_dispatcher.py`

3. **`swarm_status`** — Check ongoing swarm execution
   - Input: swarm_id
   - Output: Progress, completed tasks, pending tasks
   - Uses: `swarm_status.py`

### Implementation Files

- Create: `mcp/tools/swarm-tools.js`
- Tools: 3 new tools
- Estimated lines: ~200

---

## Phase 2: Add Simulacrum (Debate) Tools 🎭

**Purpose:** Enable multi-model logic debate before major decisions

### New Tools

1. **`simulacrum_debate`** — Run cross-model debate on architecture question
   - Input: question, models (array), rounds (default 2)
   - Output: Debate transcript + synthesized conclusion
   - Uses: `multi_model_simulacrum.py`

2. **`simulacrum_quick`** — Fast single-round consensus check
   - Input: question, decision
   - Output: Agreement score (0-1) + dissenting views
   - Uses: `real_simulacrum.py`

### Implementation Files

- Create: `mcp/tools/simulacrum-tools.js`
- Tools: 2 new tools
- Estimated lines: ~150

---

## Phase 3: Add Evolution & Self-Improvement Tools 🧬

**Purpose:** Enable the MCP to trigger its own capability evolution

### New Tools

1. **`evolve_scan`** — Scan for improvement opportunities
   - Input: scope (mcp|agents|skills|all)
   - Output: List of detected gaps, unused patterns, optimization opportunities
   - Uses: `evolve.py scan`

2. **`evolve_apply`** — Apply an evolution cycle
   - Input: auto_approve (bool), target_area
   - Output: Applied changes, new capabilities added
   - Uses: `evolve.py apply`

3. **`distill_patterns`** — Extract reusable patterns from reasoning bank
   - Input: min_confidence (0-1)
   - Output: Pattern library updates
   - Uses: `distill_patterns.py`

### Implementation Files

- Create: `mcp/tools/evolution-tools.js`
- Tools: 3 new tools
- Estimated lines: ~180

---

## Phase 4: Add Utility & Governance Tools 🔒

**Purpose:** Essential operations for quality, security, and documentation

### New Tools

1. **`guardian_check`** — Pre-commit quality gate
   - Input: none (uses git status)
   - Output: Blockers, warnings, approval
   - Uses: `guardian_mode.py status`

2. **`pow_sign`** — Sign work with proof-of-work commit
   - Input: message, difficulty (default 4)
   - Output: Signed commit hash
   - Uses: `pow_commit.py sign`

3. **`adr_create`** — Generate architecture decision record
   - Input: title, context, decision, consequences
   - Output: ADR file path
   - Uses: `adr_generator.py`

4. **`context_trim`** — Trim file for token budget
   - Input: file_path, pattern, max_lines
   - Output: Trimmed content
   - Uses: `context_trimmer.py`

5. **`audit_full`** — Run complete system audit
   - Input: scope (agents|skills|scripts|all)
   - Output: Audit report with issues/compliance
   - Uses: `verify_all.py`

### Implementation Files

- Create: `mcp/tools/utility-tools.js`
- Tools: 5 new tools
- Estimated lines: ~250

---

## Phase 5: Enhance Existing Infrastructure 🏗️

### Error Handling Improvements

- Wrap all Python exec calls in try-catch with detailed errors
- Add timeout configurations per tool
- Return structured error objects with remediation hints

### Caching Layer

- Add LRU cache for `agent_list`, `skill_list`, `router_stats`
- Cache TTL: 5 minutes (configurable)
- Cache key includes file mtimes for auto-invalidation

### Validation

- Add Zod schema validation for all tool inputs
- Validate file paths before Python execution
- Sanitize strings to prevent shell injection

### Implementation

- Update: All tool files (`*-tools.js`)
- Add: `mcp/lib/cache.js`
- Add: `mcp/lib/error-handler.js`
- Estimated lines: ~150

---

## Phase 6: Add Meta-Capabilities 🔮

### New Meta Tools

1. **`mcp_introspect`** — Get MCP server capabilities
   - Output: All tools with schemas, version, health

2. **`mcp_health`** — Health check
   - Output: Python availability, script accessibility, memory status

3. **`mcp_telemetry`** — Usage statistics
   - Output: Most used tools, error rates, avg execution time

4. **`mcp_discover`** — Auto-discover new scripts
   - Scans scripts/ for new Python files with `__main__`
   - Suggests tool wrappers

### Implementation Files

- Create: `mcp/tools/meta-tools.js`
- Create: `mcp/lib/telemetry.js`
- Tools: 4 new tools
- Estimated lines: ~200

---

## Phase 7: Update Core Server 🚀

### Changes to `server.js`

- Register all new tool modules
- Add global error handler
- Add telemetry hooks
- Update version to 3.0.0

### Changes to `package.json`

- Update version to 3.0.0
- Add new dependencies (if any)
- Add development scripts

### New Files

- `mcp/README.md` — Complete tool documentation
- `mcp/CHANGELOG.md` — Version history
- `mcp/.env.example` — Configuration template

---

## Summary of Improvements

### Tool Count

- **Before:** 11 tools
- **After:** 31+ tools (180% increase)

### New Capabilities

- ✅ Swarm execution (parallel & sequential multi-agent tasks)
- ✅ Simulacrum debate (cross-model consensus)
- ✅ Self-evolution (auto-improvement cycles)
- ✅ Governance (guardian, PoW, ADR)
- ✅ Utilities (trim, audit, intel)
- ✅ Meta-capabilities (introspection, health, discovery)

### Quality Improvements

- ✅ Comprehensive error handling
- ✅ LRU caching for frequent queries
- ✅ Input validation and sanitization
- ✅ Telemetry and usage tracking
- ✅ Health monitoring

### Developer Experience

- ✅ Complete documentation (README + CHANGELOG)
- ✅ Tool auto-discovery
- ✅ Clear error messages with remediation hints
- ✅ Example usage for each tool

---

## Success Criteria

1. ✅ All 20+ new tools accessible via MCP
2. ✅ Zero regressions in existing tools
3. ✅ <500ms average tool invocation time
4. ✅ 100% test coverage for new tools
5. ✅ Documentation complete and accurate
6. ✅ Successfully execute self-evolution cycle
7. ✅ Successfully run swarm with 3+ agents

---

## Risk Mitigation

**Risk:** Breaking existing tools during refactor
**Mitigation:** Implement new tools in separate files, test isolation

**Risk:** Python script failures due to environment issues
**Mitigation:** Add health checks, validate Python availability on startup

**Risk:** Timeout/performance issues with long-running tools
**Mitigation:** Implement configurable timeouts, async where possible

**Risk:** Security concerns with executing Python scripts
**Mitigation:** Input sanitization, path validation, no eval/exec of user input

---

## Next Steps

1. Begin Phase 1: Swarm tools implementation
2. Create test suite for new tools
3. Update documentation
4. Run self-test with `evolve_scan` after completion
