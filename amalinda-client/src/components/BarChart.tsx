interface Series { label: string; values: number[]; color: string }

interface Props {
  labels: string[]
  series: Series[]
  height?: number
}

export default function BarChart({ labels, series, height = 120 }: Props) {
  const allValues = series.flatMap(s => s.values)
  const max = Math.max(...allValues, 1)

  return (
    <div>
      {/* Bars */}
      <div className="flex items-end gap-1" style={{ height }}>
        {labels.map((label, i) => (
          <div key={label} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full flex items-end gap-0.5" style={{ height: height - 20 }}>
              {series.map(s => (
                <div
                  key={s.label}
                  title={`${s.label}: ${s.values[i]}`}
                  style={{ height: `${Math.round((s.values[i] / max) * 100)}%`, backgroundColor: s.color }}
                  className="flex-1 rounded-t transition-all duration-300 min-h-[2px]"
                />
              ))}
            </div>
            <span className="text-[9px] text-slate-400 truncate w-full text-center leading-tight">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-3 flex-wrap">
        {series.map(s => (
          <div key={s.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-xs text-slate-500">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
