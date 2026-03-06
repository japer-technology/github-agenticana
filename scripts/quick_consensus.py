#!/usr/bin/env python3
"""
Quick Consensus — Fast validation of a decision across perspectives
Wraps real_simulacrum.py with a simpler interface for yes/no validation.
Part of Agenticana v7.0 MCP Self-Evolution System
"""
import sys
import json
import argparse
from pathlib import Path
from typing import List, Dict

# Import the real simulacrum
try:
    from real_simulacrum import run_real_simulacrum
except ImportError:
    # Add scripts dir to path if running from elsewhere
    sys.path.insert(0, str(Path(__file__).parent))
    from real_simulacrum import run_real_simulacrum

# Perspective to agent mapping
PERSPECTIVE_MAP = {
    'security': 'security-auditor',
    'performance': 'performance-optimizer',
    'maintainability': 'backend-specialist',
    'ux': 'frontend-specialist',
    'testing': 'test-engineer',
    'scalability': 'backend-specialist',
    'accessibility': 'frontend-specialist',
    'database': 'database-architect',
    'devops': 'devops-engineer',
    'mobile': 'mobile-developer',
}


def quick_consensus(question: str, decision: str, perspectives: List[str]) -> Dict:
    """
    Quick yes/no check: Should we accept this decision?

    Args:
        question: The question/context being debated
        decision: The proposed decision to validate
        perspectives: List of perspective lenses (security, performance, etc.)

    Returns:
        Dict with consensus results including:
        - approval_count: Number of agents that approved
        - agreement_score: Percentage of approvals (0.0 to 1.0)
        - recommendation: APPROVED or REVIEW
        - responses: Individual agent responses
    """
    # Map perspectives to agent roles
    agents = []
    for p in perspectives:
        agent = PERSPECTIVE_MAP.get(p.lower(), 'backend-specialist')
        if agent not in agents:  # Avoid duplicates
            agents.append(agent)

    if not agents:
        agents = ['backend-specialist', 'security-auditor', 'frontend-specialist']

    # Construct review topic
    topic = f"""DECISION REVIEW REQUEST

CONTEXT: {question}

PROPOSED DECISION: {decision}

TASK: Review this decision from your domain expertise. Respond with:
1. APPROVE - if you agree this is a good decision
2. REJECT - if you see critical flaws
3. CONDITIONAL - if it's acceptable with specific changes

Be concise. Explain your reasoning in 2-3 sentences."""

    # Run single-round debate
    try:
        result = run_real_simulacrum(topic, agents, rounds=1)
    except Exception as e:
        return {
            'error': str(e),
            'question': question,
            'decision': decision,
            'perspectives': perspectives,
            'recommendation': 'ERROR',
        }

    # Analyze responses for approval signals
    responses = []
    approvals = 0

    for agent_name, response in result.get('proposals', {}).items():
        response_text = response if isinstance(response, str) else str(response)
        responses.append({
            'agent': agent_name,
            'response': response_text,
        })

        # Simple approval detection
        response_lower = response_text.lower()
        if 'approve' in response_lower or 'agree' in response_lower:
            approvals += 1
        elif 'reject' not in response_lower and 'critical' not in response_lower and 'flaw' not in response_lower:
            # If no explicit reject and no critical issues mentioned, count as mild approval
            approvals += 0.5

    total = len(agents)
    agreement_score = approvals / total if total > 0 else 0.0

    # Determine recommendation (70% threshold)
    if agreement_score >= 0.7:
        recommendation = 'APPROVED'
    elif agreement_score >= 0.4:
        recommendation = 'REVIEW'
    else:
        recommendation = 'REJECTED'

    return {
        'question': question,
        'decision': decision,
        'perspectives': perspectives,
        'agents_consulted': agents,
        'approval_count': approvals,
        'total_agents': total,
        'agreement_score': agreement_score,
        'recommendation': recommendation,
        'responses': responses,
        'winning_agent': result.get('winning_agent'),
        'winning_proposal': result.get('winning_proposal'),
        'session_id': result.get('session_id'),
    }


def main():
    parser = argparse.ArgumentParser(
        description="Quick Consensus — Fast decision validation via AI debate",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s "Should we migrate to microservices?" "Yes, split monolith into 5 services" --perspective security --perspective scalability
  %(prog)s "Auth strategy?" "Use JWT in HttpOnly cookies" --perspective security --perspective performance --json
        """
    )
    parser.add_argument("question", help="The question or context being evaluated")
    parser.add_argument("decision", help="The proposed decision to validate")
    parser.add_argument("--perspective", action="append", dest="perspectives",
                        default=[], help="Evaluation perspective (can specify multiple)")
    parser.add_argument("--json", action="store_true", help="Output JSON format")

    args = parser.parse_args()

    # Default perspectives if none provided
    if not args.perspectives:
        args.perspectives = ['security', 'performance', 'maintainability']

    result = quick_consensus(args.question, args.decision, args.perspectives)

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        # Human-readable output
        print(f"\n{'='*60}")
        print(f"QUICK CONSENSUS RESULTS")
        print(f"{'='*60}\n")
        print(f"Question: {result['question']}")
        print(f"Decision: {result['decision']}")
        print(f"\nPerspectives: {', '.join(result['perspectives'])}")
        print(f"Agents Consulted: {', '.join(result['agents_consulted'])}")
        print(f"\nAgreement Score: {result['agreement_score']:.0%}")
        print(f"Recommendation: {result['recommendation']}\n")

        print("Agent Responses:")
        print("-" * 60)
        for resp in result['responses']:
            print(f"\n{resp['agent'].upper()}:")
            print(f"  {resp['response']}")

        print(f"\n{'='*60}")
        print(f"Winning Agent: {result.get('winning_agent', 'N/A')}")
        print(f"Session ID: {result.get('session_id', 'N/A')}")
        print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
