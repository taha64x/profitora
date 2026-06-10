#!/usr/bin/env python3
"""
BizAudit AI – Hauptanalyse-Skript
Liest CSV/Excel-Dateien nach Kategorien ein und berechnet universelle Business-KPIs.
Unterstützt alle Unternehmensarten (Hotels, Restaurants, Einzelhandel, Praxen, etc.)

Aufruf:
    python3 analyze_csv.py --config-json '{
        "files": {"REVENUE": ["pfad.csv"]},
        "business_type": "restaurant",
        "unit_count": 40
    }'

Ausgabe: JSON auf stdout
Fehler:  auf stderr, Exit-Code 1
"""

from __future__ import annotations

import json
import sys
import os
import argparse
from datetime import datetime
from typing import Optional, Any

try:
    import pandas as pd
except ImportError:
    print(json.dumps({"success": False, "error": "pandas nicht installiert. Bitte: pip install -r requirements.txt"}))
    sys.exit(1)

from business_kpis import (
    calculate_business_kpis,
    detect_savings_potential,
    LABOR_KEYWORDS,
    ENERGY_KEYWORDS,
    SERVICE_KEYWORDS,
    GOODS_KEYWORDS,
)

# Spaltenmapping-Kandidaten pro Kategorie
REVENUE_COLS = {
    "date":     ["datum", "date", "tag", "buchungsdatum"],
    "amount":   ["betrag", "amount", "umsatz", "einnahme", "revenue", "total", "summe"],
    "category": ["kategorie", "category", "art", "typ"],
}

EXPENSE_COLS = {
    "date":      ["datum", "date", "buchungsdatum"],
    "amount":    ["betrag", "amount", "ausgabe", "kosten", "expense", "summe"],
    "category":  ["kategorie", "category", "art", "kostenstelle"],
    "recurring": ["wiederkehrend", "recurring", "abo"],
}

BOOKING_COLS = {
    "date":            ["datum", "date", "anreise", "arrival", "tag"],
    "rooms_occupied":  ["belegt", "occupied", "zimmer_belegt", "rooms_occupied", "zimmer",
                        "gedecke", "covers", "sitzplätze", "behandlungen", "aufträge",
                        "kunden", "patienten", "einheiten"],
    "rooms_available": ["verfuegbar", "available", "kapazitaet", "total_rooms", "gesamt"],
    "channel":         ["kanal", "channel", "buchungskanal", "source", "plattform"],
    "revenue":         ["umsatz", "revenue", "betrag", "nettoumsatz"],
    "commission":      ["provision", "commission", "provisionssatz"],
}

EMPLOYEE_COLS = {
    "date":        ["datum", "date"],
    "hours":       ["stunden", "hours", "arbeitszeit", "std", "h"],
    "employee_id": ["mitarbeiter_id", "employee_id", "id", "mitarbeiter_nr"],
    "department":  ["abteilung", "department", "bereich"],
    "hourly_rate": ["stundenlohn", "hourly_rate", "lohn", "stundensatz"],
}


def find_column(df: pd.DataFrame, candidates: list[str]) -> Optional[str]:
    """Findet passende Spalte anhand möglicher Namen (case-insensitive)."""
    cols_lower = {c.lower().strip(): c for c in df.columns}
    for candidate in candidates:
        if candidate.lower() in cols_lower:
            return cols_lower[candidate.lower()]
    return None


def resolve_column(
    df: pd.DataFrame,
    field_key: str,
    candidates: list[str],
    explicit_mapping: Optional[dict],
) -> Optional[str]:
    """Gibt Spaltennamen zurück: erst explizites Mapping, dann fuzzy Suche."""
    if explicit_mapping and field_key in explicit_mapping:
        mapped = explicit_mapping[field_key]
        if mapped in df.columns:
            return mapped
    return find_column(df, candidates)


def read_file(path: str) -> Optional[pd.DataFrame]:
    """Liest CSV oder Excel ein."""
    if not os.path.exists(path):
        print(f"[WARN] Datei nicht gefunden: {path}", file=sys.stderr)
        return None
    try:
        if path.lower().endswith(".csv"):
            for encoding in ["utf-8", "utf-8-sig", "latin-1", "cp1252"]:
                try:
                    return pd.read_csv(path, encoding=encoding, sep=None, engine="python")
                except Exception:
                    continue
        else:
            return pd.read_excel(path)
    except Exception as e:
        print(f"[WARN] Fehler beim Lesen von {path}: {e}", file=sys.stderr)
    return None


def clean_numeric(series: pd.Series) -> pd.Series:
    """Bereinigt Zahlenspalten (Komma → Punkt, Sonderzeichen entfernen)."""
    return pd.to_numeric(
        series.astype(str)
              .str.replace(",", ".", regex=False)
              .str.replace(r"[^0-9.\-]", "", regex=True),
        errors="coerce",
    )


def analyze_revenue(file_paths: list[str], mapping: Optional[dict] = None) -> dict:
    dfs = [df for p in file_paths if (df := read_file(p)) is not None]
    if not dfs:
        return {"total": None, "missing": True}

    df = pd.concat(dfs, ignore_index=True)
    amount_col = resolve_column(df, "amount", REVENUE_COLS["amount"], mapping)
    if not amount_col:
        return {"total": None, "missing": True, "error": "Betrag-Spalte nicht gefunden"}

    df[amount_col] = clean_numeric(df[amount_col])
    return {
        "total": round(float(df[amount_col].sum()), 2),
        "rows": len(df),
        "missing": False,
    }


def analyze_expenses(file_paths: list[str], mapping: Optional[dict] = None) -> dict:
    dfs = [df for p in file_paths if (df := read_file(p)) is not None]
    if not dfs:
        return {"total": None, "by_category": {}, "missing": True}

    df = pd.concat(dfs, ignore_index=True)
    amount_col = resolve_column(df, "amount", EXPENSE_COLS["amount"], mapping)
    cat_col = resolve_column(df, "category", EXPENSE_COLS["category"], mapping)

    if not amount_col:
        return {"total": None, "by_category": {}, "missing": True, "error": "Betrag-Spalte nicht gefunden"}

    df[amount_col] = clean_numeric(df[amount_col])
    total = float(df[amount_col].sum())

    by_category: dict[str, float] = {}
    if cat_col:
        grouped = df.groupby(cat_col)[amount_col].sum()
        by_category = {str(k): round(float(v), 2) for k, v in grouped.items() if pd.notna(v)}

    return {
        "total": round(total, 2),
        "by_category": by_category,
        "rows": len(df),
        "missing": False,
    }


def analyze_capacity(
    file_paths: list[str],
    unit_count: Optional[int],
    mapping: Optional[dict] = None,
) -> dict:
    """
    Analysiert Kapazitäts- / Belegungsdaten (universell für alle Unternehmensarten).
    Früher: analyze_bookings – jetzt generisch für Zimmer, Gedecke, Behandlungen, etc.
    """
    dfs = [df for p in file_paths if (df := read_file(p)) is not None]
    if not dfs:
        return {"active_units": None, "available_capacity": None, "days": None, "missing": True}

    df = pd.concat(dfs, ignore_index=True)

    occupied_col = resolve_column(df, "rooms_occupied", BOOKING_COLS["rooms_occupied"], mapping)
    channel_col  = resolve_column(df, "channel",        BOOKING_COLS["channel"],        mapping)
    revenue_col  = resolve_column(df, "revenue",        BOOKING_COLS["revenue"],        mapping)
    commission_col = resolve_column(df, "commission",   BOOKING_COLS["commission"],     mapping)

    active_units: Optional[int] = None
    if occupied_col:
        df[occupied_col] = pd.to_numeric(df[occupied_col], errors="coerce")
        active_units = int(df[occupied_col].sum())

    portal_revenue: float = 0.0
    portal_commissions: float = 0.0

    if channel_col and revenue_col and commission_col:
        df[revenue_col] = clean_numeric(df[revenue_col])
        df[commission_col] = clean_numeric(df[commission_col])

        portal_mask = ~df[channel_col].astype(str).str.lower().str.contains(
            "direkt|direct|own|eigen|walk.in", na=False
        )
        portal_df = df[portal_mask]
        portal_revenue = float(portal_df[revenue_col].sum())
        portal_commissions = float(
            (portal_df[revenue_col] * portal_df[commission_col] / 100).sum()
        )

    days = len(df) if len(df) > 0 else None
    available_capacity = (unit_count * days) if (unit_count and days) else None

    return {
        "active_units": active_units,
        "available_capacity": available_capacity,
        "days": days,
        "portal_revenue": round(portal_revenue, 2) if portal_revenue else None,
        "portal_commissions": round(portal_commissions, 2) if portal_commissions else None,
        "missing": False,
    }


def analyze_employee_hours(file_paths: list[str], mapping: Optional[dict] = None) -> dict:
    dfs = [df for p in file_paths if (df := read_file(p)) is not None]
    if not dfs:
        return {"total_hours": None, "labor_cost": None, "missing": True}

    df = pd.concat(dfs, ignore_index=True)
    hours_col = resolve_column(df, "hours", EMPLOYEE_COLS["hours"], mapping)
    rate_col  = resolve_column(df, "hourly_rate", EMPLOYEE_COLS["hourly_rate"], mapping)

    if not hours_col:
        return {"total_hours": None, "labor_cost": None, "missing": True, "error": "Stunden-Spalte nicht gefunden"}

    df[hours_col] = pd.to_numeric(df[hours_col].astype(str).str.replace(",", ".", regex=False), errors="coerce")
    total_hours = float(df[hours_col].sum())

    labor_cost: Optional[float] = None
    if rate_col:
        df[rate_col] = clean_numeric(df[rate_col])
        labor_cost = float((df[hours_col] * df[rate_col]).sum())

    return {
        "total_hours": round(total_hours, 2),
        "labor_cost": round(labor_cost, 2) if labor_cost else None,
        "missing": False,
    }


def build_expense_breakdown(expenses_by_cat: dict[str, float], total: float) -> list[dict]:
    if not expenses_by_cat or not total:
        return []
    return [
        {
            "category": cat,
            "amount": amount,
            "percent": round((amount / total) * 100, 1),
        }
        for cat, amount in sorted(expenses_by_cat.items(), key=lambda x: -x[1])
    ]


def get_headers(file_path: str) -> None:
    """Gibt Spaltennamen einer CSV/Excel-Datei als JSON aus."""
    df = read_file(file_path)
    if df is None:
        print(json.dumps({"success": False, "error": f"Datei konnte nicht gelesen werden: {file_path}"}))
        sys.exit(1)
    print(json.dumps({"success": True, "columns": list(df.columns)}, ensure_ascii=False))


def sum_by_keywords(expenses_by_cat: dict[str, float], keywords: list[str]) -> float:
    return sum(v for k, v in expenses_by_cat.items() if any(kw in k.lower() for kw in keywords))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config-json", help="JSON-Konfiguration für die Analyse")
    parser.add_argument("--mode", choices=["analyze", "headers"], default="analyze")
    parser.add_argument("--file", help="Dateipfad (nur für --mode headers)")
    args = parser.parse_args()

    if args.mode == "headers":
        if not args.file:
            print(json.dumps({"success": False, "error": "--file ist erforderlich für --mode headers"}))
            sys.exit(1)
        get_headers(args.file)
        return

    if not args.config_json:
        print(json.dumps({"success": False, "error": "--config-json ist erforderlich für --mode analyze"}))
        sys.exit(1)

    try:
        config = json.loads(args.config_json)
    except json.JSONDecodeError as e:
        print(json.dumps({"success": False, "error": f"Ungültiges JSON: {e}"}))
        sys.exit(1)

    files: dict[str, list[str]] = config.get("files", {})
    unit_count: Optional[int] = config.get("unit_count") or config.get("room_count")  # Rückwärtskompatibilität
    business_type: str = config.get("business_type", "other")
    business_name: str = config.get("business_name", "")
    column_mapping: dict[str, dict[str, str]] = config.get("column_mapping", {})

    missing_data: list[str] = []
    warnings: list[str] = []

    # Einnahmen
    revenue_data = analyze_revenue(files.get("REVENUE", []), column_mapping.get("REVENUE"))
    if revenue_data.get("missing"):
        missing_data.append("Einnahmen – bitte Einnahmen-CSV hochladen")

    # Ausgaben
    expense_data = analyze_expenses(files.get("EXPENSES", []), column_mapping.get("EXPENSES"))
    if expense_data.get("missing"):
        missing_data.append("Ausgaben – bitte Ausgaben-CSV hochladen")

    # Kapazität / Auslastung (Buchungen, Gedecke, Behandlungen, etc.)
    capacity_data = analyze_capacity(
        files.get("BOOKINGS", []), unit_count, column_mapping.get("BOOKINGS")
    )
    if capacity_data.get("missing"):
        missing_data.append("Auslastungsdaten – bitte Buchungs-/Belegungs-/Auslastungs-CSV hochladen")

    # Mitarbeiterzeiten
    employee_data = analyze_employee_hours(
        files.get("EMPLOYEE_HOURS", []), column_mapping.get("EMPLOYEE_HOURS")
    )
    if employee_data.get("missing"):
        missing_data.append("Mitarbeiterzeiten – bitte Arbeitszeitnachweise hochladen")

    if not unit_count:
        warnings.append("Kapazitätszahl (Einheitenanzahl) nicht angegeben – Auslastungsberechnung eingeschränkt")

    # Ausgaben nach Kategorien aufschlüsseln
    expenses_by_cat = expense_data.get("by_category", {})

    # Spezifische Kostenkategorien summieren
    energy_cost  = sum_by_keywords(expenses_by_cat, ENERGY_KEYWORDS)
    service_cost = sum_by_keywords(expenses_by_cat, SERVICE_KEYWORDS)
    goods_cost   = sum_by_keywords(expenses_by_cat, GOODS_KEYWORDS)

    # Personalkosten: aus Mitarbeiterdaten oder Ausgaben-Kategorien
    labor_cost = (
        employee_data.get("labor_cost")
        or sum_by_keywords(expenses_by_cat, LABOR_KEYWORDS)
        or None
    )

    # KPIs berechnen
    kpis = calculate_business_kpis(
        business_type=business_type,
        total_revenue=revenue_data.get("total"),
        total_expenses=expense_data.get("total"),
        active_units=capacity_data.get("active_units"),
        available_capacity=capacity_data.get("available_capacity"),
        unit_count=unit_count,
        days_in_period=capacity_data.get("days"),
        employee_hours=employee_data.get("total_hours"),
        labor_cost=labor_cost,
        energy_cost=energy_cost or None,
        service_cost=service_cost or None,
        portal_commissions=capacity_data.get("portal_commissions"),
        portal_booking_revenue=capacity_data.get("portal_revenue"),
        goods_cost=goods_cost or None,
    )

    kpis["expensesByCategory"] = expenses_by_cat

    savings = detect_savings_potential(kpis, expenses_by_cat, business_type)
    expense_breakdown = build_expense_breakdown(expenses_by_cat, expense_data.get("total") or 0)

    result = {
        "success": True,
        "analyzedAt": datetime.now().isoformat(),
        "businessType": business_type,
        "businessName": business_name,
        "businessKpis": kpis,
        "savingsPotential": savings,
        "expenseBreakdown": expense_breakdown,
        "missingData": missing_data,
        "warnings": warnings,
    }

    print(json.dumps(result, ensure_ascii=False, default=str))


if __name__ == "__main__":
    main()
