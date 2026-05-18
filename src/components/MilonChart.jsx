import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

export default function MilonChart({ entries }) {
  const milonEntries = entries
    .filter((e) => e.training === 'milon' && (e.milonKrachtScore || e.milonTon))
    .sort((a, b) => a.date.localeCompare(b.date))

  if (milonEntries.length < 2) return null

  const data = milonEntries.map((e) => ({
    date: shortDate(e.date),
    krachtScore: e.milonKrachtScore ?? null,
    ton: e.milonTon ?? null,
  }))

  const hasKracht = data.some((d) => d.krachtScore != null)
  const hasTon = data.some((d) => d.ton != null)

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700 mb-1">Milon progressie</h2>
      <p className="text-xs text-slate-400 mb-1">
        Kracht-score daalt = beter · Tonnage stijgt = sterker
      </p>

      {/* Mini legend */}
      <div className="flex gap-4 mb-4">
        {hasKracht && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded" style={{ backgroundColor: '#FF6B1A' }} />
            <span className="text-xs text-slate-400">Kracht-score (↓ beter)</span>
          </div>
        )}
        {hasTon && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded" style={{ backgroundColor: '#34d399' }} />
            <span className="text-xs text-slate-400">Tonnage</span>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          {/* Left axis: kracht-score, reversed so lower (=better) appears higher */}
          {hasKracht && (
            <YAxis
              yAxisId="left"
              orientation="left"
              reversed
              domain={['auto', 'auto']}
              tick={{ fontSize: 10, fill: '#FF6B1A' }}
              axisLine={false}
              tickLine={false}
            />
          )}
          {/* Right axis: tonnage */}
          {hasTon && (
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={['auto', 'auto']}
              tick={{ fontSize: 10, fill: '#34d399' }}
              axisLine={false}
              tickLine={false}
            />
          )}
          <Tooltip
            contentStyle={{
              background: '#1e293b',
              border: 'none',
              borderRadius: 10,
              color: 'white',
              fontSize: 12,
              padding: '8px 12px',
            }}
            formatter={(v, name) => [
              name === 'krachtScore' ? `${v} (score)` : `${v} ton`,
              name === 'krachtScore' ? 'Kracht-score' : 'Tonnage',
            ]}
          />
          {hasKracht && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="krachtScore"
              stroke="#FF6B1A"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#FF6B1A', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#FF6B1A', strokeWidth: 2, stroke: '#fff' }}
              connectNulls
            />
          )}
          {hasTon && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="ton"
              stroke="#34d399"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#34d399', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#34d399', strokeWidth: 2, stroke: '#fff' }}
              connectNulls
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function shortDate(iso) {
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}
