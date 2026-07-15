import { redirect } from 'next/navigation'

// Stillgelegt — siehe src/app/analyze/page.tsx (Spec §5.3).
export default function LegacyAnalyzeUploadRedirect() {
  redirect('/register?plan=single')
}
