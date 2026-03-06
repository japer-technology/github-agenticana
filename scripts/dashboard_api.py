"""
Agenticana Dashboard API — v7.1 (Live Log Streaming)
Flask API with unbuffered subprocess output and incremental log endpoint.
"""
import os
import json
import time
import subprocess
import threading
from pathlib import Path
from datetime import datetime
from flask import Flask, jsonify, request, send_from_directory, redirect, Response

# ── Config ────────────────────────────────────────────────────────────────────
PORT = 8080
BASE_DIR = Path(__file__).resolve().parent.parent   # d:\_Projects\Agentica
DASHBOARD_DIR = BASE_DIR / "dashboard"
AUTH_KEY_PATH = BASE_DIR / ".Agentica" / "auth.key"
LOG_PATH = BASE_DIR / ".Agentica" / "logs" / "dashboard_action.log"
BILLING_EVENTS_PATH = BASE_DIR / ".Agentica" / "billing_events.jsonl"
SUBSCRIPTION_PATH = BASE_DIR / ".Agentica" / "subscription.json"
EVOLUTION_LOG_PATH = BASE_DIR / ".Agentica" / "evolution_log.json"
OPTIMIZATION_PATH = BASE_DIR / ".Agentica" / "optimization.json"

BILLING_LOCK = threading.Lock()
TASK_LOCK = threading.Lock()
ACTIVE_TASKS: set[str] = set()

DEFAULT_PLAN = "pro"
VALID_PLANS = {"starter", "pro", "team", "enterprise"}

PLAN_FEATURES = {
    "starter": {
        "tasks": {"intel", "audit"},
        "debate": False,
    },
    "pro": {
        "tasks": {"intel", "audit", "evolve"},
        "debate": True,
    },
    "team": {
        "tasks": {"intel", "audit", "evolve"},
        "debate": True,
    },
    "enterprise": {
        "tasks": {"intel", "audit", "evolve"},
        "debate": True,
    },
}

# Estimated unit economics per operation, used for profitability telemetry.
PRICING_MODEL = {
    "run:intel": {"estimated_cost_usd": 0.02, "estimated_revenue_usd": 0.10, "estimated_value_usd": 0.30},
    "run:audit": {"estimated_cost_usd": 0.04, "estimated_revenue_usd": 0.19, "estimated_value_usd": 0.60},
    "run:evolve": {"estimated_cost_usd": 0.12, "estimated_revenue_usd": 0.99, "estimated_value_usd": 2.50},
    "debate:start": {"estimated_cost_usd": 0.08, "estimated_revenue_usd": 0.49, "estimated_value_usd": 1.20},
}

EVOLUTION_PHASE_ORDER = ["P26", "P27", "P28", "P29", "P30"]

DEFAULT_OPTIMIZATION = {
    "economy_mode": True,
    "status_poll_ms": 10000,
    "log_poll_ms": 2500,
    "debate_poll_ms": 2000,
    "debate_check_ms": 5000,
}

PERFORMANCE_OPTIMIZATION = {
    "economy_mode": False,
    "status_poll_ms": 3000,
    "log_poll_ms": 1000,
    "debate_poll_ms": 1000,
    "debate_check_ms": 3000,
}

EVOLVE_COOLDOWN_SECONDS = 300

app = Flask(__name__, static_folder=str(DASHBOARD_DIR))

# ── Helpers ───────────────────────────────────────────────────────────────────

def get_auth_key() -> str | None:
    if AUTH_KEY_PATH.exists():
        return AUTH_KEY_PATH.read_text(encoding="utf-8").strip()
    return None


def check_auth() -> bool:
    key = request.headers.get("X-Agentica-Auth", "")
    expected = get_auth_key()
    ok = key == expected
    if not ok:
        print(f"[AUTH] Blocked — received='{key}' expected='{expected}'")
    return ok


def read_json(path: Path, default=None):
    try:
        if path.exists():
            with open(path, encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        print(f"[WARN] Could not read {path}: {e}")
    return default


def resolve_plan() -> str:
    """Resolve plan from header override or subscription file."""
    header_plan = request.headers.get("X-Agentica-Plan", "").strip().lower()
    if header_plan in VALID_PLANS:
        return header_plan

    subscription = read_json(SUBSCRIPTION_PATH, {})
    file_plan = str(subscription.get("plan", DEFAULT_PLAN)).strip().lower()
    if file_plan in VALID_PLANS:
        return file_plan

    return DEFAULT_PLAN


def is_feature_allowed(plan: str, task: str | None = None, debate: bool = False) -> bool:
    features = PLAN_FEATURES.get(plan, PLAN_FEATURES[DEFAULT_PLAN])
    if debate:
        return bool(features.get("debate", False))
    if task:
        return task in features.get("tasks", set())
    return True


def get_rate_key(event_type: str, action: str) -> str:
    return f"{event_type}:{action}"


def get_pricing(event_type: str, action: str) -> dict:
    return PRICING_MODEL.get(
        get_rate_key(event_type, action),
        {"estimated_cost_usd": 0.01, "estimated_revenue_usd": 0.03, "estimated_value_usd": 0.10},
    )


def append_billing_event(event: dict):
    BILLING_EVENTS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with BILLING_LOCK:
        with open(BILLING_EVENTS_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(event, ensure_ascii=False) + "\n")


def record_billing_event(
    *,
    event_type: str,
    action: str,
    plan: str,
    status: str,
    duration_ms: int = 0,
    metadata: dict | None = None,
):
    pricing = get_pricing(event_type, action)
    event = {
        "timestamp": datetime.now().isoformat(),
        "event_type": event_type,
        "action": action,
        "plan": plan,
        "status": status,
        "duration_ms": duration_ms,
        "estimated_cost_usd": pricing["estimated_cost_usd"],
        "estimated_revenue_usd": pricing["estimated_revenue_usd"],
        "estimated_value_usd": pricing["estimated_value_usd"],
    }
    if metadata:
        event["metadata"] = metadata
    append_billing_event(event)


def read_billing_events() -> list[dict]:
    if not BILLING_EVENTS_PATH.exists():
        return []

    events = []
    with open(BILLING_EVENTS_PATH, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                events.append(json.loads(line))
            except Exception:
                continue
    return events


def summarize_billing(plan: str) -> dict:
    now = datetime.now()
    month_prefix = now.strftime("%Y-%m")

    all_events = read_billing_events()
    month_events = [e for e in all_events if str(e.get("timestamp", "")).startswith(month_prefix)]

    revenue = sum(float(e.get("estimated_revenue_usd", 0.0)) for e in month_events)
    cost = sum(float(e.get("estimated_cost_usd", 0.0)) for e in month_events)
    value = sum(float(e.get("estimated_value_usd", 0.0)) for e in month_events)
    profit = revenue - cost
    margin_pct = (profit / revenue * 100.0) if revenue > 0 else 0.0

    actions = {}
    for e in month_events:
        key = f"{e.get('event_type', 'unknown')}:{e.get('action', 'unknown')}"
        actions[key] = actions.get(key, 0) + 1

    return {
        "plan": plan,
        "month": month_prefix,
        "events_this_month": len(month_events),
        "estimated_revenue_usd": round(revenue, 4),
        "estimated_cost_usd": round(cost, 4),
        "estimated_value_usd": round(value, 4),
        "estimated_profit_usd": round(profit, 4),
        "gross_margin_pct": round(margin_pct, 2),
        "top_actions": actions,
    }


def normalize_phase_id(phase_id: str) -> str:
    """Strip enhancement suffixes so P30+ still maps to base phase P30."""
    return str(phase_id or "").split("+")[0].strip()


def get_evolution_status() -> dict:
    ev = read_json(EVOLUTION_LOG_PATH, {})
    completed_raw = ev.get("completed_phases", []) if isinstance(ev, dict) else []
    completed = [str(p) for p in completed_raw]
    completed_base = {normalize_phase_id(p) for p in completed}

    next_phase = None
    for phase in EVOLUTION_PHASE_ORDER:
        if phase not in completed_base:
            next_phase = phase
            break

    if next_phase is None:
        # All base phases complete: show first phase in enhanced loop.
        next_phase = f"{EVOLUTION_PHASE_ORDER[0]}+"

    return {
        "completed_phases": completed,
        "completed_count": len(completed),
        "next_phase": next_phase,
    }


def get_recent_logs(n: int = 50):
    if LOG_PATH.exists():
        with open(LOG_PATH, encoding="utf-8") as f:
            return f.readlines()[-n:]
    return []


def get_latest_simulacrum():
    log_dir = BASE_DIR / ".Agentica" / "logs" / "simulacrum"
    if not log_dir.exists():
        return None
    logs = sorted(log_dir.glob("*.json"), key=os.path.getmtime, reverse=True)
    return read_json(logs[0]) if logs else None


def get_optimization_settings() -> dict:
    """Load optimization settings with safe defaults."""
    cfg = read_json(OPTIMIZATION_PATH, {})
    if not isinstance(cfg, dict):
        cfg = {}

    merged = dict(DEFAULT_OPTIMIZATION)
    for key in DEFAULT_OPTIMIZATION:
        if key in cfg:
            merged[key] = cfg[key]

    # Ensure integer intervals are valid.
    for key in ("status_poll_ms", "log_poll_ms", "debate_poll_ms", "debate_check_ms"):
        try:
            merged[key] = max(500, int(merged[key]))
        except Exception:
            merged[key] = DEFAULT_OPTIMIZATION[key]

    merged["economy_mode"] = bool(merged.get("economy_mode", True))
    return merged


def save_optimization_settings(settings: dict):
    OPTIMIZATION_PATH.parent.mkdir(parents=True, exist_ok=True)
    OPTIMIZATION_PATH.write_text(json.dumps(settings, indent=2), encoding="utf-8")


def is_working_tree_clean() -> bool:
    """Return True only when the current git working tree has no pending changes."""
    try:
        result = subprocess.run(
            ["git", "status", "--porcelain"],
            capture_output=True,
            text=True,
            cwd=str(BASE_DIR),
            timeout=10,
        )
        return result.returncode == 0 and not result.stdout.strip()
    except Exception:
        return False


def get_last_evolve_timestamp() -> datetime | None:
    ev = read_json(EVOLUTION_LOG_PATH, {})
    if not isinstance(ev, dict):
        return None
    cycles = ev.get("cycles", [])
    if not cycles:
        return None
    last = cycles[-1].get("timestamp")
    if not last:
        return None
    try:
        return datetime.fromisoformat(str(last))
    except Exception:
        return None


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/")
def root():
    return redirect("/dashboard/index.html")


@app.route("/favicon.ico")
def favicon():
    return "", 204


@app.route("/dashboard/")
@app.route("/dashboard/<path:filename>")
def serve_dashboard(filename="index.html"):
    return send_from_directory(DASHBOARD_DIR, filename)


@app.route("/api/status")
def api_status():
    if not check_auth():
        return jsonify({"error": "Unauthorized"}), 401

    registry_path = BASE_DIR / ".Agentica" / "registry.json"
    vector_path   = BASE_DIR / ".Agentica" / "vector_store.json"
    swarm_path    = BASE_DIR / ".Agentica" / "logs" / "swarm" / "report.json"
    intel_path    = BASE_DIR / ".Agentica" / "competitor_intel.json"
    heartbeat_path= BASE_DIR / ".Agentica" / "logs" / "heartbeat.log"

    registry_data = read_json(registry_path, {})
    vector_data   = read_json(vector_path, {})
    plan = resolve_plan()

    status = {
        "project": "Agenticana",
        "version": "v7.0.0 (Flask Edition)",
        "timestamp": datetime.now().isoformat(),
        "heartbeat": "Active" if heartbeat_path.exists() else "Inactive",
        "swarm": read_json(swarm_path),
        "registry": len(registry_data.get("installed", {})),
        "vector_memory": len(vector_data.get("documents", [])),
        "intel": read_json(intel_path, []),
        "simulacrum": get_latest_simulacrum(),
        "logs": get_recent_logs(),
        "billing": summarize_billing(plan),
        "evolution": get_evolution_status(),
        "optimization": get_optimization_settings(),
    }
    return jsonify(status)


@app.route("/api/run")
def api_run():
    if not check_auth():
        return jsonify({"error": "Unauthorized"}), 401

    task = request.args.get("task", "").strip()
    plan = resolve_plan()
    print(f"[TASK] Received run request for: '{task}'")

    SCRIPT_MAP = {
        "intel":  ["python", str(BASE_DIR / "scripts" / "sovereign_intel.py")],
        "evolve": ["python", str(BASE_DIR / "scripts" / "evolve.py")],
        "audit":  ["python", str(BASE_DIR / "scripts" / "verify_all.py"), "--url", "local"],
    }

    cmd = SCRIPT_MAP.get(task)
    if not cmd:
        print(f"[ERROR] Unknown task: '{task}' — valid: {list(SCRIPT_MAP.keys())}")
        return jsonify({"error": "Task not found", "task": task, "valid": list(SCRIPT_MAP.keys())}), 404

    with TASK_LOCK:
        if task in ACTIVE_TASKS:
            return jsonify({
                "error": "Task already running",
                "task": task,
                "message": f"Task '{task}' is already in progress.",
            }), 409

    if task == "evolve":
        if not is_working_tree_clean():
            return jsonify({
                "error": "Working tree not clean",
                "task": task,
                "message": "Commit or stash local changes before running self-evolve.",
            }), 409

        last_ts = get_last_evolve_timestamp()
        if last_ts is not None:
            age = (datetime.now() - last_ts).total_seconds()
            if age < EVOLVE_COOLDOWN_SECONDS:
                wait_seconds = int(EVOLVE_COOLDOWN_SECONDS - age)
                return jsonify({
                    "error": "Evolve cooldown active",
                    "task": task,
                    "retry_after_seconds": wait_seconds,
                    "message": f"Wait {wait_seconds}s before the next evolution cycle.",
                }), 429

    if not is_feature_allowed(plan, task=task):
        record_billing_event(
            event_type="run",
            action=task,
            plan=plan,
            status="blocked_plan",
            metadata={"reason": "upgrade_required"},
        )
        return jsonify({
            "error": "Upgrade required",
            "plan": plan,
            "task": task,
            "required_plan": "pro" if task == "evolve" else "starter",
            "message": f"Task '{task}' is not available on plan '{plan}'.",
        }), 403

    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    log_file_handle = open(LOG_PATH, "a", encoding="utf-8")
    log_file_handle.write(f"\n--- Starting '{task}' at {datetime.now()} ---\n")
    log_file_handle.flush()

    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"

    start_time = time.time()
    record_billing_event(event_type="run", action=task, plan=plan, status="started")

    with TASK_LOCK:
        ACTIVE_TASKS.add(task)

    proc = subprocess.Popen(cmd, stdout=log_file_handle, stderr=log_file_handle, cwd=str(BASE_DIR), env=env)
    print(f"[EXEC] Launched: {' '.join(cmd)}")

    # ── Background watcher: fires post-commit hook when task finishes ──────────
    def watch_and_commit(process, lf, t):
        try:
            process.wait()  # block until task subprocess exits
            duration_ms = int((time.time() - start_time) * 1000)
            task_status = "success" if process.returncode == 0 else "failed"
            record_billing_event(
                event_type="run",
                action=t,
                plan=plan,
                status=task_status,
                duration_ms=duration_ms,
                metadata={"returncode": process.returncode},
            )
            lf.write(f"\n--- Task '{t}' completed. Running auto-commit hook... ---\n")
            lf.flush()
            hook_cmd = ["python", str(BASE_DIR / "scripts" / "post_task_commit.py"), t]
            hook = subprocess.Popen(hook_cmd, stdout=lf, stderr=lf, cwd=str(BASE_DIR), env=env)
            hook.wait()
            lf.write(f"--- Auto-commit hook done for '{t}' ---\n")
            lf.flush()
            print(f"[HOOK] Post-commit done for task: {t}")
        finally:
            with TASK_LOCK:
                ACTIVE_TASKS.discard(t)
            lf.close()

    watcher = threading.Thread(target=watch_and_commit, args=(proc, log_file_handle, task), daemon=True)
    watcher.start()

    offset = LOG_PATH.stat().st_size if LOG_PATH.exists() else 0
    return jsonify({"status": "started", "task": task, "log_offset": offset})


# ── Debate endpoints ───────────────────────────────────────────────────────────

DEBATE_LOG_PATH = BASE_DIR / ".Agentica" / "logs" / "debate_live.log"
SIMULACRUM_DIR  = BASE_DIR / ".Agentica" / "logs" / "simulacrum"

@app.route("/api/debate", methods=["GET", "POST"])
def api_debate():
    if not check_auth():
        return jsonify({"error": "Unauthorized"}), 401

    topic = request.args.get("topic", "Should Agenticana adopt voice-to-code as its next major feature?").strip()
    plan = resolve_plan()

    if not is_feature_allowed(plan, debate=True):
        record_billing_event(
            event_type="debate",
            action="start",
            plan=plan,
            status="blocked_plan",
            metadata={"reason": "upgrade_required"},
        )
        return jsonify({
            "error": "Upgrade required",
            "plan": plan,
            "required_plan": "pro",
            "message": "Debate chamber is available on Pro and above.",
        }), 403

    agents_param = request.args.get("agents", "backend-specialist,security-auditor,frontend-specialist,devops-engineer")
    agents = [a.strip() for a in agents_param.split(",") if a.strip()]
    rounds = int(request.args.get("rounds", 2))

    # Clear debate log for fresh stream
    DEBATE_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    DEBATE_LOG_PATH.write_text(f"--- Debate started: {topic} ---\n", encoding="utf-8")

    cmd = [
        "python", str(BASE_DIR / "scripts" / "real_simulacrum.py"),
        topic, "--agents"
    ] + agents + ["--rounds", str(rounds)]

    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"
    start_time = time.time()

    record_billing_event(event_type="debate", action="start", plan=plan, status="started")

    proc = subprocess.Popen(
        cmd,
        stdout=open(DEBATE_LOG_PATH, "a", encoding="utf-8"),
        stderr=subprocess.STDOUT,
        cwd=str(BASE_DIR),
        env=env
    )

    def watch_debate(process):
        process.wait()
        duration_ms = int((time.time() - start_time) * 1000)
        debate_status = "success" if process.returncode == 0 else "failed"
        record_billing_event(
            event_type="debate",
            action="start",
            plan=plan,
            status=debate_status,
            duration_ms=duration_ms,
            metadata={"returncode": process.returncode, "agents": len(agents)},
        )

    threading.Thread(target=watch_debate, args=(proc,), daemon=True).start()

    print(f"[DEBATE] Launched simulacrum: {topic[:60]}")

    offset = DEBATE_LOG_PATH.stat().st_size if DEBATE_LOG_PATH.exists() else 0
    return jsonify({"status": "started", "topic": topic, "agents": agents, "log_offset": offset})


@app.route("/api/debate/logs")
def api_debate_logs():
    """Incremental debate log polling by byte offset."""
    if not check_auth():
        return jsonify({"error": "Unauthorized"}), 401

    offset = int(request.args.get("offset", 0))
    if not DEBATE_LOG_PATH.exists():
        return jsonify({"lines": [], "offset": 0})

    size = DEBATE_LOG_PATH.stat().st_size
    if offset >= size:
        return jsonify({"lines": [], "offset": size})

    with open(DEBATE_LOG_PATH, "rb") as f:
        f.seek(max(0, offset))
        raw = f.read()

    lines = raw.decode("utf-8", errors="replace").splitlines()
    return jsonify({"lines": lines, "offset": size})


@app.route("/api/debate/latest")
def api_debate_latest():
    """Return the most recent completed simulacrum session JSON."""
    if not check_auth():
        return jsonify({"error": "Unauthorized"}), 401

    if not SIMULACRUM_DIR.exists():
        return jsonify({"session": None})

    sessions = sorted(SIMULACRUM_DIR.glob("session_*.json"), key=os.path.getmtime, reverse=True)
    if not sessions:
        return jsonify({"session": None})

    try:
        data = json.loads(sessions[0].read_text(encoding="utf-8"))
        return jsonify({"session": data})
    except Exception as e:
        return jsonify({"session": None, "error": str(e)})


# ── Boot ──────────────────────────────────────────────────────────────────────

@app.route("/api/logs")
def api_logs():
    """Return log lines from a byte offset (for incremental polling)."""
    if not check_auth():
        return jsonify({"error": "Unauthorized"}), 401

    offset = int(request.args.get("offset", 0))

    if not LOG_PATH.exists():
        return jsonify({"lines": [], "offset": 0})

    size = LOG_PATH.stat().st_size
    if offset >= size:
        return jsonify({"lines": [], "offset": size})

    with open(LOG_PATH, "rb") as f:
        f.seek(max(0, offset))
        raw = f.read()

    lines = raw.decode("utf-8", errors="replace").splitlines()
    return jsonify({"lines": lines, "offset": size})


@app.route("/api/logs/clear", methods=["POST"])
def api_logs_clear():
    if not check_auth():
        return jsonify({"error": "Unauthorized"}), 401
    if LOG_PATH.exists():
        LOG_PATH.write_text("", encoding="utf-8")
    return jsonify({"status": "cleared"})


@app.route("/api/billing/summary")
def api_billing_summary():
    if not check_auth():
        return jsonify({"error": "Unauthorized"}), 401

    plan = resolve_plan()
    return jsonify(summarize_billing(plan))


@app.route("/api/optimization", methods=["GET", "POST"])
def api_optimization():
    if not check_auth():
        return jsonify({"error": "Unauthorized"}), 401

    if request.method == "GET":
        return jsonify(get_optimization_settings())

    body = request.get_json(silent=True) or {}
    mode = str(body.get("mode", "")).strip().lower()

    if mode == "economy":
        save_optimization_settings(dict(DEFAULT_OPTIMIZATION))
        return jsonify({"status": "updated", "optimization": get_optimization_settings()})

    if mode == "performance":
        save_optimization_settings(dict(PERFORMANCE_OPTIMIZATION))
        return jsonify({"status": "updated", "optimization": get_optimization_settings()})

    return jsonify({"error": "Invalid mode", "valid": ["economy", "performance"]}), 400


if __name__ == "__main__":
    print(f"[*] Agenticana Dashboard API v7.0 — http://127.0.0.1:{PORT}")
    print(f"[*] Serving dashboard from: {DASHBOARD_DIR}")
    print(f"[*] Base dir: {BASE_DIR}")
    app.run(host="0.0.0.0", port=PORT, debug=False)
