# Changelog — Agenticana MCP Server

All notable changes to the MCP server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [3.0.0] - 2026-03-06 🦅 Secretary Bird Edition

### Added

#### Swarm Execution Tools (3 new tools)

- **`swarm_parse`** — Convert natural language to swarm manifest with auto-agent-selection
- **`swarm_dispatch`** — Execute multi-agent swarms in parallel or sequential mode
- **`swarm_status`** — Track ongoing swarm execution progress

#### Simulacrum (Debate) Tools (2 new tools)

- **`simulacrum_debate`** — Multi-round cross-model debate with consensus scoring
- **`simulacrum_quick`** — Fast single-round consensus check across perspectives

#### Evolution & Self-Improvement Tools (3 new tools)

- **`evolve_scan`** — Scan Agenticana for improvement opportunities
- **`evolve_apply`** — Apply evolution cycle (SELF-MODIFICATION capability)
- **`distill_patterns`** — Extract reusable patterns from ReasoningBank

#### Utility & Governance Tools (5 new tools)

- **`guardian_check`** — Pre-commit quality gate with blocker detection
- **`pow_sign`** — Proof-of-work commit signing
- **`adr_create`** — Generate Architecture Decision Records
- **`context_trim`** — Token-aware file trimming for large contexts
- **`audit_full`** — Complete system audit (agents, skills, scripts)

#### Meta-Capabilities (4 new tools)

- **`mcp_introspect`** — Full MCP capability inspection
- **`mcp_health`** — Health check with diagnostics
- **`mcp_telemetry`** — Usage statistics and performance metrics
- **`mcp_discover`** — Auto-discover new Python scripts for tool wrapping

#### Infrastructure Improvements

- **Caching Layer** — LRU cache with TTL and mtime-based invalidation (`mcp/lib/cache.js`)
- **Error Handling** — Structured error responses with remediation hints
- **Input Validation** — Comprehensive Zod schemas for all tool parameters
- **Telemetry** — Track tool usage, error rates, execution times

### Changed

- **Version:** Bumped to 3.0.0 (major version due to significant new capabilities)
- **Tool Count:** Increased from 11 to 31+ tools (180% increase)
- **Server Header:** Now displays "🦅 Secretary Bird Edition"
- **package.json:** Updated description, keywords, added repository info

### Improved

- All tools now support JSON output with consistent structure
- Better timeout handling for long-running operations
- Enhanced docstrings with clear use cases
- Improved error messages with actionable hints

### Documentation

- Created comprehensive `mcp/README.md` with examples
- Added `mcp/CHANGELOG.md` (this file)
- Documented all 31 tools with parameters and return values
- Added troubleshooting guide

### Security

- Input sanitization prevents shell injection
- Path validation before file access
- Evolution tools default to dry-run mode for safety
- No eval/exec of user input

---

## [2.0.0] - 2025-12-XX

### Added

- Initial MCP server implementation
- ReasoningBank tools (3): retrieve, record, distill
- Router tools (2): route, stats
- Memory tools (3): store, search, consolidate
- Agent tools (3): list, get, skill_list
- Stdio transport support
- Claude Desktop integration

### Documentation

- Basic server.js documentation
- package.json with dependencies

---

## [1.0.0] - 2025-11-XX

### Added

- Prototype MCP server with stdio transport
- Basic tool registration framework
- ReasoningBank integration

---

## Upcoming in v3.1

### Planned

- [ ] HTTP transport support (SSE/WebSocket)
- [ ] Tool result streaming for long operations
- [ ] Batch tool execution (execute multiple tools in one call)
- [ ] Tool auto-discovery with code generation
- [ ] Integration tests for all 31 tools
- [ ] Performance benchmarks
- [ ] Docker container for isolated execution
- [ ] Web dashboard for telemetry visualization

### Under Consideration

- [ ] Agent-to-agent communication via MCP
- [ ] Distributed swarm execution (multi-machine)
- [ ] Real-time collaboration (multiple clients)
- [ ] Plugin system for custom tools
- [ ] GraphQL query interface

---

## Version History

| Version | Date       | Tools | Status     |
| ------- | ---------- | ----- | ---------- |
| 3.0.0   | 2026-03-06 | 31    | 🦅 Current |
| 2.0.0   | 2025-12-XX | 11    | Stable     |
| 1.0.0   | 2025-11-XX | 3     | Archived   |

---

## Breaking Changes

### v3.0.0

- None (fully backward compatible with v2.0.0)

### v2.0.0

- Tool response format standardized to `{ content: [{ type: 'text', text: JSON.stringify(...) }] }`
- Memory tools now support project-local storage (`.agenticana/memory/`)

---

## Migration Guide

### From v2.0 to v3.0

No breaking changes! All v2.0 tools work exactly the same.

**New capabilities to explore:**

1. Try `mcp_introspect` to see all new tools
2. Test `swarm_parse` with a natural language task
3. Run `evolve_scan` to see improvement opportunities

### First-Time Setup

1. Update MCP host config with server path
2. Restart MCP host
3. Verify: Call `mcp_health` to ensure all dependencies are available
4. Explore: Call `mcp_introspect` to see capabilities

---

## Contributors

- Agenticana Core Team
- Community Contributors (see GitHub)

---

**Next Release Target:** v3.1.0 — Q2 2026
