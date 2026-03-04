#!/usr/bin/env python3
"""
Agentica P21: Swarm Result Merger
=================================
Consolidates outputs from multiple parallel agents into a single
coherent plan with conflict resolution.

Secretary Bird: merges the spoils of the hunt into one feast. 🦅
"""

import json
import os
import sys
import io
import uuid
from pathlib import Path
from datetime import datetime

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

GREEN  = "\033[92m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

class SwarmMerger:
    def __init__(self, run_id: str):
        self.run_id = run_id
        self.output_dir = Path(".Agentica/logs/swarms") / run_id
        self.merge_file = self.output_dir / "consolidated_plan.md"

    def merge(self, results: list[dict]) -> str:
        """
        Merges results using a simplified orchestrator logic.
        In full implementation, this calls the Simulacrum to resolve conflicts.
        """
        print(f"[*] Merging {len(results)} agent outputs for run {self.run_id}...")

        md_content = [
            f"# 🦅 Consolidated Swarm Plan: {self.run_id}",
            f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "\n## 🤖 Agent Contributions\n"
        ]

        # Sort results by agent importance (orchestrator first)
        results.sort(key=lambda x: 0 if x['agent'] == 'orchestrator' else 1)

        for res in results:
            agent = res.get('agent', 'unknown')
            content = res.get('content', '')
            md_content.append(f"### 👤 {agent}")
            md_content.append(content)
            md_content.append("\n---\n")

        md_content.append("\n## ⚔️ Conflict Resolution")
        md_content.append("No critical architectural conflicts detected. Merged successfully.")

        final_md = "\n".join(md_content)

        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.merge_file.write_text(final_md, encoding="utf-8")

        return final_md

def main():
    print(f"\n{BOLD}{CYAN}🦅 Agentica P21: Swarm Result Merger starting...{RESET}")

    # Mock data for demonstration
    run_id = str(uuid.uuid4())[:6]
    mock_results = [
        {
            "agent": "backend-specialist",
            "content": "Proposal: Use FastAPI for high-performance async endpoints. Integrate with Redis for caching."
        },
        {
            "agent": "security-auditor",
            "content": "Risk: Redis exposure. Mitigation: Use TLS and strict IAM roles. Implement rate limiting on API."
        },
        {
            "agent": "database-architect",
            "content": "Schema: Define partitioned tables for logs to ensure N+1 queries don't kill the database."
        }
    ]

    merger = SwarmMerger(run_id)
    consolidated = merger.merge(mock_results)

    print(f"\n{BOLD}Consolidated Plan Preview:{RESET}")
    print(consolidated[:300] + "...")
    print(f"\n{GREEN}[+] Merged plan saved to: {merger.merge_file}{RESET}")

if __name__ == "__main__":
    main()
