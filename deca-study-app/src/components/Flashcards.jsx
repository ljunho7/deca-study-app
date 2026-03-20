import { useState, useEffect, useCallback } from 'react'

// Simple SM-2 spaced repetition
function nextReview(card, quality) {
  // quality: 0=forgot, 1=hard, 2=easy
  const now = Date.now()
  const reviews = (card.reviews || 0) + 1
  let interval = card.interval || 1 // days
  let ease = card.ease || 2.5

  if (quality === 0) {
    interval = 1
    ease = Math.max(1.3, ease - 0.2)
  } else if (quality === 1) {
    interval = Math.max(1, Math.round(interval * 1.2))
  } else {
    interval = Math.round(interval * ease)
    ease = Math.min(3.0, ease + 0.1)
  }

  return {
    status: quality === 0 ? 'learning' : quality === 1 ? 'learning' : 'known',
    nextReview: now + interval * 24 * 60 * 60 * 1000,
    interval,
    ease,
    reviews,
  }
}

const CHAPTERS = [
  'All chapters',
  'Financial Analysis',
  'Financial-Information Management',
  'Risk Management',
  'Professional Development',
  'Emotional Intelligence',
  'Communications',
  'Economics',
  'Business Law',
  'Information Management',
  'Operations',
  'Customer Relations',
  'Human Resources Management',
  'Marketing & Strategy',
  'PI & 2025 Updates',
]

export default function Flashcards({ user, data }) {
  const [cards, setCards] = useState([])
  const [progress, setProgress] = useState({})
  const [chapter, setChapter] = useState('All chapters')
  const [queue, setQueue] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [mode, setMode] = useState('menu') // 'menu' | 'study' | 'done'
  const [sessionStats, setSessionStats] = useState({ known: 0, learning: 0, total: 0 })

  const PROG_KEY = `deca_progress_${user.key}`

  useEffect(() => {
    if (!data) return
    setCards(data)
    try {
      const stored = JSON.parse(localStorage.getItem(PROG_KEY) || '{}')
      setProgress(stored.flashcards || {})
    } catch {}
  }, [data])

  const saveProgress = useCallback((newProg) => {
    setProgress(newProg)
    try {
      const stored = JSON.parse(localStorage.getItem(PROG_KEY) || '{}')
      stored.flashcards = newProg
      localStorage.setItem(PROG_KEY, JSON.stringify(stored))
    } catch {}
  }, [PROG_KEY])

  function buildQueue(ch) {
    const filtered = ch === 'All chapters' ? cards : cards.filter(c => c.chapter === ch)
    const now = Date.now()
    // Priority: due cards first, then new cards
    const due = filtered.filter(c => {
      const p = progress[c.id]
      return p && p.status !== 'known' && (p.nextReview || 0) <= now
    })
    const newCards = filtered.filter(c => !progress[c.id])
    const combined = [...due, ...newCards].slice(0, 50) // max 50 per session
    // shuffle
    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combined[i], combined[j]] = [combined[j], combined[i]]
    }
    return combined
  }

  function startSession() {
    const q = buildQueue(chapter)
    setQueue(q)
    setCurrentIdx(0)
    setFlipped(false)
    setSessionStats({ known: 0, learning: 0, total: q.length })
    setMode(q.length === 0 ? 'done' : 'study')
  }

  function handleResponse(quality) {
    const card = queue[currentIdx]
    const existing = progress[card.id] || {}
    const updated = nextReview(existing, quality)
    const newProg = { ...progress, [card.id]: updated }
    saveProgress(newProg)

    setSessionStats(s => ({
      ...s,
      known: s.known + (quality === 2 ? 1 : 0),
      learning: s.learning + (quality < 2 ? 1 : 0),
    }))

    if (currentIdx + 1 >= queue.length) {
      setMode('done')
    } else {
      setCurrentIdx(i => i + 1)
      setFlipped(false)
    }
  }

  const totalKnown = Object.values(progress).filter(c => c.status === 'known').length
  const totalCards = chapter === 'All chapters' ? cards.length : cards.filter(c => c.chapter === chapter).length

  const S = {
    screen: { padding: '0 0 16px', background: '#f5f5f7', minHeight: '100%' },
    header: { background: '#fff', padding: '16px 20px', marginBottom: 16, borderBottom: '0.5px solid #e5e5e5' },
    title: { fontSize: 20, fontWeight: 700 },
    sub: { fontSize: 13, color: '#888', marginTop: 2 },
    section: { background: '#fff', borderRadius: 14, margin: '0 16px 16px', padding: 16 },
    select: { width: '100%', padding: '12px 14px', fontSize: 15, border: '1px solid #e0e0e0', borderRadius: 10, background: '#f9f9f9', marginBottom: 16, outline: 'none' },
    btn: (bg='#007AFF') => ({ width: '100%', padding: '15px', fontSize: 16, fontWeight: 600, background: bg, color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', marginTop: 8 }),
    card: { background: '#fff', borderRadius: 16, margin: '0 16px 16px', padding: '32px 20px', minHeight: 220, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', cursor: 'pointer', textAlign: 'center' },
    termLabel: { fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 },
    term: { fontSize: 22, fontWeight: 700, color: '#1d1d1f', marginBottom: 8, lineHeight: 1.3 },
    chapter: { fontSize: 12, color: '#007AFF', fontWeight: 500 },
    definition: { fontSize: 15, color: '#333', lineHeight: 1.6, textAlign: 'left' },
    tapHint: { fontSize: 13, color: '#aaa', marginTop: 16 },
    responseRow: { display: 'flex', gap: 10, margin: '0 16px' },
    respBtn: (bg) => ({ flex: 1, padding: '13px 0', background: bg, color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 600 }),
    progress: { height: 4, background: '#e5e5e5', margin: '0 16px 16px', borderRadius: 4, overflow: 'hidden' },
    progressFill: (pct) => ({ height: '100%', width: `${pct}%`, background: '#007AFF', borderRadius: 4, transition: 'width 0.3s' }),
  }

  if (mode === 'menu') {
    const dueCount = buildQueue(chapter).length
    return (
      <div style={S.screen}>
        <div style={S.header}>
          <div style={S.title}>Flashcards</div>
          <div style={S.sub}>{totalKnown} of {cards.length} terms known overall</div>
        </div>
        <div style={S.section}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 8 }}>SELECT CHAPTER</div>
          <select style={S.select} value={chapter} onChange={e => setChapter(e.target.value)}>
            {CHAPTERS.map(ch => (
              <option key={ch} value={ch}>{ch}</option>
            ))}
          </select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Total', val: totalCards, color: '#1d1d1f' },
              { label: 'Due now', val: dueCount, color: '#FF9500' },
              { label: 'Known', val: Object.values(progress).filter(c => c.status === 'known').length, color: '#34C759' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ background: '#f5f5f7', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color }}>{val}</div>
              </div>
            ))}
          </div>
          <button style={S.btn()} onClick={startSession}>
            {dueCount > 0 ? `Study ${dueCount} due cards →` : 'Study new cards →'}
          </button>
        </div>
        {/* Chapter breakdown */}
        <div style={S.section}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 12 }}>ALL CHAPTERS</div>
          {CHAPTERS.slice(1).map(ch => {
            const total = cards.filter(c => c.chapter === ch).length
            const known = cards.filter(c => c.chapter === ch && progress[c.id]?.status === 'known').length
            const pct = total > 0 ? Math.round(known / total * 100) : 0
            return (
              <div key={ch} style={{ marginBottom: 12, cursor: 'pointer' }} onClick={() => { setChapter(ch); }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13 }}>{ch}</span>
                  <span style={{ fontSize: 12, color: '#888' }}>{known}/{total}</span>
                </div>
                <div style={{ height: 5, background: '#e5e5e5', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: pct > 70 ? '#34C759' : pct > 40 ? '#FF9500' : '#FF3B30', borderRadius: 3 }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (mode === 'done') {
    return (
      <div style={{ ...S.screen, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Session complete!</div>
        <div style={{ fontSize: 15, color: '#666', marginBottom: 32, textAlign: 'center', padding: '0 32px' }}>
          {sessionStats.total === 0
            ? "You're all caught up! Come back tomorrow for more due cards."
            : `You reviewed ${sessionStats.total} cards. ${sessionStats.known} known, ${sessionStats.learning} still learning.`}
        </div>
        <div style={{ width: '100%', padding: '0 32px' }}>
          <button style={S.btn()} onClick={() => setMode('menu')}>← Back to chapters</button>
          {sessionStats.total > 0 && (
            <button style={{ ...S.btn('#34C759'), marginTop: 10 }} onClick={startSession}>Study again</button>
          )}
        </div>
      </div>
    )
  }

  // Study mode
  const card = queue[currentIdx]
  if (!card) return null
  const pct = Math.round(currentIdx / queue.length * 100)

  return (
    <div style={S.screen}>
      <div style={S.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => setMode('menu')} style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: 15, cursor: 'pointer' }}>
            ← Back
          </button>
          <span style={{ fontSize: 13, color: '#888' }}>{currentIdx + 1} / {queue.length}</span>
        </div>
      </div>

      <div style={S.progress}><div style={S.progressFill(pct)} /></div>

      <div style={S.card} onClick={() => setFlipped(f => !f)}>
        {!flipped ? (
          <>
            <div style={S.termLabel}>Term</div>
            <div style={S.term}>{card.term}</div>
            <div style={S.chapter}>{card.chapter}</div>
            {card.type === 'pi' && <div style={{ marginTop: 8, fontSize: 11, background: '#FFF8E1', color: '#7B4800', padding: '3px 10px', borderRadius: 20 }}>★ PI topic</div>}
            {card.type === 'trend' && <div style={{ marginTop: 8, fontSize: 11, background: '#E8F5E9', color: '#1B5E20', padding: '3px 10px', borderRadius: 20 }}>🌐 2025/26 trend</div>}
            <div style={S.tapHint}>Tap to reveal definition</div>
          </>
        ) : (
          <>
            <div style={S.termLabel}>{card.term}</div>
            <div style={S.definition}>{card.definition}</div>
          </>
        )}
      </div>

      {flipped && (
        <div style={S.responseRow}>
          <button style={S.respBtn('#FF3B30')} onClick={() => handleResponse(0)}>Forgot</button>
          <button style={S.respBtn('#FF9500')} onClick={() => handleResponse(1)}>Hard</button>
          <button style={S.respBtn('#34C759')} onClick={() => handleResponse(2)}>Got it ✓</button>
        </div>
      )}
    </div>
  )
}
