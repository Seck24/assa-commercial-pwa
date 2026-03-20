'use client'
import { useState } from 'react'

const N8N = 'https://automation.preo-ia.info/webhook'

type Screen = 'login' | 'activation'

interface Session {
  token: string
  nom: string
  commercial_uid: string
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('login')
  const [session, setSession] = useState<Session | null>(null)

  if (screen === 'login') {
    return <LoginScreen onSuccess={(s) => { setSession(s); setScreen('activation') }} />
  }
  return <ActivationScreen session={session!} onLogout={() => { setSession(null); setScreen('login') }} />
}

// ─── LOGIN ───────────────────────────────────────────────────────────────────

function LoginScreen({ onSuccess }: { onSuccess: (s: Session) => void }) {
  const [code, setCode] = useState('')
  const [secret, setSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim() || !secret.trim()) { setError('Remplissez tous les champs.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${N8N}/commercial-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code_commercial: code.trim().toUpperCase(), code_secret: secret }),
      })
      const data = await res.json()
      if (!data.success) { setError('Code commercial ou code secret incorrect.'); return }
      onSuccess({ token: data.token, nom: data.nom, commercial_uid: data.commercial_uid })
    } catch {
      setError('Impossible de contacter le serveur.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoCircle}>
            <span style={styles.logoText}>A</span>
          </div>
          <h1 style={styles.appTitle}>ASSA Commercial</h1>
          <p style={styles.appSub}>Espace commercial terrain</p>
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Code commercial</label>
            <input
              style={styles.input}
              type="text"
              placeholder="ex: COM001"
              value={code}
              onChange={e => setCode(e.target.value)}
              autoCapitalize="characters"
              autoComplete="off"
            />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Code secret</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={secret}
              onChange={e => setSecret(e.target.value)}
            />
          </div>

          {error && <p style={styles.errorText}>{error}</p>}

          <button type="submit" disabled={loading} style={{ ...styles.btnPrimary, ...(loading ? styles.btnDisabled : {}) }}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p style={styles.footer}>Préo IA — ASSA v1</p>
      </div>
    </div>
  )
}

// ─── ACTIVATION ──────────────────────────────────────────────────────────────

type ResultCode = 'ACTIVATION_OK' | 'CLIENT_NOT_FOUND' | 'ALREADY_ACTIVE' | 'TOKEN_INVALID' | 'ERROR' | null

function ActivationScreen({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const [telephone, setTelephone] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ResultCode>(null)
  const [resultMsg, setResultMsg] = useState('')
  const [count, setCount] = useState(0)

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault()
    if (!telephone.trim()) return
    setLoading(true)
    setResult(null)
    setResultMsg('')
    try {
      const res = await fetch(`${N8N}/activate-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telephone_client: telephone.trim(), token: session.token }),
      })
      const data = await res.json()
      const code = data.code as ResultCode
      setResult(code)
      setResultMsg(data.message || '')
      if (code === 'ACTIVATION_OK') {
        setCount(c => c + 1)
        setTelephone('')
      }
      if (code === 'TOKEN_INVALID') {
        setTimeout(onLogout, 2000)
      }
    } catch {
      setResult('ERROR')
      setResultMsg('Impossible de contacter le serveur.')
    } finally {
      setLoading(false)
    }
  }

  const resultConfig: Record<NonNullable<ResultCode>, { color: string; icon: string }> = {
    ACTIVATION_OK:   { color: '#22c55e', icon: '✅' },
    CLIENT_NOT_FOUND:{ color: '#f97316', icon: '⚠️' },
    ALREADY_ACTIVE:  { color: '#3b82f6', icon: 'ℹ️' },
    TOKEN_INVALID:   { color: '#ef4444', icon: '🔒' },
    ERROR:           { color: '#ef4444', icon: '❌' },
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header commercial */}
        <div style={styles.header}>
          <div>
            <p style={styles.headerLabel}>Connecté en tant que</p>
            <p style={styles.headerName}>{session.nom}</p>
          </div>
          <button onClick={onLogout} style={styles.btnLogout}>Déco</button>
        </div>

        {/* Compteur */}
        {count > 0 && (
          <div style={styles.counterBadge}>
            🏆 {count} activation{count > 1 ? 's' : ''} aujourd&apos;hui
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleActivate} style={styles.form}>
          <div style={styles.activationBox}>
            <p style={styles.activationLabel}>Numéro du client</p>
            <input
              style={{ ...styles.input, ...styles.inputLarge }}
              type="tel"
              placeholder="07 00 00 00 00"
              value={telephone}
              onChange={e => setTelephone(e.target.value)}
              autoComplete="tel"
              inputMode="tel"
            />
          </div>

          {/* Résultat */}
          {result && (
            <div style={{ ...styles.resultBox, borderColor: resultConfig[result].color }}>
              <span style={{ fontSize: 28 }}>{resultConfig[result].icon}</span>
              <div>
                <p style={{ ...styles.resultCode, color: resultConfig[result].color }}>{result}</p>
                <p style={styles.resultMsg}>{resultMsg}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !telephone.trim()}
            style={{
              ...styles.btnActivate,
              ...(loading || !telephone.trim() ? styles.btnDisabled : {}),
            }}
          >
            {loading ? (
              <span>Activation en cours…</span>
            ) : (
              <span>⚡ Activer ASSA</span>
            )}
          </button>
        </form>

        <p style={styles.footer}>Session valide 8h — Préo IA</p>
      </div>
    </div>
  )
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(160deg, #0a1a6e 0%, #1a3cff22 100%)',
    padding: '16px',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 20,
    padding: '32px 24px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  logoWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    background: '#1a3cff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 32px #1a3cff88',
  },
  logoText: {
    fontSize: 36,
    fontWeight: 900,
    color: '#fff',
  },
  appTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: '#fff',
  },
  appSub: {
    fontSize: 13,
    color: '#9aa3cc',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: '#9aa3cc',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: '13px 16px',
    color: '#fff',
    fontSize: 16,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  inputLarge: {
    fontSize: 22,
    fontWeight: 700,
    textAlign: 'center',
    letterSpacing: '0.05em',
    padding: '16px',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    textAlign: 'center',
  },
  btnPrimary: {
    width: '100%',
    background: '#1a3cff',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '15px',
    fontSize: 16,
    fontWeight: 700,
    transition: 'transform 0.1s, background 0.2s',
    boxShadow: '0 4px 20px #1a3cff55',
  },
  btnActivate: {
    width: '100%',
    background: 'linear-gradient(135deg, #1a3cff, #4060ff)',
    color: '#fff',
    border: 'none',
    borderRadius: 14,
    padding: '18px',
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: '0.02em',
    transition: 'transform 0.1s',
    boxShadow: '0 6px 24px #1a3cff55',
  },
  btnDisabled: {
    opacity: 0.45,
    cursor: 'not-allowed',
  },
  btnLogout: {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: '#9aa3cc',
    borderRadius: 8,
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 600,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(26,60,255,0.2)',
    border: '1px solid rgba(26,60,255,0.4)',
    borderRadius: 12,
    padding: '12px 16px',
  },
  headerLabel: {
    fontSize: 11,
    color: '#9aa3cc',
  },
  headerName: {
    fontSize: 15,
    fontWeight: 700,
    color: '#fff',
  },
  counterBadge: {
    textAlign: 'center',
    background: 'rgba(34,197,94,0.15)',
    border: '1px solid rgba(34,197,94,0.3)',
    borderRadius: 10,
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 600,
    color: '#22c55e',
  },
  activationBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    alignItems: 'center',
  },
  activationLabel: {
    fontSize: 13,
    color: '#9aa3cc',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: 600,
  },
  resultBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
    borderRadius: 12,
    border: '1px solid',
    background: 'rgba(255,255,255,0.04)',
  },
  resultCode: {
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: '0.05em',
  },
  resultMsg: {
    fontSize: 13,
    color: '#9aa3cc',
    marginTop: 2,
  },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#5a6390',
  },
}
