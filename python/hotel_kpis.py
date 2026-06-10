"""
HotelAudit AI – Hotel-Kennzahlen-Berechnung
Alle Berechnungen basieren ausschließlich auf übergebenen Daten.
Keine erfundenen Zahlen. Fehlende Daten werden als None zurückgegeben.
"""
from __future__ import annotations
from typing import Optional


def safe_div(a: Optional[float], b: Optional[float]) -> Optional[float]:
    if a is None or b is None or b == 0:
        return None
    return a / b


def calculate_hotel_kpis(
    total_revenue: Optional[float],
    total_expenses: Optional[float],
    occupied_nights: Optional[int],
    available_nights: Optional[int],
    room_count: Optional[int],
    days_in_period: Optional[int],
    employee_hours: Optional[float],
    labor_cost: Optional[float],
    energy_cost: Optional[float],
    laundry_cleaning_cost: Optional[float],
    portal_commissions: Optional[float],
    portal_booking_revenue: Optional[float],
) -> dict:
    """Berechnet alle relevanten Hotel-KPIs."""

    # Auslastung
    occupancy_rate = safe_div(occupied_nights, available_nights)
    if occupancy_rate is not None:
        occupancy_rate = round(occupancy_rate * 100, 2)

    # ADR = Average Daily Rate = Umsatz / belegte Nächte
    adr = safe_div(total_revenue, occupied_nights)
    if adr is not None:
        adr = round(adr, 2)

    # RevPAR = Revenue per Available Room = Umsatz / verfügbare Zimmer-Nächte
    revpar = safe_div(total_revenue, available_nights)
    if revpar is not None:
        revpar = round(revpar, 2)

    # Netto-Ergebnis
    net_result = None
    if total_revenue is not None and total_expenses is not None:
        net_result = round(total_revenue - total_expenses, 2)

    # Netto-Marge
    net_margin = safe_div(net_result, total_revenue)
    if net_margin is not None:
        net_margin = round(net_margin * 100, 2)

    # Umsatz pro Tag
    revenue_per_day = safe_div(total_revenue, days_in_period)
    if revenue_per_day is not None:
        revenue_per_day = round(revenue_per_day, 2)

    # Kosten pro belegte Nacht
    cost_per_occupied_night = safe_div(total_expenses, occupied_nights)
    if cost_per_occupied_night is not None:
        cost_per_occupied_night = round(cost_per_occupied_night, 2)

    # Personalkostenquote
    labor_cost_ratio = safe_div(labor_cost, total_revenue)
    if labor_cost_ratio is not None:
        labor_cost_ratio = round(labor_cost_ratio * 100, 2)

    # Mitarbeiterstunden pro belegte Nacht
    hours_per_occupied_night = safe_div(employee_hours, occupied_nights)
    if hours_per_occupied_night is not None:
        hours_per_occupied_night = round(hours_per_occupied_night, 3)

    # Umsatz pro Mitarbeiterstunde
    revenue_per_employee_hour = safe_div(total_revenue, employee_hours)
    if revenue_per_employee_hour is not None:
        revenue_per_employee_hour = round(revenue_per_employee_hour, 2)

    # Energie pro belegte Nacht
    energy_per_occupied_night = safe_div(energy_cost, occupied_nights)
    if energy_per_occupied_night is not None:
        energy_per_occupied_night = round(energy_per_occupied_night, 2)

    # Reinigung/Wäsche pro belegte Nacht
    laundry_per_occupied_night = safe_div(laundry_cleaning_cost, occupied_nights)
    if laundry_per_occupied_night is not None:
        laundry_per_occupied_night = round(laundry_per_occupied_night, 2)

    # Portal-Provisions-Quote
    portal_commission_rate = safe_div(portal_commissions, portal_booking_revenue)
    if portal_commission_rate is not None:
        portal_commission_rate = round(portal_commission_rate * 100, 2)

    # Freie Zimmer (Durchschnitt)
    free_rooms = None
    if room_count is not None and occupancy_rate is not None:
        free_rooms = round(room_count * (1 - occupancy_rate / 100), 1)

    return {
        "totalRevenue": total_revenue,
        "totalExpenses": total_expenses,
        "netResult": net_result,
        "netMarginPercent": net_margin,
        "revenuePerDay": revenue_per_day,
        "occupancyRate": occupancy_rate,
        "occupiedNights": occupied_nights,
        "availableNights": available_nights,
        "freeRooms": free_rooms,
        "adr": adr,
        "revpar": revpar,
        "costPerOccupiedNight": cost_per_occupied_night,
        "laborCostRatio": labor_cost_ratio,
        "totalEmployeeHours": employee_hours,
        "hoursPerOccupiedNight": hours_per_occupied_night,
        "revenuePerEmployeeHour": revenue_per_employee_hour,
        "energyCostPerOccupiedNight": energy_per_occupied_night,
        "laundryCleaningPerOccupiedNight": laundry_per_occupied_night,
        "portalCommissions": portal_commissions,
        "portalCommissionRate": portal_commission_rate,
        "expensesByCategory": {},  # wird von analyze_csv befüllt
    }


def detect_savings_potential(kpis: dict, expenses_by_cat: dict) -> list[dict]:
    """
    Erkennt Sparpotenziale basierend auf berechneten KPIs.
    Alle Schwellenwerte sind betriebswirtschaftliche Richtwerte – keine Garantien.
    """
    potential = []

    # 1. Personalkostenquote
    labor_ratio = kpis.get("laborCostRatio")
    labor_cost = expenses_by_cat.get("personal", 0) or expenses_by_cat.get("Personal", 0) or 0
    if labor_ratio is not None and labor_ratio > 30:
        excess_pct = labor_ratio - 28  # Richtwert ~28%
        estimated_saving = round((labor_cost * (excess_pct / 100)) * 0.5, 0) if labor_cost else None
        potential.append({
            "title": "Personalkostenquote über Richtwert",
            "description": (
                f"Personalkostenquote von {labor_ratio:.1f}% liegt über dem Branchenrichtwert von ~28%. "
                "Flexibler Personaleinsatz bei niedriger Auslastung kann die Quote senken."
            ),
            "estimatedSavingsEur": estimated_saving,
            "priority": "HIGH" if labor_ratio > 35 else "MEDIUM",
            "category": "Personal",
        })

    # 2. Portal-Provisionen
    commission_rate = kpis.get("portalCommissionRate")
    commissions = kpis.get("portalCommissions")
    if commission_rate is not None and commission_rate > 8:
        estimated_saving = round(commissions * 0.2, 0) if commissions else None
        potential.append({
            "title": "Hohe Portalprovisionen",
            "description": (
                f"Durchschnittliche Portalprovision von {commission_rate:.1f}% liegt über dem "
                "Zielwert von ~7%. Direktbuchungsstrategie und eigenes Buchungsmodul empfohlen."
            ),
            "estimatedSavingsEur": estimated_saving,
            "priority": "HIGH",
            "category": "Marketing",
        })

    # 3. Energiekosten
    energy_per_night = kpis.get("energyCostPerOccupiedNight")
    energy_total = expenses_by_cat.get("energie", 0) or expenses_by_cat.get("Energie", 0) or 0
    if energy_per_night is not None and energy_per_night > 10:
        estimated_saving = round(energy_total * 0.12, 0) if energy_total else None
        potential.append({
            "title": "Energiekosten optimierbar",
            "description": (
                f"Energiekosten von {energy_per_night:.2f} EUR/belegte Nacht liegen über dem "
                "Richtwert. Thermostatsteuerung, LED-Beleuchtung und Zeitschalter empfohlen."
            ),
            "estimatedSavingsEur": estimated_saving,
            "priority": "MEDIUM",
            "category": "Energie",
        })

    # 4. Niedrige RevPAR
    revpar = kpis.get("revpar")
    adr = kpis.get("adr")
    occupancy = kpis.get("occupancyRate")
    if revpar is not None and adr is not None and occupancy is not None and occupancy < 60:
        potential.append({
            "title": "Auslastung unter 60% – Revenue-Management prüfen",
            "description": (
                f"Auslastung von {occupancy:.1f}% und RevPAR von {revpar:.2f} EUR deuten auf "
                "ungenutztes Umsatzpotenzial hin. Dynamische Preisgestaltung und Last-Minute-Angebote prüfen."
            ),
            "estimatedSavingsEur": None,
            "priority": "MEDIUM",
            "category": "Revenue Management",
        })

    # Sortieren nach Priorität
    priority_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    potential.sort(key=lambda x: priority_order.get(x["priority"], 2))

    return potential
