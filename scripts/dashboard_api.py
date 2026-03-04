import http.server
import socketserver
import json
import os
from pathlib import Path
from datetime import datetime

# Agentica Control Center API (P22 Secretary Bird Edition)
PORT = 8080
AUTH_KEY_PATH = Path(".Agentica/auth.key")

def get_auth_key():
    if AUTH_KEY_PATH.exists():
        return AUTH_KEY_PATH.read_text().strip()
    return None

class DashboardHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # 1. Root Redirect
        if self.path == '/':
            self.send_response(301)
            self.send_header('Location', '/dashboard/index.html')
            self.end_headers()
            return

        # 2. Security Gate: Check for API Key
        auth_header = self.headers.get('X-Agentica-Auth')
        expected_key = get_auth_key()

        if self.path.startswith('/api/') and auth_header != expected_key:
            self.send_response(401)
            self.end_headers()
            self.wfile.write(b'{"error": "Unauthorized"}')
            return

        # 3. API Endpoints
        if self.path == '/api/status':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Headers', 'X-Agentica-Auth')
            self.end_headers()

            status = {
                "project": "Agenticana",
                "version": "v6.0.0 (SEC BIRD)",
                "timestamp": datetime.now().isoformat(),
                "heartbeat": self.get_latest_heartbeat(),
                "swarm": self.get_latest_swarm(),
                "registry": self.get_registry_count(),
                "vector_memory": self.get_vector_count(),
                "intel": self.get_intel_data(),
                "simulacrum": self.get_latest_simulacrum()
            }
            self.wfile.write(json.dumps(status).encode())
        else:
            # Fallback for static files (dashboard/index.html etc)
            super().do_GET()

    # --- Data Helpers ---

    def get_latest_heartbeat(self):
        path = Path(".Agentica/logs/heartbeat.log")
        return "Active" if path.exists() else "Inactive"

    def get_latest_swarm(self):
        path = Path(".Agentica/logs/swarm/report.json")
        if path.exists():
            with open(path, 'r') as f:
                return json.load(f)
        return None

    def get_intel_data(self):
        path = Path(".Agentica/competitor_intel.json")
        if path.exists():
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return []

    def get_latest_simulacrum(self):
        log_dir = Path(".Agentica/logs/simulacrum")
        if not log_dir.exists():
            return None
        logs = sorted(log_dir.glob("*.json"), key=os.path.getmtime, reverse=True)
        if logs:
            try:
                with open(logs[0], 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                return None
        return None

    def get_registry_count(self):
        path = Path(".Agentica/registry.json")
        if path.exists():
            with open(path, 'r') as f:
                return len(json.load(f).get("installed", {}))
        return 0

    def get_vector_count(self):
        path = Path(".Agentica/vector_store.json")
        if path.exists():
            with open(path, 'r') as f:
                return len(json.load(f).get("documents", []))
        return 0

if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    print(f"[*] Starting Agenticana Dashboard API on http://127.0.0.1:{PORT}...")
    with socketserver.TCPServer(("0.0.0.0", PORT), DashboardHandler) as httpd:
        httpd.serve_forever()
