import { redirect } from 'next/navigation'

// Alter öffentlicher Analyse-Konfigurator (AnalysisRequest-Flow) ist stillgelegt —
// eine Pipeline statt zwei (Spec §5.3). Der Link wird zum Lead-Funnel für die
// Einzelanalyse; eingeloggte Nutzer starten Analysen im Dashboard-Wizard.
export default function LegacyAnalyzeRedirect() {
  redirect('/register?plan=single')
}
