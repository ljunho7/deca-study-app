import { useState, useEffect } from 'react'
import Login from './components/Login.jsx'
import Home from './components/Home.jsx'
import Flashcards from './components/Flashcards.jsx'
import Exam from './components/Exam.jsx'
import PITracker from './components/PITracker.jsx'

const TAB_ICONS = {
  home:  { label: 'Home',  icon: '⊞' },
  cards: { label: 'Cards', icon: '◈' },
  exam:  { label: 'Exam',  icon: '✎' },
  pi:    { label: 'PIs',   icon: '☑' },
}

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('deca_user') || 'null') } catch { return null }
  })
  const [tab, setTab] = useState('home')
  const [flashcardsData, setFlashcardsData] = useState(null)
  const [questionsData, setQuestionsData] = useState(null)

  // Preload data files
  useEffect(() => {
    fetch('/flashcards.json').then(r => r.json()).then(setFlashcardsData)
    fetch('/questions.json').then(r => r.json()).then(setQuestionsData)
  }, [])

  if (!user) {
    return <Login onLogin={u => {
      localStorage.setItem('deca_user', JSON.stringify(u))
      setUser(u)
    }} />
  }

  const screens = {
    home:  <Home user={user} onTabChange={setTab} onLogout={() => { localStorage.removeItem('deca_user'); setUser(null) }} />,
    cards: <Flashcards user={user} data={flashcardsData} />,
    exam:  <Exam user={user} data={questionsData} />,
    pi:    <PITracker user={user} />,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {screens[tab]}
      </div>
      <nav style={{
        display: 'flex', borderTop: '0.5px solid #e0e0e0',
        background: '#fff', paddingBottom: 'env(safe-area-inset-bottom)',
        flexShrink: 0
      }}>
        {Object.entries(TAB_ICONS).map(([key, { label, icon }]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, border: 'none', background: 'none', padding: '8px 4px 6px',
            cursor: 'pointer', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 2
          }}>
            <span style={{ fontSize: 20, color: tab === key ? '#007AFF' : '#8e8e93' }}>{icon}</span>
            <span style={{ fontSize: 10, color: tab === key ? '#007AFF' : '#8e8e93', fontWeight: tab === key ? 600 : 400 }}>
              {label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  )
}
