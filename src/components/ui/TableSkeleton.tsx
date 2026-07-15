/** Lade-Zustand für Tabellen: pulsierende Platzhalter-Zeilen statt „Lädt…"-Text. */
export default function TableSkeleton({ cols, rows = 4 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <tr key={r} className="border-b border-gray-50">
          {Array.from({ length: cols }, (_, c) => (
            <td key={c} className="px-4 py-3.5">
              <div
                className="h-3.5 rounded-full bg-gray-100 animate-pulse"
                style={{ width: `${[70, 45, 85, 55, 60, 40, 50, 65][c % 8]}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
