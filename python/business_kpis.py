"""
BizAudit AI – Universelles Business-KPI-Berechnungsmodul
Unterstützt alle Unternehmensarten: Hotels, Restaurants, Einzelhandel, Praxen, Handwerk, etc.

Quellen der Branchenbenchmarks:
- Gastronomie: DEHOGA, dish.co Kennzahlen, gastroinsider.de (Schnitt 2026: ~40% Personal)
- Einzelhandel: HDE, controllingportal.de (Personal ~14%, Wareneinsatz je Segment)
- Arztpraxis: rebmann-research.de (Personal 19–30%), medikom.org (Stundenumsatz 350–450 EUR Top)
- Bäckerei/Handwerk: baeckerhandwerk.de, handwerk-magazin.de (Personal ~44%, Material 25–40%)
- Hotel: DEHOGA, HotelAudit (Personal ~28%, ADR/RevPAR/Auslastung)
"""
from __future__ import annotations
from typing import Optional


BUSINESS_TYPE_BENCHMARKS: dict[str, dict] = {
    "hotel": {
        "laborCostRatio":       {"target": 28,  "warning": 30,  "critical": 35},
        "utilizationRate":      {"target": 60,  "warning": 50,  "critical": 40},
        "energyCostPerUnit":    {"target": 10,  "warning": 15,  "critical": 20},
        "portalCommissionRate": {"target": 8,   "warning": 12,  "critical": 15},
        "netMarginPercent":     {"target": 10,  "warning": 5,   "critical": 0},
    },
    "restaurant": {
        "laborCostRatio":       {"target": 32,  "warning": 40,  "critical": 45},
        "goodsCostRatio":       {"target": 30,  "warning": 35,  "critical": 38},
        "primeCostRatio":       {"target": 60,  "warning": 65,  "critical": 70},
        "portalCommissionRate": {"target": 15,  "warning": 20,  "critical": 25},
        "netMarginPercent":     {"target": 8,   "warning": 4,   "critical": 1},
    },
    "cafe_bakery": {
        "laborCostRatio":       {"target": 38,  "warning": 44,  "critical": 50},
        "goodsCostRatio":       {"target": 30,  "warning": 35,  "critical": 40},
        "netMarginPercent":     {"target": 10,  "warning": 5,   "critical": 2},
    },
    "retail": {
        "laborCostRatio":       {"target": 14,  "warning": 18,  "critical": 22},
        "goodsCostRatio":       {"target": 60,  "warning": 68,  "critical": 75},
        "grossMarginPercent":   {"target": 40,  "warning": 32,  "critical": 25},
        "netMarginPercent":     {"target": 5,   "warning": 2,   "critical": 0},
    },
    "medical": {
        "laborCostRatio":       {"target": 25,  "warning": 30,  "critical": 35},
        "utilizationRate":      {"target": 85,  "warning": 75,  "critical": 65},
        "netMarginPercent":     {"target": 20,  "warning": 12,  "critical": 5},
    },
    "craft": {
        "laborCostRatio":       {"target": 35,  "warning": 42,  "critical": 48},
        "goodsCostRatio":       {"target": 30,  "warning": 38,  "critical": 45},
        "netMarginPercent":     {"target": 10,  "warning": 5,   "critical": 2},
    },
    "fitness": {
        "laborCostRatio":       {"target": 30,  "warning": 38,  "critical": 45},
        "utilizationRate":      {"target": 70,  "warning": 55,  "critical": 40},
        "netMarginPercent":     {"target": 20,  "warning": 10,  "critical": 3},
    },
    "beauty": {
        "laborCostRatio":       {"target": 35,  "warning": 42,  "critical": 50},
        "utilizationRate":      {"target": 80,  "warning": 65,  "critical": 50},
        "goodsCostRatio":       {"target": 12,  "warning": 18,  "critical": 22},
        "netMarginPercent":     {"target": 15,  "warning": 8,   "critical": 2},
    },
    "consulting": {
        "laborCostRatio":       {"target": 45,  "warning": 55,  "critical": 65},
        "netMarginPercent":     {"target": 20,  "warning": 12,  "critical": 5},
    },
    "other": {
        "laborCostRatio":       {"target": 30,  "warning": 40,  "critical": 50},
        "netMarginPercent":     {"target": 8,   "warning": 3,   "critical": 0},
    },
}

LABOR_KEYWORDS = ["personal", "lohn", "gehalt", "mitarbeiter", "labor", "löhne", "personalkosten"]
ENERGY_KEYWORDS = ["energie", "strom", "gas", "wasser", "energy", "heizung"]
SERVICE_KEYWORDS = ["wäsche", "reinigung", "cleaning", "laundry", "housekeeping", "service"]
GOODS_KEYWORDS = [
    "waren", "material", "rohstoff", "lebensmittel", "zutaten", "einkauf",
    "wareneinsatz", "food", "getränke", "beverage",
]


def safe_div(a: Optional[float], b: Optional[float]) -> Optional[float]:
    if a is None or b is None or b == 0:
        return None
    return a / b


def calculate_materiality(
    total_revenue: Optional[float], net_result: Optional[float]
) -> Optional[dict]:
    """Wesentlichkeitsschwelle analog ISA 320 / IDW PS 250.

    Richtwert (KEIN starrer Standard, ISA 320 = Ermessenssache):
    - gewinnorientiert mit tragfähigem Ergebnis: ~5 % des Ergebnisses vor Steuern
    - dünnes/negatives Ergebnis: stabiler ~1 % des Umsatzes
    Performance Materiality (Toleranzwesentlichkeit) konservativ bei 75 %.
    """
    has_margin = (
        net_result is not None
        and total_revenue
        and total_revenue > 0
        and net_result > 0
        and (net_result / total_revenue) >= 0.03
    )
    if has_margin:
        materiality = round(0.05 * net_result, 2)
        basis = "≈5 % des Ergebnisses vor Steuern (Richtwert ISA 320 – Ermessenssache)"
    elif total_revenue and total_revenue > 0:
        materiality = round(0.01 * total_revenue, 2)
        basis = "≈1 % des Umsatzes (Richtwert ISA 320, da Ergebnis dünn/negativ)"
    elif net_result and net_result > 0:
        materiality = round(0.05 * net_result, 2)
        basis = "≈5 % des Ergebnisses (Richtwert ISA 320)"
    else:
        return None
    return {
        "materiality": materiality,
        "performanceMateriality": round(materiality * 0.75, 2),
        "basis": basis,
    }


def detect_plausibility_flags(kpis: dict, expenses_by_cat: dict) -> list[dict]:
    """Plausibilitäts-/Auffälligkeitsprüfung (analytische Prüfungshandlungen +
    professionelle Skepsis, ISA 520/240). Liefert HINWEISE ZUR SELBSTPRÜFUNG,
    ausdrücklich KEINE Betrugsbehauptung. An Assertions (ISA 315) angelehnt."""
    flags: list[dict] = []
    rev = kpis.get("totalRevenue")
    exp = kpis.get("totalExpenses")
    net_margin = kpis.get("netMarginPercent")
    labor = kpis.get("laborCostRatio")
    goods = kpis.get("goodsCostRatio")

    # Kostenkonzentration – Vollständigkeit/Klassifizierung
    if expenses_by_cat and exp and exp > 0:
        top_cat, top_val = max(expenses_by_cat.items(), key=lambda kv: kv[1])
        if top_val / exp > 0.6:
            flags.append({
                "type": "Kostenkonzentration",
                "assertion": "Vollständigkeit/Klassifizierung",
                "severity": "MITTEL",
                "message": (
                    f"Eine einzelne Kategorie ('{top_cat}') macht {top_val / exp * 100:.0f}% "
                    "aller Ausgaben aus. Bitte prüfen, ob weitere Kosten fehlen oder die "
                    "Zuordnung korrekt ist."
                ),
            })

    # Unplausibel hohe Marge – Vollständigkeit der Ausgaben
    if net_margin is not None and net_margin > 50:
        flags.append({
            "type": "Margenplausibilität",
            "assertion": "Vollständigkeit",
            "severity": "MITTEL",
            "message": (
                f"Nettomarge von {net_margin:.1f}% ist ungewöhnlich hoch. Bitte prüfen, "
                "ob alle Ausgaben (z. B. Personal, Miete, Steuern) vollständig erfasst sind."
            ),
        })

    # Waren-/Materialquote > 100 % – Genauigkeit/Datenkonsistenz
    if goods is not None and goods > 100:
        flags.append({
            "type": "Datenkonsistenz",
            "assertion": "Genauigkeit",
            "severity": "HOCH",
            "message": (
                f"Waren-/Materialquote von {goods:.0f}% übersteigt den Umsatz – Hinweis auf "
                "mögliche Daten- oder Zuordnungsfehler."
            ),
        })

    # Kaum Personalkosten trotz Umsatz – Vollständigkeit
    if rev and rev > 0 and (labor is None or labor < 3):
        flags.append({
            "type": "Datenvollständigkeit",
            "assertion": "Vollständigkeit",
            "severity": "NIEDRIG",
            "message": (
                "Es wurden kaum/keine Personalkosten erkannt. Falls Personal beschäftigt "
                "wird, fehlen vermutlich Daten."
            ),
        })

    # Ausgaben deutlich über Umsatz – Ergebnislage
    if rev and exp and rev > 0 and exp > rev * 1.2:
        flags.append({
            "type": "Ergebnislage",
            "assertion": "Genauigkeit/Periodenabgrenzung",
            "severity": "HOCH",
            "message": (
                f"Die Ausgaben übersteigen den Umsatz um {(exp / rev - 1) * 100:.0f}%. "
                "Verlustsituation – Kostenstruktur und Datengrundlage (richtige Periode?) prüfen."
            ),
        })

    severity_order = {"HOCH": 0, "MITTEL": 1, "NIEDRIG": 2}
    flags.sort(key=lambda f: severity_order.get(f.get("severity", "NIEDRIG"), 2))
    return flags


def calculate_business_kpis(
    business_type: str,
    total_revenue: Optional[float],
    total_expenses: Optional[float],
    active_units: Optional[int],
    available_capacity: Optional[int],
    unit_count: Optional[int],
    days_in_period: Optional[int],
    employee_hours: Optional[float],
    labor_cost: Optional[float],
    energy_cost: Optional[float],
    service_cost: Optional[float],
    portal_commissions: Optional[float],
    portal_booking_revenue: Optional[float],
    goods_cost: Optional[float],
) -> dict:
    """Berechnet universelle und branchenspezifische KPIs."""

    # Verfügbare Kapazität aus unit_count × Tage ableiten
    if available_capacity is None and unit_count and days_in_period:
        available_capacity = unit_count * days_in_period

    # Ergebnis
    net_result = None
    if total_revenue is not None and total_expenses is not None:
        net_result = round(total_revenue - total_expenses, 2)

    net_margin = safe_div(net_result, total_revenue)
    if net_margin is not None:
        net_margin = round(net_margin * 100, 2)

    revenue_per_day = safe_div(total_revenue, days_in_period)
    if revenue_per_day is not None:
        revenue_per_day = round(revenue_per_day, 2)

    # Auslastung / Kapazität
    utilization_rate = safe_div(active_units, available_capacity)
    if utilization_rate is not None:
        utilization_rate = round(utilization_rate * 100, 2)

    revenue_per_unit = safe_div(total_revenue, active_units)
    if revenue_per_unit is not None:
        revenue_per_unit = round(revenue_per_unit, 2)

    revenue_per_available_unit = safe_div(total_revenue, available_capacity)
    if revenue_per_available_unit is not None:
        revenue_per_available_unit = round(revenue_per_available_unit, 2)

    cost_per_active_unit = safe_div(total_expenses, active_units)
    if cost_per_active_unit is not None:
        cost_per_active_unit = round(cost_per_active_unit, 2)

    unused_capacity = None
    if unit_count is not None and utilization_rate is not None:
        unused_capacity = round(unit_count * (1 - utilization_rate / 100), 1)

    # Personal
    labor_cost_ratio = safe_div(labor_cost, total_revenue)
    if labor_cost_ratio is not None:
        labor_cost_ratio = round(labor_cost_ratio * 100, 2)

    hours_per_unit = safe_div(employee_hours, active_units)
    if hours_per_unit is not None:
        hours_per_unit = round(hours_per_unit, 3)

    revenue_per_employee_hour = safe_div(total_revenue, employee_hours)
    if revenue_per_employee_hour is not None:
        revenue_per_employee_hour = round(revenue_per_employee_hour, 2)

    # Energie & Services
    energy_cost_per_unit = safe_div(energy_cost, active_units)
    if energy_cost_per_unit is not None:
        energy_cost_per_unit = round(energy_cost_per_unit, 2)

    service_cost_per_unit = safe_div(service_cost, active_units)
    if service_cost_per_unit is not None:
        service_cost_per_unit = round(service_cost_per_unit, 2)

    # Portal/Plattform-Provisionen
    portal_commission_rate = safe_div(portal_commissions, portal_booking_revenue)
    if portal_commission_rate is not None:
        portal_commission_rate = round(portal_commission_rate * 100, 2)

    # Waren- / Materialkosten
    goods_cost_ratio = safe_div(goods_cost, total_revenue)
    if goods_cost_ratio is not None:
        goods_cost_ratio = round(goods_cost_ratio * 100, 2)

    gross_margin = None
    gross_margin_percent = None
    if total_revenue is not None and goods_cost is not None:
        gross_margin = round(total_revenue - goods_cost, 2)
        gross_margin_percent = safe_div(gross_margin, total_revenue)
        if gross_margin_percent is not None:
            gross_margin_percent = round(gross_margin_percent * 100, 2)

    # Prime Cost (Gastronomie: Waren + Personal)
    prime_cost_ratio = None
    if goods_cost_ratio is not None and labor_cost_ratio is not None:
        prime_cost_ratio = round(goods_cost_ratio + labor_cost_ratio, 2)

    benchmarks = BUSINESS_TYPE_BENCHMARKS.get(business_type, BUSINESS_TYPE_BENCHMARKS["other"])

    return {
        "businessType": business_type,
        "totalRevenue": total_revenue,
        "revenuePerDay": revenue_per_day,
        "totalExpenses": total_expenses,
        "expensesByCategory": {},
        "netResult": net_result,
        "netMarginPercent": net_margin,
        "utilizationRate": utilization_rate,
        "activeUnits": active_units,
        "availableCapacity": available_capacity,
        "unusedCapacity": unused_capacity,
        "revenuePerUnit": revenue_per_unit,
        "revenuePerAvailableUnit": revenue_per_available_unit,
        "costPerActiveUnit": cost_per_active_unit,
        "laborCostRatio": labor_cost_ratio,
        "totalEmployeeHours": employee_hours,
        "hoursPerUnit": hours_per_unit,
        "revenuePerEmployeeHour": revenue_per_employee_hour,
        "energyCostPerUnit": energy_cost_per_unit,
        "serviceCostPerUnit": service_cost_per_unit,
        "portalCommissions": portal_commissions,
        "portalCommissionRate": portal_commission_rate,
        "goodsCostRatio": goods_cost_ratio,
        "grossMargin": gross_margin,
        "grossMarginPercent": gross_margin_percent,
        "primeCostRatio": prime_cost_ratio,
        "benchmarks": benchmarks,
    }


def detect_savings_potential(kpis: dict, expenses_by_cat: dict, business_type: str) -> list[dict]:
    """Erkennt Sparpotenziale basierend auf KPIs und Branchenrichtwerten."""
    potential: list[dict] = []
    benchmarks = kpis.get("benchmarks", {})

    # 1. Personalkostenquote
    labor_ratio = kpis.get("laborCostRatio")
    lb = benchmarks.get("laborCostRatio", {})
    labor_target = lb.get("target", 30)
    labor_warning = lb.get("warning", 38)
    labor_critical = lb.get("critical", 45)

    if labor_ratio is not None and labor_ratio > labor_warning:
        labor_cost_total = sum(
            v for k, v in expenses_by_cat.items()
            if any(kw in k.lower() for kw in LABOR_KEYWORDS)
        )
        excess_pct = labor_ratio - labor_target
        estimated_saving = round(labor_cost_total * (excess_pct / 100) * 0.5, 0) if labor_cost_total else None
        potential.append({
            "title": "Personalkostenquote über Branchenrichtwert",
            "description": (
                f"Personalkostenquote von {labor_ratio:.1f}% liegt über dem Branchenrichtwert "
                f"von ~{labor_target}%. Schichtoptimierung, flexibler Personaleinsatz und "
                "Prozessautomatisierung können die Quote senken."
            ),
            "estimatedSavingsEur": estimated_saving,
            "priority": "HIGH" if labor_ratio > labor_critical else "MEDIUM",
            "category": "Personal",
        })

    # 2. Portal- / Plattform-Provisionen
    commission_rate = kpis.get("portalCommissionRate")
    commissions = kpis.get("portalCommissions")
    pb = benchmarks.get("portalCommissionRate", {})
    commission_target = pb.get("target")

    if commission_rate is not None and commission_target and commission_rate > commission_target:
        estimated_saving = round(commissions * 0.2, 0) if commissions else None
        platform_label = "Lieferplattform" if business_type in ["restaurant", "cafe_bakery"] else "Buchungsportal"
        potential.append({
            "title": f"Hohe {platform_label}-Provisionen",
            "description": (
                f"Durchschnittliche Provision von {commission_rate:.1f}% liegt über dem "
                f"Zielwert von ~{commission_target}%. Direktbuchungsstrategie, eigener "
                "Online-Auftritt und Stammkundenprogramm empfohlen."
            ),
            "estimatedSavingsEur": estimated_saving,
            "priority": "HIGH",
            "category": "Marketing",
        })

    # 3. Energiekosten
    energy_per_unit = kpis.get("energyCostPerUnit")
    energy_cost_total = sum(
        v for k, v in expenses_by_cat.items()
        if any(kw in k.lower() for kw in ENERGY_KEYWORDS)
    )
    if energy_per_unit is not None and energy_per_unit > 10:
        estimated_saving = round(energy_cost_total * 0.12, 0) if energy_cost_total else None
        potential.append({
            "title": "Energiekosten optimierbar",
            "description": (
                f"Energiekosten von {energy_per_unit:.2f} EUR/Einheit liegen über dem Richtwert. "
                "Smarte Thermostatsteuerung, LED-Umrüstung, Verbrauchsmessung und "
                "Lastspitzenoptimierung können ~10–15% einsparen."
            ),
            "estimatedSavingsEur": estimated_saving,
            "priority": "MEDIUM",
            "category": "Energie",
        })

    # 4. Waren- / Material- / Rohstoffkosten
    goods_ratio = kpis.get("goodsCostRatio")
    gb = benchmarks.get("goodsCostRatio", {})
    goods_target = gb.get("target")

    if goods_ratio is not None and goods_target and goods_ratio > goods_target * 1.08:
        goods_cost_total = sum(
            v for k, v in expenses_by_cat.items()
            if any(kw in k.lower() for kw in GOODS_KEYWORDS)
        )
        excess_pct = goods_ratio - goods_target
        estimated_saving = round(goods_cost_total * (excess_pct / 100) * 0.4, 0) if goods_cost_total else None
        label_map = {
            "retail": "Wareneinsatz", "restaurant": "Wareneinsatz / Food Cost",
            "cafe_bakery": "Rohstoff- / Zutatenkosten", "craft": "Materialkosten",
            "beauty": "Produktkosten",
        }
        cat_label = label_map.get(business_type, "Waren- / Materialkosten")
        potential.append({
            "title": f"Hohe {cat_label}quote",
            "description": (
                f"{cat_label}quote von {goods_ratio:.1f}% liegt über dem Branchenrichtwert "
                f"von ~{goods_target}%. Lieferantenvergleich, Mengenrabatte, "
                "Waste-Reduktion und Einkaufsoptimierung prüfen."
            ),
            "estimatedSavingsEur": estimated_saving,
            "priority": "HIGH" if goods_ratio > goods_target * 1.15 else "MEDIUM",
            "category": "Wareneinsatz",
        })

    # 5. Niedrige Auslastung
    utilization = kpis.get("utilizationRate")
    ub = benchmarks.get("utilizationRate", {})
    utilization_target = ub.get("target")

    if utilization is not None and utilization_target and utilization < utilization_target * 0.85:
        potential.append({
            "title": "Auslastung unter Zielwert – Kapazitätsmanagement prüfen",
            "description": (
                f"Auslastung von {utilization:.1f}% liegt unter dem Branchenzielwert von "
                f"~{utilization_target}%. Dynamische Preisgestaltung, gezielte Marketingmaßnahmen, "
                "Angebotsdiversifizierung und Stammkundenbindung können die Auslastung steigern."
            ),
            "estimatedSavingsEur": None,
            "priority": "MEDIUM",
            "category": "Revenue Management",
        })

    # 6. Kritische Nettomarge
    net_margin = kpis.get("netMarginPercent")
    mb = benchmarks.get("netMarginPercent", {})
    margin_critical = mb.get("critical")

    if net_margin is not None and margin_critical is not None and net_margin < margin_critical:
        potential.append({
            "title": "Nettomarge kritisch – Gesamtkostenstruktur prüfen",
            "description": (
                f"Nettomarge von {net_margin:.1f}% liegt unter dem kritischen Schwellenwert "
                f"({margin_critical}%). Eine vollständige Analyse aller Kostenpositionen sowie "
                "Maßnahmen zur Umsatzsteigerung werden dringend empfohlen."
            ),
            "estimatedSavingsEur": None,
            "priority": "HIGH",
            "category": "Gesamtstruktur",
        })

    priority_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    potential.sort(key=lambda x: priority_order.get(x.get("priority", "LOW"), 2))
    return potential[:5]
