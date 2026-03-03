# 🦅 Agenticana Roadmap

This is the living roadmap for Agenticana. Items marked **open** are available for contributors to pick up.

> **Want to build something?** Open a Discussion first so we can Simulacrum-debate the approach. Then submit your PR.

---

## ✅ Completed Phases

| Phase | Feature | Status |
|-------|---------|--------|
| P1 | ReasoningBank — vector decision memory | ✅ Shipped |
| P2 | Model Router — cost-aware task routing | ✅ Shipped |
| P3 | Research Node | ✅ Shipped |
| P4 | Agent Exchange | ✅ Shipped |
| P5 | Swarm Dispatcher — parallel agent execution | ✅ Shipped |
| P6 | Vector Soul Memory | ✅ Shipped |
| P7 | Soul Injection API + Control Dashboard | ✅ Shipped |
| P8 | Sentinel — self-healing audit | ✅ Shipped |
| P9 | Soul Bridge — cross-project memory | ✅ Shipped |
| P10 | Heartbeat Daemon — background monitoring | ✅ Shipped |
| P11 | Shadow Sandbox — isolated Git clone execution | ✅ Shipped |
| P12 | Logic Simulacrum — 7-agent debate engine | ✅ Shipped |
| P13 | Performance Pulse — benchmarking suite | ✅ Shipped |
| P14 | Agentica CLI v2 — unified command interface | ✅ Shipped |
| P15 | Real LLM Simulacrum — live Gemini agent debates | ✅ Shipped v6.0 |
| P16 | Guardian Mode — pre-commit AI gate | ✅ Shipped v6.0 |
| P17 | NL Swarm — plain English to swarm manifest | ✅ Shipped v6.0 |
| P18 | ADR Generator — debate → architecture docs | ✅ Shipped v6.0 |
| P19 | Proof-of-Work — signed commit attestations | ✅ Shipped v6.0 |

---

## 🔜 Next Phases (Open for Contributors)

### P20: Multi-Model Simulacrum
**Status:** 🟡 Idea — needs design discussion
**Idea:** Let agents use different LLM providers per persona (Gemini for security-auditor, Claude for backend-specialist, GPT-4 for frontend-specialist). Real diversity of model reasoning.
**Good for:** Experienced contributor with OpenAI/Anthropic API knowledge
[Start a Discussion →](https://github.com/ashrafmusa/agenticana/discussions/new)

### P21: Swarm Result Merger
**Status:** 🟡 Idea — needs design discussion
**Idea:** When multiple agents run in parallel, automatically merge their outputs into a single coherent plan with conflict resolution.
**Good for:** Python developer comfortable with JSON/text merging
[Start a Discussion →](https://github.com/ashrafmusa/agenticana/discussions/new)

### P22: Web Dashboard UI
**Status:** 🟡 Idea
**Idea:** React-based real-time dashboard that shows live swarm status, Guardian logs, ReasoningBank queries, and Simulacrum sessions. Replace the current basic HTML dashboard.
**Good for:** Frontend developer (React)
[Start a Discussion →](https://github.com/ashrafmusa/agenticana/discussions/new)

### P23: VS Code Extension
**Status:** 🟡 Idea
**Idea:** Native VS Code sidebar showing current Guardian status, recent attestations, quick-launch for NL Swarm, and ReasoningBank search.
**Good for:** VS Code extension developer (TypeScript)
[Start a Discussion →](https://github.com/ashrafmusa/agenticana/discussions/new)

### P24: Guardian Rule DSL
**Status:** 🟡 Idea
**Idea:** Let teams define custom pre-commit rules in a simple YAML format. E.g., "never commit without tests," "always sign with PoW if files > 5 changed."
**Good for:** Python developer interested in DSL design
[Start a Discussion →](https://github.com/ashrafmusa/agenticana/discussions/new)

### P25: The Sovereign Loop (Aggressive Autonomy)
**Status:** 🚀 **PROPOSAL**
**Mechanism:**
1. **Intel Swarm**: Monitor competitor repos (e.g., `openclaw/openclaw`) for trending feature requests.
2. **Self-Development**: Use NL Swarm to auto-implement missing features.
3. **Auto-Merge**: Enable `auto-merge` if Shadow Sandbox + Guardian marks the PR as **CERTIFIED (Trust Score > 90)**.
**Goal:** A repo that evolves faster than its competitors by self-monitoring and self-patching.

---

## 💡 Good First Issues for New Contributors

These don't require deep knowledge — just attention to detail:

- [ ] **Add 10 more ReasoningBank decisions** from your own dev experience
- [ ] **Add NL Swarm keywords** for `mobile`, `machine-learning`, `game-dev` domains
- [ ] **Improve agent anti-patterns** — add 3 more "never do this" rules to any agent
- [ ] **Write a usage example** for a phase you've tried
- [ ] **Translate a script's comments** to be clearer for non-native English speakers
- [ ] **Add a new issue template** for a use case not covered

Browse [`good first issue`](https://github.com/ashrafmusa/agenticana/issues?q=is%3Aopen+label%3A%22good+first+issue%22) labels.

---

## 🏗️ Architecture Goals (Long-term)

| Goal | Status |
|------|--------|
| Zero-cloud operation (fully local) | ✅ Done |
| Multi-LLM provider support | 🔜 P20 |
| Web UI for non-CLI users | 🔜 P22 |
| Plugin/extension marketplace via Exchange | 🔜 Future |
| Agenticana-as-a-Service (hosted) | 🔜 Future |

---

## 📣 Propose a Phase

Have an idea for P25 and beyond?

> Open a [GitHub Discussion](https://github.com/ashrafmusa/agenticana/discussions/new?category=ideas) with the label `phase-proposal`.
> The Simulacrum will debate it. The best ideas get built.

*Secretary Bird: we plan before we stomp. 🦅*
