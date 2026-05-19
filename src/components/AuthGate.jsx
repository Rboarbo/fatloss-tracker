import { useState } from 'react'
import { supabase } from '../lib/supabase'
import AppLogo from './AppLogo'

export default function AuthGate() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const missingConfig =
    !import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.VITE_SUPABASE_URL.includes('YOUR_PROJECT')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)

    const redirectTo = window.location.origin + (import.meta.env.BASE_URL ?? '/')

    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    })

    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <AppLogo size={52} />
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-800">Fatloss Tracker</h1>
            <p className="text-slate-400 text-sm mt-1">Elke dag telt</p>
          </div>
        </div>

        {missingConfig && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-xl p-3">
            Supabase niet geconfigureerd. Voeg <code>VITE_SUPABASE_URL</code> en{' '}
            <code>VITE_SUPABASE_ANON_KEY</code> toe aan je <code>.env.local</code>.
          </div>
        )}

        {sent ? (
          <div className="text-center space-y-2">
            <div className="text-3xl">📬</div>
            <p className="font-semibold text-slate-800">Check je inbox</p>
            <p className="text-sm text-slate-400">
              We hebben een magic link gestuurd naar <strong>{email}</strong>.
              Klik op de link om in te loggen.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                E-mailadres
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jouw@email.nl"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-gray-50"
              />
            </div>

            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || missingConfig}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl text-sm font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50"
            >
              {loading ? 'Versturen…' : 'Stuur magic link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
