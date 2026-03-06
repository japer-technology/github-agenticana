# MCP v3.0 — Critical Interface Mismatches & Fixes

**Date:** March 6, 2026
**Status:** 🔴 REQUIRES IMMEDIATE ATTENTION
**Priority:** HIGH

---

## Summary

During project alignment review, **2 critical interface mismatches** were discovered between MCP tool wrappers and actual Python scripts:

1. ✅ **simulacrum_quick** → `real_simulacrum.py` [MISMATCH CONFIRMED]
2. ✅ **adr_create** → `adr_generator.py` [MISMATCH CONFIRMED]

---

## Issue 1: `simulacrum_quick` Tool ❌

### What the Tool Expects

```bash
python scripts/real_simulacrum.py "question" "decision" \
  --perspective "security" \
  --perspective "performance" \
  --json
```

### What the Script Actually Accepts

```bash
python scripts/real_simulacrum.py "topic" \
  --agents "backend-specialist" "security-auditor" \
  --rounds 2
```

### Mismatch Details

- **Script is:** P15 Real LLM Simulacrum (full debate system)
- **Tool expects:** Quick consensus check (validate a decision)
- **Parameters:** Completely different interfaces

### Impact

🔴 **CRITICAL** — Tool will fail on first invocation. Args don't match.

### Fix Options

#### Option A: Wrap the Correct Script

**Action:** Tool should wrap `real_simulacrum.py` correctly as full debate

**New Tool Interface:**

```javascript
server.tool(
  "simulacrum_debate_real", // Rename from simulacrum_quick
  "Run REAL LLM Simulacrum debate with Gemini agents",
  {
    topic: z.string(),
    agents: z
      .array(z.string())
      .default([
        "backend-specialist",
        "security-auditor",
        "frontend-specialist",
      ]),
    rounds: z.number().int().min(1).max(5).default(2),
  },
  async ({ topic, agents, rounds }) => {
    const agentsArg = agents.map((a) => `"${a}"`).join(" ");
    const args = `"${topic}" --agents ${agentsArg} --rounds ${rounds}`;
    // ... execute
  },
);
```

**Result:** Tool matches actual script, but loses "quick consensus" feature.

---

#### Option B: Create Wrapper Python Script ⭐ RECOMMENDED

**Action:** Create new `scripts/quick_consensus.py` that wraps `real_simulacrum.py`

**New Script:**

```python
#!/usr/bin/env python3
"""
Quick Consensus — Fast validation of a decision across perspectives
Wraps real_simulacrum.py with a simpler interface for yes/no validation.
"""
import sys
import json
from pathlib import Path

# Import the real simulacrum
sys.path.insert(0, str(Path(__file__).parent))
from real_simulacrum import run_real_simulacrum

def quick_consensus(question: str, decision: str, perspectives: list[str]) -> dict:
    """
    Quick yes/no check: Should we accept this decision?
    Maps perspectives to agent roles.
    """
    perspective_map = {
        'security': 'security-auditor',
        'performance': 'performance-optimizer',
        'maintainability': 'backend-specialist',
        'ux': 'frontend-specialist',
        'testing': 'test-engineer',
    }

    agents = [perspective_map.get(p, 'backend-specialist') for p in perspectives]
    topic = f"DECISION REVIEW: {decision}\\n\\nCONTEXT: {question}\\n\\nDo you approve?"

    result = run_real_simulacrum(topic, agents, rounds=1)  # Single round only

    # Count approvals
    approvals = sum(1 for resp in result.get('responses', []) if 'approve' in resp.lower() or 'yes' in resp.lower())

    return {
        'question': question,
        'decision': decision,
        'perspectives': perspectives,
        'approval_count': approvals,
        'total': len(agents),
        'agreement_score': approvals / len(agents) if agents else 0,
        'recommendation': 'APPROVED' if approvals / len(agents) >= 0.7 else 'REVIEW',
        'full_result': result,
    }

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Quick consensus check")
    parser.add_argument("question", help="The question/context")
    parser.add_argument("decision", help="The proposed decision")
    parser.add_argument("--perspective", action="append", dest="perspectives",
                        default=[], help="Evaluation perspective")
    parser.add_argument("--json", action="store_true", help="JSON output")
    args = parser.parse_args()

    if not args.perspectives:
        args.perspectives = ['security', 'performance', 'maintainability']

    result = quick_consensus(args.question, args.decision, args.perspectives)

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"Agreement Score: {result['agreement_score']:.0%}")
        print(f"Recommendation: {result['recommendation']}")
```

**Then update MCP tool:**

```javascript
// In simulacrum-tools.js, change path:
const quickPath = path.join(AgenticanaRoot, "scripts", "quick_consensus.py");
```

**Result:** ✅ Tool works as designed, adds useful utility to project.

---

## Issue 2: `adr_create` Tool ❌

### What the Tool Expects

```bash
python scripts/adr_generator.py \
  --title "Use PostgreSQL for DB" \
  --context "Need persistent storage" \
  --decision "Use PostgreSQL 15" \
  --consequences "Better reliability" \
  --status accepted \
  --json
```

### What the Script Actually Accepts

```bash
python scripts/adr_generator.py session_abc123.json  # or --latest or --list
```

### Mismatch Details

- **Script is:** ADR generator FROM Simulacrum debate logs
- **Tool expects:** Manual ADR creation with explicit fields
- **Parameters:** Script takes session file, not manual input

### Impact

🔴 **CRITICAL** — Tool will fail. Script expects session JSON, not manual fields.

### Fix Options

#### Option A: Remove Tool

**Action:** Delete `adr_create` tool since the existing script serves a different purpose

**Pros:** No code to maintain
**Cons:** Loses useful "manual ADR" capability

---

#### Option B: Wrap Existing Script Correctly

**Action:** Rename tool to `adr_from_simulacrum` and match actual interface

**New Tool Interface:**

```javascript
server.tool(
  "adr_from_simulacrum",
  "Generate ADR from a Simulacrum debate session log",
  {
    session: z.string().optional().describe("Session file path"),
    latest: z.boolean().default(false).describe("Use latest session"),
    all: z.boolean().default(false).describe("Generate for all sessions"),
  },
  async ({ session, latest, all }) => {
    const args = [
      session ? `"${session}"` : "",
      latest ? "--latest" : "",
      all ? "--all" : "",
    ]
      .filter(Boolean)
      .join(" ");
    // ... execute
  },
);
```

**Result:** Tool works, but limited to Simulacrum-generated ADRs only.

---

#### Option C: Create Manual ADR Script ⭐ RECOMMENDED

**Action:** Create new `scripts/adr_manual.py` for manual ADR creation

**New Script:**

```python
#!/usr/bin/env python3
"""
Manual ADR Creator — Generate ADR from explicit inputs
For decisions made outside of Simulacrum debates.
"""
import argparse
import json
from datetime import datetime
from pathlib import Path

ADR_DIR = Path("docs/decisions")

def create_manual_adr(title: str, context: str, decision: str,
                      consequences: str, alternatives: list = None,
                      status: str = "accepted") -> tuple[int, str]:
    """Generate ADR from manual inputs."""
    ADR_DIR.mkdir(parents=True, exist_ok=True)

    # Find next ADR number
    existing = list(ADR_DIR.glob("ADR-*.md"))
    next_num = max([int(f.name.split('-')[1]) for f in existing], default=0) + 1

    # Build ADR content
    adr = f"""# ADR-{next_num:03d}: {title}

**Status:** {status.upper()}
**Date:** {datetime.now().strftime('%Y-%m-%d')}
**Method:** Manual (not from Simulacrum)

---

## Context

{context}

## Decision

{decision}

## Consequences

{consequences}
"""

    if alternatives:
        adr += "\\n## Alternatives Considered\\n\\n"
        for i, alt in enumerate(alternatives, 1):
            adr += f"{i}. {alt}\\n"

    adr += f"\\n---\\n\\n*Generated by Agenticana Manual ADR Creator*\\n"

    return next_num, adr

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Manual ADR Creator")
    parser.add_argument("--title", required=True, help="ADR title")
    parser.add_argument("--context", required=True, help="Decision context")
    parser.add_argument("--decision", required=True, help="The decision made")
    parser.add_argument("--consequences", required=True, help="Expected consequences")
    parser.add_argument("--alternative", action="append", dest="alternatives",
                        help="Alternative option considered")
    parser.add_argument("--status", default="accepted",
                        choices=["proposed", "accepted", "deprecated", "superseded"])
    parser.add_argument("--json", action="store_true", help="JSON output")
    args = parser.parse_args()

    num, content = create_manual_adr(
        args.title, args.context, args.decision,
        args.consequences, args.alternatives, args.status
    )

    slug = "-".join(args.title.lower().split()[:6])
    slug = "".join(c if c.isalnum() or c == "-" else "" for c in slug)
    adr_path = ADR_DIR / f"ADR-{num:03d}-{slug[:40]}.md"
    adr_path.write_text(content, encoding="utf-8")

    if args.json:
        print(json.dumps({
            'adr_number': num,
            'file_path': str(adr_path),
            'title': args.title,
            'status': args.status,
        }, indent=2))
    else:
        print(f"Generated: {adr_path}")
```

**Then update MCP tool:**

```javascript
// In utility-tools.js, change path:
const adrPath = path.join(AgenticanaRoot, "scripts", "adr_manual.py");
```

**Result:** ✅ Tool works as designed, useful for non-Simulacrum ADRs.

---

## Recommended Action Plan

### Phase 1: Immediate Fixes (Today)

1. ✅ Create `scripts/quick_consensus.py`
2. ✅ Create `scripts/adr_manual.py`
3. ✅ Update `simulacrum-tools.js` to use correct path
4. ✅ Update `utility-tools.js` to use correct path
5. ✅ Test both tools end-to-end

### Phase 2: Optional Enhancements (This Week)

1. ✅ Add `adr_from_simulacrum` tool (wrap existing script correctly)
2. ✅ Add `simulacrum_debate_full` tool (wrap real_simulacrum.py)
3. ✅ Update documentation

### Phase 3: Cleanup (Next Week)

1. Mark old tools as "legacy" if keeping backwards compat
2. Update mcp/README.md with correct examples
3. Add integration tests

---

## Testing Checklist

### Test `simulacrum_quick` (after fix)

```bash
# Should work:
node mcp/server.js --test-tool simulacrum_quick \
  '{
    "question": "Should we use JWT?",
    "decision": "Yes, use HttpOnly cookies",
    "perspectives": ["security", "performance"]
  }'

# Expected: JSON with agreement_score and recommendation
```

### Test `adr_create` (after fix)

```bash
# Should work:
node mcp/server.js --test-tool adr_create \
  '{
    "title": "Use PostgreSQL",
    "context": "Need ACID compliance",
    "decision": "PostgreSQL 15",
    "consequences": "Better data integrity",
    "status": "accepted"
  }'

# Expected: JSON with adr_path and adr_number
```

---

## Impact Assessment

### If Not Fixed

🔴 **2 of 28 tools (7%) are broken**

- User experience severely degraded
- Error messages will be confusing
- Trust in MCP v3.0 compromised

### If Fixed with Wrapper Scripts

✅ **All 28 tools (100%) functional**

- Better UX (tools work as documented)
- Adds 2 useful utilities to project
- Clean separation of concerns

---

## Estimated Fix Time

| Task                 | Time       | Difficulty |
| -------------------- | ---------- | ---------- |
| `quick_consensus.py` | 30 min     | Medium     |
| `adr_manual.py`      | 20 min     | Easy       |
| Update MCP tools     | 10 min     | Easy       |
| Testing              | 20 min     | Easy       |
| **Total**            | **80 min** | **Medium** |

---

## Status Tracking

- [ ] Create `scripts/quick_consensus.py`
- [ ] Create `scripts/adr_manual.py`
- [ ] Update `mcp/tools/simulacrum-tools.js`
- [ ] Update `mcp/tools/utility-tools.js`
- [ ] Test `simulacrum_quick` tool
- [ ] Test `adr_create` tool
- [ ] Update `mcp/README.md` examples
- [ ] Update project alignment review doc
- [ ] Mark as production-ready

---

**Next Action:** Create wrapper Python scripts (80 minutes work)
**Blocker:** None — can proceed immediately
**Owner:** Developer / AI Assistant
