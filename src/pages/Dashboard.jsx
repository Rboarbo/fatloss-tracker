import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function Dashboard({ entries, settings }) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <p className="text-lg">Nog geen metingen</p>
        <p className="text-sm mt-1">Ga naar Invoer om je eerste meting toe te voegen.</p>
      </div>
    )
  }

  const latest = entries[entries.length - 1]
  const first = entries[0]
  const lost = settings.startWeight
    ? settings.startWeight - latest.weight
    : first.weight - latest.weight
  const toGo =
    settings.goalWeight && latest.weight > settings.goalWeight
      ? latest.weight - settings.goalWeight
      : null

  const chartData = entries.map((e) => ({
    date: e.date.slice(5), // MM-DD
    weight: e.weight,
    calories: e.calories ?? undefined,
  }))

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Huidig gewicht" value={`${latest.weight} ${settings.unit}`} />
        <StatCard
          label="Verloren"
          value={`${lost > 0 ? '-' : '+'}${Math.abs(lost).toFixed(1)} ${settings.unit}`}
          highlight={lost > 0}
        />
        {toGo !== null && (
          <StatCard label="Nog te gaan" value={`${toGo.toFixed(1)} ${settings.unit}`} />
        )}
      </div>

      {/* Weight chart */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="text-sm font-medium text-gray-600 mb-3">Gewichtsverloop</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize: 11 }}
              unit={` ${settings.unit}`}
            />
            <Tooltip formatter={(v) => [`${v} ${settings.unit}`, 'Gewicht']} />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent entries */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <h2 className="text-sm font-medium text-gray-600 px-4 pt-4 pb-2">Recente metingen</h2>
        <ul className="divide-y divide-gray-100">
          {[...entries].reverse().slice(0, 7).map((e) => (
            <li key={e.date} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-gray-500">{formatDate(e.date)}</span>
              <div className="flex gap-4">
                <span className="font-medium">{e.weight} {settings.unit}</span>
                {e.calories && <span className="text-gray-400">{e.calories} kcal</span>}
                {e.waist && <span className="text-gray-400">taille {e.waist} cm</span>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function StatCard({ label, value, highlight }) {
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm text-center">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-lg font-semibold ${highlight ? 'text-green-600' : 'text-gray-800'}`}>
        {value}
      </p>
    </div>
  )
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
  })
}
