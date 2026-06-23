import { Info } from 'lucide-react'

const GUIDELINES = [
  'Requests require 48h notice.',
  'Max 10 consecutive days.',
  'Manager approval needed for >3 days.',
]

export function PolicyGuidelines() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Info className="h-4 w-4 text-gray-400" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
          Policy Guidelines
        </p>
      </div>
      <ul className="space-y-2">
        {GUIDELINES.map((rule) => (
          <li key={rule} className="text-sm text-gray-600">
            • {rule}
          </li>
        ))}
      </ul>
    </div>
  )
}
