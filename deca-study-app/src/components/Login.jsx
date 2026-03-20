import { useState } from 'react'

export default function Login({ onLogin }) {
  const [step, setStep] = useState('name') // 'name' | 'pin' | 'setpin'
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')

  const S = { // styles
    wrap: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100dvh', padding:'32px 24px', background:'#fff' },
    logo: { fontSize:48, marginBottom:8 },
    title: { fontSize:26, fontWeight:700, marginBottom:4, textAlign:'center' },
    sub: { fontSize:15, color:'#666', marginBottom:40, textAlign:'center' },
    label: { fontSize:13, fontWeight:600, color:'#444', marginBottom:6, alignSelf:'flex-start' },
    input: { width:'100%', padding:'14px 16px', fontSize:16, border:'1px solid #d0d0d0', borderRadius:12, outline:'none', marginBottom:16, background:'#f9f9f9' },
    btn: { width:'100%', padding:'15px', fontSize:16, fontWeight:600, background:'#007AFF', color:'#fff', border:'none', borderRadius:12, cursor:'pointer', marginTop:4 },
    error: { color:'#e03131', fontSize:13, marginBottom:12, textAlign:'center' },
  }

  const USERS_KEY = 'deca_users'
  const getUsers = () => { try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}') } catch { return {} } }
  const saveUsers = u => localStorage.setItem(USERS_KEY, JSON.stringify(u))

  function handleName() {
    const n = name.trim()
    if (n.length < 2) { setError('Enter your name (at least 2 characters)'); return }
    setError('')
    const users = getUsers()
    if (users[n.toLowerCase()]) {
      setStep('pin')
    } else {
      setStep('setpin')
    }
  }

  function handleLogin() {
    const users = getUsers()
    const stored = users[name.trim().toLowerCase()]
    if (!stored || stored.pin !== pin) {
      setError('Wrong PIN. Try again.')
      setPin('')
      return
    }
    onLogin({ name: stored.displayName, key: name.trim().toLowerCase() })
  }

  function handleSetPin() {
    if (pin.length < 4) { setError('PIN must be at least 4 digits'); return }
    if (pin !== confirmPin) { setError("PINs don't match"); return }
    const users = getUsers()
    const key = name.trim().toLowerCase()
    users[key] = { displayName: name.trim(), pin }
    saveUsers(users)
    onLogin({ name: name.trim(), key })
  }

  return (
    <div style={S.wrap}>
      <div style={S.logo}>📊</div>
      <div style={S.title}>DECA Finance</div>
      <div style={S.sub}>Study smarter. Score higher.</div>

      {step === 'name' && (
        <div style={{ width:'100%', display:'flex', flexDirection:'column', alignItems:'center' }}>
          <div style={S.label}>Your name</div>
          <input style={S.input} placeholder="e.g. Jamie Smith" value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleName()}
            autoFocus />
          {error && <div style={S.error}>{error}</div>}
          <button style={S.btn} onClick={handleName}>Continue →</button>
        </div>
      )}

      {step === 'pin' && (
        <div style={{ width:'100%', display:'flex', flexDirection:'column', alignItems:'center' }}>
          <div style={{ fontSize:15, color:'#444', marginBottom:24 }}>Welcome back, <strong>{name.trim()}</strong>!</div>
          <div style={S.label}>Enter your PIN</div>
          <input style={S.input} type="password" inputMode="numeric" placeholder="••••"
            value={pin} onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            autoFocus maxLength={8} />
          {error && <div style={S.error}>{error}</div>}
          <button style={S.btn} onClick={handleLogin}>Sign In →</button>
          <button onClick={() => { setStep('name'); setPin(''); setError('') }}
            style={{ marginTop:16, background:'none', border:'none', color:'#007AFF', fontSize:14, cursor:'pointer' }}>
            ← Different person
          </button>
        </div>
      )}

      {step === 'setpin' && (
        <div style={{ width:'100%', display:'flex', flexDirection:'column', alignItems:'center' }}>
          <div style={{ fontSize:15, color:'#444', marginBottom:24 }}>Hi <strong>{name.trim()}</strong>! Create a PIN to get started.</div>
          <div style={S.label}>Create a PIN (4–8 digits)</div>
          <input style={S.input} type="password" inputMode="numeric" placeholder="e.g. 1234"
            value={pin} onChange={e => setPin(e.target.value)} maxLength={8} autoFocus />
          <div style={S.label}>Confirm PIN</div>
          <input style={S.input} type="password" inputMode="numeric" placeholder="Same PIN again"
            value={confirmPin} onChange={e => setConfirmPin(e.target.value)} maxLength={8}
            onKeyDown={e => e.key === 'Enter' && handleSetPin()} />
          {error && <div style={S.error}>{error}</div>}
          <button style={S.btn} onClick={handleSetPin}>Create Account →</button>
        </div>
      )}

      <div style={{ marginTop:32, fontSize:12, color:'#aaa', textAlign:'center' }}>
        Your PIN is stored locally on this device only
      </div>
    </div>
  )
}
