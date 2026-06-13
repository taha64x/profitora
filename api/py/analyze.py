"""Vercel Python Serverless Function – Brücke zur Analyse-Engine.

Stellt die bestehende pandas-Logik aus ``python/analyze_csv.py`` als HTTP-Endpunkt
bereit, damit die Next.js-Node-Routes sie auf Vercel aufrufen können
(child_process/python3 ist auf Vercel-Serverless nicht verfügbar).

Endpunkt:  POST /api/py/analyze
Body (JSON):
    { "mode": "analyze", "config": { ...analyze_csv-Config... } }
    { "mode": "headers", "file": "<blob-url-oder-pfad>" }

Auth: Header ``x-internal-token`` muss ``PY_INTERNAL_TOKEN`` (env) entsprechen,
sofern gesetzt – verhindert öffentlichen Missbrauch der Funktion.
"""

from __future__ import annotations

import hmac
import json
import os
import sys
from http.server import BaseHTTPRequestHandler

# Analyse-Engine aus dem python/-Verzeichnis importierbar machen.
# Auf Vercel wird python/ via vercel.json (includeFiles) mitgebündelt.
_ROOT = os.path.dirname(os.path.abspath(__file__))
for _candidate in (
    os.path.join(_ROOT, "..", "..", "python"),  # Repo-Layout: api/py -> python/
    os.path.join(_ROOT, "python"),               # falls flach mitgebündelt
    _ROOT,
):
    if os.path.isdir(_candidate) and _candidate not in sys.path:
        sys.path.insert(0, _candidate)


def _process(payload: dict) -> tuple[int, dict]:
    """Verarbeitet die Anfrage und liefert (HTTP-Status, Ergebnis-Dict)."""
    try:
        import analyze_csv  # noqa: WPS433 – bewusst lazy, nach sys.path-Setup
    except Exception as exc:  # pragma: no cover - Import-/Dependency-Fehler
        return 500, {"success": False, "error": f"Analyse-Engine nicht ladbar: {exc}"}

    mode = payload.get("mode", "analyze")

    if mode == "headers":
        file_path = payload.get("file")
        if not file_path:
            return 400, {"success": False, "error": "'file' fehlt für mode=headers"}
        result = analyze_csv.get_headers_result(file_path)
        return (200 if result.get("success") else 422), result

    if mode == "analyze":
        config = payload.get("config")
        if not isinstance(config, dict):
            return 400, {"success": False, "error": "'config' (Objekt) fehlt für mode=analyze"}
        try:
            result = analyze_csv.run_analysis(config)
        except Exception as exc:  # pragma: no cover
            return 500, {"success": False, "error": f"Analyse fehlgeschlagen: {exc}"}
        return 200, result

    return 400, {"success": False, "error": f"Unbekannter mode: {mode}"}


class handler(BaseHTTPRequestHandler):
    def _send(self, status: int, body: dict) -> None:
        data = json.dumps(body, ensure_ascii=False, default=str).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self) -> None:  # noqa: N802 – von BaseHTTPRequestHandler vorgegeben
        # Fail-closed: Token ist Pflicht. Ohne konfigurierten Token verweigert die
        # Funktion jede Anfrage (sonst wäre der Endpunkt öffentlich missbrauchbar).
        expected = os.environ.get("PY_INTERNAL_TOKEN")
        if not expected:
            self._send(
                503,
                {"success": False, "error": "Server nicht konfiguriert (PY_INTERNAL_TOKEN fehlt)."},
            )
            return
        provided = self.headers.get("x-internal-token") or ""
        if not hmac.compare_digest(provided, expected):
            self._send(401, {"success": False, "error": "Nicht autorisiert."})
            return

        try:
            length = int(self.headers.get("Content-Length", 0))
            raw = self.rfile.read(length) if length else b"{}"
            payload = json.loads(raw or b"{}")
        except (ValueError, json.JSONDecodeError) as exc:
            self._send(400, {"success": False, "error": f"Ungültiger Request-Body: {exc}"})
            return

        status, body = _process(payload)
        self._send(status, body)

    def do_GET(self) -> None:  # noqa: N802 – einfacher Health-Check
        self._send(200, {"success": True, "service": "profitora-python-analyze"})
