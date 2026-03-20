import { useState, useEffect } from 'react'
import { getLeaderboard } from '../lib/storage.js'

export default function Home({ user, onTabChange, onLogout }) {
  const [leaderboard, setLeaderboard] = useState([])
  const [localStats, setLocalStats] = useState({ known: 0, examAvg: 0, streak: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load local stats from localStorage
    try {
      const prog = JSON.parse(localStorage.getItem(`deca_progress_${user.key}`) || '{}')
      const flashcards = prog.flashcards || {}
      const known = Object.values(flashcards).filter(c => c.status === 'known').length
      const exams = prog.exams || []
      const examAvg = exams.length > 0
        ? Math.round(exams.slice(-5).reduce((s, e) => s + (e.score / e.total * 100), 0) / Math.min(exams.length, 5))
        : 0
      setLocalStats({ known, examAvg, examCount: exams.length })
    } catch {}

    // Load shared leaderboard
    getLeaderboard().then(lb => { setLeaderboard(lb); setLoading(false) })
  }, [user.key])

  const myRank = leaderboard.findIndex(e => e.user === user.name) + 1

  const S = {
    screen: { padding: '0 0 16px', background: '#f5f5f7', minHeight: '100%' },
    header: { background: '#fff', padding: '16px 20px 20px', marginBottom: 16 },
    greeting: { fontSize: 22, fontWeight: 700, marginBottom: 2 },
    sub: { fontSize: 14, color: '#666' },
    section: { background: '#fff', borderRadius: 14, margin: '0 16px 16px', padding: '16px' },
    sectionTitle: { fontSize: 13, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
    statGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 },
    stat: { background: '#f5f5f7', borderRadius: 12, padding: '12px 14px' },
    statLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
    statVal: { fontSize: 22, fontWeight: 700, color: '#1d1d1f' },
    quickBtn: { display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', borderBottom: '0.5px solid #f0f0f0', cursor: 'pointer', background: 'none', border: 'none', width: '100%', textAlign: 'left' },
    dot: (color) => ({ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }),
    btnTitle: { fontSize: 15, fontWeight: 500 },
    btnSub: { fontSize: 12, color: '#888', marginTop: 1 },
    chevron: { marginLeft: 'auto', color: '#c0c0c0', fontSize: 16 },
    lbRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '0.5px solid #f5f5f7' },
    avatar: (color) => ({ width: 32, height: 32, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#fff', flexShrink: 0 }),
  }

  const avatarColors = ['#007AFF','#34C759','#FF9500','#FF3B30','#AF52DE','#00C7BE','#FF2D55','#5856D6']
  const getColor = (name) => avatarColors[name.charCodeAt(0) % avatarColors.length]
  const initials = (name) => name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()

  return (
    <div style={S.screen}>
      <div style={S.header}>
        <div style={S.greeting}>Hey, {user.name.split(' ')[0]} 👋</div>
        <div style={S.sub}>DECA Finance — {new Date().toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric' })}</div>
      </div>

      {/* Personal stats */}
      <div style={S.section}>
        <div style={S.sectionTitle}>Your progress</div>
        <div style={S.statGrid}>
          <div style={S.stat}>
            <div style={S.statLabel}>Cards known</div>
            <div style={S.statVal}>{localStats.known}</div>
          </div>
          <div style={S.stat}>
            <div style={S.statLabel}>Avg exam score</div>
            <div style={S.statVal}>{localStats.examAvg > 0 ? `${localStats.examAvg}%` : '—'}</div>
          </div>
          <div style={S.stat}>
            <div style={S.statLabel}>Exams taken</div>
            <div style={S.statVal}>{localStats.examCount || 0}</div>
          </div>
          <div style={S.stat}>
            <div style={S.statLabel}>Team rank</div>
            <div style={S.statVal}>{myRank > 0 ? `#${myRank}` : '—'}</div>
          </div>
        </div>
      </div>

      {/* Quick access */}
      <div style={S.section}>
        <div style={S.sectionTitle}>Jump in</div>
        {[
          { tab: 'cards', color: '#7F77DD', title: 'Flashcards', sub: '1,050 terms · spaced repetition' },
          { tab: 'exam',  color: '#1D9E75', title: 'Practice exam', sub: '3,200 questions · timed · scored' },
          { tab: 'pi',    color: '#D85A30', title: 'PI tracker', sub: 'Chapter coverage · shared with team' },
        ].map(({ tab, color, title, sub }) => (
          <button key={tab} style={S.quickBtn} onClick={() => onTabChange(tab)}>
            <div style={S.dot(color)} />
            <div>
              <div style={S.btnTitle}>{title}</div>
              <div style={S.btnSub}>{sub}</div>
            </div>
            <div style={S.chevron}>›</div>
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      <div style={S.section}>
        <div style={S.sectionTitle}>Team leaderboard</div>
        {loading && <div style={{ color:'#888', fontSize:14, textAlign:'center', padding:'16px 0' }}>Loading…</div>}
        {!loading && leaderboard.length === 0 && (
          <div style={{ color:'#888', fontSize:14, textAlign:'center', padding:'16px 0' }}>
            No team data yet. Take an exam to appear here!
          </div>
        )}
        {leaderboard.slice(0, 10).map((entry, i) => (
          <div key={entry.user} style={{ ...S.lbRow, background: entry.user === user.name ? '#f0f8ff' : 'transparent', margin:'0 -16px', padding:'10px 16px' }}>
            <div style={{ width:20, fontSize:13, fontWeight:600, color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#888' }}>
              {i + 1}
            </div>
            <div style={S.avatar(getColor(entry.user))}>{initials(entry.user)}</div>
            <div style={{ flex:1, fontSize:14, fontWeight: entry.user === user.name ? 600 : 400 }}>{entry.user}</div>
            <div style={{ fontSize:13, color:'#555', fontWeight:500 }}>{entry.totalPoints || 0} pts</div>
          </div>
        ))}
      </div>

      {/* Logout */}
      <div style={{ textAlign:'center', padding:'8px 0 16px' }}>
        <button onClick={onLogout} style={{ background:'none', border:'none', color:'#888', fontSize:13, cursor:'pointer' }}>
          Sign out
        </button>
      </div>
    </div>
  )
}
