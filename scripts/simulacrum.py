import json
import time
import uuid
import sys
import io
import subprocess
from datetime import datetime
from pathlib import Path

# Force UTF-8 output on Windows terminals
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

# ──────────────────────────────────────────────────────────────
# Agentica P12: The Logic Simulacrum
# Agents debate architectural decisions BEFORE any code is written.
# Output: A consensus decision log + recommended approach.
# ──────────────────────────────────────────────────────────────

BLUE   = "\033[94m"
GREEN  = "\033[92m"
YELLOW = "\033[93m"
RED    = "\033[91m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

# Built-in agent "personalities" — each has a domain bias and known concerns.
AGENT_PERSONAS = {
    "backend-specialist": {
        "bias": "performance, scalability, clean REST design",
        "concerns": ["API latency", "database efficiency", "service boundaries"],
        "tone": "pragmatic"
    },
    "security-auditor": {
        "bias": "threat modelling, zero-trust, least-privilege",
        "concerns": ["injection risks", "token leakage", "insecure defaults"],
        "tone": "cautious"
    },
    "frontend-specialist": {
        "bias": "developer experience, component reuse, UX flow",
        "concerns": ["state complexity", "bundle size", "accessibility"],
        "tone": "user-centric"
    },
    "database-architect": {
        "bias": "schema integrity, indexing, data normalisation",
        "concerns": ["N+1 queries", "migration safety", "data consistency"],
        "tone": "structured"
    },
    "performance-optimizer": {
        "bias": "speed, memory efficiency, Core Web Vitals",
        "concerns": ["cache invalidation", "memory leaks", "bottlenecks"],
        "tone": "metric-driven"
    },
    "test-engineer": {
        "bias": "coverage, edge cases, regression safety",
        "concerns": ["uncovered branches", "flaky tests", "integration gaps"],
        "tone": "methodical"
    },
    "devops-engineer": {
        "bias": "CI/CD reliability, infra cost, deployment safety",
        "concerns": ["container health", "rollback strategy", "secrets exposure"],
        "tone": "operational"
    }
}


class Agent:
    """Represents a single agent participant in the simulacrum session."""

    def __init__(self, name: str):
        self.name = name
        self.persona = AGENT_PERSONAS.get(name, {
            "bias": "general best practices",
            "concerns": ["correctness", "maintainability"],
            "tone": "balanced"
        })

    def opening_position(self, topic: str) -> str:
        """Agent's initial stance on the topic."""
        bias = self.persona["bias"]
        concerns = ", ".join(self.persona["concerns"][:2])
        tone = self.persona["tone"]
        return (
            f"[{self.name}] From a {tone} perspective: My primary consideration is "
            f"{bias}. Key risks I see here are: {concerns}. "
            f"We should address these before finalising any approach."
        )

    def respond_to(self, topic: str, prior_argument: str, round_num: int) -> str:
        """Agent reacts to the previous argument and refines the dialogue."""
        concern = self.persona["concerns"][round_num % len(self.persona["concerns"])]
        bias = self.persona["bias"]
        return (
            f"[{self.name}] Acknowledged. Building on that — from my {bias} lens, "
            f"I'd add: we must specifically address '{concern}' to ensure this approach "
            f"is production-safe. I propose we add an explicit constraint around this."
        )

    def vote(self, proposals: list[str]) -> str:
        """Agent casts a vote for the strongest proposal."""
        # Simple heuristic: prefer the proposal that mentions the agent's bias keywords
        bias_keywords = self.persona["bias"].lower().split(", ")
        best_score = -1
        best = proposals[0] if proposals else "no clear preference"
        for prop in proposals:
            score = sum(1 for kw in bias_keywords if kw in prop.lower())
            if score > best_score:
                best_score = score
                best = prop
        return f"[{self.name}] My vote: '{best}'"


class Simulacrum:
    """
    The Logic Simulacrum Engine.
    Orchestrates a structured multi-agent debate on an architectural topic.
    """

    def __init__(self, topic: str, agents: list[str], rounds: int = 3):
        self.topic = topic
        self.rounds = rounds
        self.session_id = str(uuid.uuid4())[:8]
        self.agents = [Agent(name) for name in agents]
        self.log_dir = Path(".Agentica/logs/simulacrum")
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self.transcript: list[dict] = []

    def _record(self, speaker: str, content: str, phase: str):
        """Appends a structured entry to the session transcript."""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "phase": phase,
            "speaker": speaker,
            "content": content
        }
        self.transcript.append(entry)
        tag = {
            "opening":   f"{BLUE}[OPEN]   {RESET}",
            "debate":    f"{CYAN}[DEBATE] {RESET}",
            "vote":      f"{YELLOW}[VOTE]   {RESET}",
            "consensus": f"{GREEN}[CONSENSUS] {RESET}"
        }.get(phase, "[LOG]   ")
        print(f"  {tag}{BOLD}{speaker}{RESET}: {content}")

    def run(self) -> dict:
        """Execute the full simulacrum debate and produce a consensus."""
        print(f"\n{YELLOW}{BOLD}=========================================={RESET}")
        print(f"{YELLOW}{BOLD}  LOGIC SIMULACRUM -- Session {self.session_id}{RESET}")
        print(f"{YELLOW}{BOLD}  Topic: {self.topic}{RESET}")
        print(f"{YELLOW}{BOLD}  Agents: {', '.join(a.name for a in self.agents)}{RESET}")
        print(f"{YELLOW}{BOLD}=========================================={RESET}\n")

        # ── Phase 1: Opening Positions ─────────────────────────────────────────
        print(f"{BOLD}Phase 1 - Opening Positions{RESET}")
        for agent in self.agents:
            pos = agent.opening_position(self.topic)
            self._record(agent.name, pos, "opening")
            time.sleep(0.1)

        # ── Phase 2: Debate Rounds ─────────────────────────────────────────────
        print(f"\n{BOLD}Phase 2 - Debate Rounds ({self.rounds} rounds){RESET}")
        last_argument = self.topic
        for round_num in range(self.rounds):
            print(f"\n  {CYAN}-- Round {round_num + 1} --{RESET}")
            for agent in self.agents:
                response = agent.respond_to(self.topic, last_argument, round_num)
                self._record(agent.name, response, "debate")
                last_argument = response
                time.sleep(0.1)

        # ── Phase 3: Proposals ─────────────────────────────────────────────────
        print(f"\n{BOLD}Phase 3 - Proposals{RESET}")
        proposals = []
        for agent in self.agents:
            concern = agent.persona["concerns"][0]
            proposal = (
                f"Approach from {agent.name}: "
                f"Prioritise {agent.persona['bias']}, "
                f"with explicit handling for {concern}."
            )
            proposals.append(proposal)
            self._record(agent.name, f"PROPOSAL: {proposal}", "vote")

        # ── Phase 4: Voting ────────────────────────────────────────────────────
        print(f"\n{BOLD}Phase 4 - Voting{RESET}")
        vote_tally: dict[str, int] = {p: 0 for p in proposals}
        for agent in self.agents:
            vote = agent.vote(proposals)
            self._record(agent.name, vote, "vote")
            # Tally the vote
            for p in proposals:
                if p in vote:
                    vote_tally[p] += 1
                    break

        winner = max(vote_tally, key=vote_tally.get)

        # ── Phase 5: Consensus ─────────────────────────────────────────────────
        print(f"\n{BOLD}Phase 5 - Consensus{RESET}")
        constraints = []
        for agent in self.agents:
            constraints.append(f"[{agent.name}] {agent.persona['concerns'][0]}")

        consensus = {
            "recommended_approach": winner,
            "vote_tally": vote_tally,
            "constraints": constraints,
            "session_id": self.session_id,
            "topic": self.topic,
            "agents": [a.name for a in self.agents],
            "timestamp": datetime.now().isoformat(),
            "transcript": self.transcript
        }

        consensus_summary = (
            f"CONSENSUS REACHED. Winning approach ({vote_tally[winner]} votes): "
            f"{winner[:80]}..."
        )
        self._record("SIMULACRUM", consensus_summary, "consensus")

        # ── Save full session log ──────────────────────────────────────────────
        log_path = self.log_dir / f"session_{self.session_id}.json"
        with open(log_path, "w", encoding="utf-8") as f:
            json.dump(consensus, f, indent=2, ensure_ascii=False)

        print(f"\n{GREEN}{BOLD}=========================================={RESET}")
        print(f"{GREEN}{BOLD}  SESSION COMPLETE{RESET}")
        print(f"{GREEN}{BOLD}  Log saved >> {log_path}{RESET}")
        print(f"{GREEN}{BOLD}=========================================={RESET}\n")

        return consensus


def run_simulacrum(topic: str, agents: list[str], rounds: int = 3) -> dict:
    """Convenience wrapper for external callers (e.g., swarm, orchestrator)."""
    sim = Simulacrum(topic=topic, agents=agents, rounds=rounds)
    return sim.run()


if __name__ == "__main__":
    import sys
    import argparse

    parser = argparse.ArgumentParser(
        description="Agentica P12 — Logic Simulacrum: multi-agent architecture debate"
    )
    parser.add_argument("topic", help="The architectural question to debate")
    parser.add_argument(
        "--agents", nargs="+",
        default=["backend-specialist", "security-auditor", "frontend-specialist"],
        help="Agent names to include in the debate"
    )
    parser.add_argument(
        "--rounds", type=int, default=3,
        help="Number of debate rounds (default: 3)"
    )
    args = parser.parse_args()

    result = run_simulacrum(
        topic=args.topic,
        agents=args.agents,
        rounds=args.rounds
    )

    print(f"\n{BOLD}Recommended Approach:{RESET}")
    print(f"  >> {result['recommended_approach']}")
    print(f"\n{BOLD}Constraints agreed upon:{RESET}")
    for c in result["constraints"]:
        print(f"  * {c}")
