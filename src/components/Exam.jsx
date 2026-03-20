import { useState, useEffect, useRef } from 'react'
import { saveProgress, getProgress, updateLeaderboard } from '../lib/storage.js'

const CATEGORIES = [
  'All categories',
  'Financial Analysis',
  'Financial-Information Management',
  'Professional Development',
  'Emotional Intelligence',
  'Communications',
  'Information Management',
  'Operations',
  'Economics',
  'Business Law',
  'Risk Management',
  'Customer Relations',
  'Marketing',
  'Human Resources Management',
  'Strategic Management',
  'Entrepreneurship',
]

const EXAM_SIZE = 100
const DRILL_SIZE = 20
const TIME_LIMIT = 60 * 60

export default function Exam({ user, data }) {
  const [mode, setMode] = useState('menu')
  const [examType, setExamType] = useState('full')
  const [category, setCategory] = useState('All categories')
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [selected, setSelected] = useState(null)
  const [showExpl, setShowExpl] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [examHistory, setExamHistory] = useState([])
  const [syncStatus, setSyncStatus] = useState('saved')
  const timerRef = useRef(null)
  const answersRef = useRef({}) // keep ref in sync for unload handler

  const PROG_KEY = `deca_progress_${user.key}`

  // Load history on mount
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(PROG_KEY) || '{}')
      setExamHistory(stored.exams || [])
    } catch {}
    // Also sync from server
    getProgress(user.key).then(serverData => {
      if (serverData?.exams) setExamHistory(serverData.exams)
    }).catch(() => {})
  }, [])

  // Keep answersRef in sync with answers state
  useEffect(() => { answersRef.current = answers }, [answers])

  // Save on tab hide / page close during an active exam
  useEffect(() => {
    const flush = () => {
      if (mode !== 'exam') return
      const score = Object.entries(answersRef.current)
        .filter(([i, a]) => questions[parseInt(i)]?.answer === a).length
      persistExamProgress(score, questions.length, true)
    }
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush()
    })
    window.addEventListener('beforeunload', flush)
    return () => {
      window.removeEventListener('beforeunload', flush)
    }
  }, [mode, questions])

  // Timer
  useEffect(() => {
    if (mode === 'exam' && examType === 'full') {
      setTimeLeft(TIME_LIMIT)
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timerRef.current); finishExam(); return 0 }
          return t - 1
        })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [mode])

  // Auto-save every 60 seconds during an active exam
  useEffect(() => {
    if (mode !== 'exam') return
    const interval = setInterval(() => {
      const score = Object.entries(answersRef.current)
        .filter(([i, a]) => questions[parseInt(i)]?.answer === a).length
      persistExamProgress(score, questions.length, false)
    }, 60000)
    return () => clearInterval(interval)
  }, [mode, questions])

  async function persistExamProgress(score, total, isPartial) {
    setSyncStatus('saving')
    try {
      const stored = JSON.parse(localStorage.getItem(PROG_KEY) || '{}')
      const totalPoints = (stored.exams || []).reduce((s, e) => s + e.score, 0)
      stored.totalPoints = totalPoints
      localStorage.setItem(PROG_KEY, JSON.stringify(stored))
      await saveProgress(user.key, stored)
      if (!isPartial) {
        await updateLeaderboard(user.name, { totalPoints, lastExamPct: Math.round(score / total * 100) })
      }
      setSyncStatus('saved')
    } catch {
      setSyncStatus('unsaved')
    }
  }

  function buildExam(type, cat) {
    if (!data) return []
    let pool = cat === 'All categories' ? data : data.filter(q => q.category === cat)
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    const size = type === 'full' ? EXAM_SIZE : DRILL_SIZE
    return shuffled.slice(0, Math.min(size, shuffled.length))
  }

  function startExam() {
    const qs = buildExam(examType, examType === 'full' ? 'All categories' : category)
    setQuestions(qs)
    setCurrent(0)
    setAnswers({})
    answersRef.current = {}
    setSelected(null)
    setShowExpl(false)
    setMode('exam')
  }

  function handleSelect(opt) {
    if (selected) return
    setSelected(opt)
    setShowExpl(true)
    setAnswers(a => ({ ...a, [current]: opt }))
  }

  function nextQuestion() {
    if (current + 1 >= questions.length) {
      finishExam()
    } else {
      setCurrent(c => c + 1)
      setSelected(null)
      setShowExpl(false)
    }
  }

  async function finishExam() {
    clearInterval(timerRef.current)
    const score = Object.entries(answersRef.current)
      .filter(([i, a]) => questions[parseInt(i)]?.answer === a).length
    const total = questions.length
    const result = {
      date: new Date().toISOString(),
      score, total,
      category: examType === 'full' ? 'All categories' : category,
      type: examType,
      pct: Math.round(score / total * 100),
    }

    // Save immediately on exam finish
    setSyncStatus('saving')
    try {
      const stored = JSON.parse(localStorage.getItem(PROG_KEY) || '{}')
      stored.exams = [...(stored.exams || []), result]
      stored.totalPoints = stored.exams.reduce((s, e) => s + e.score, 0)
      localStorage.setItem(PROG_KEY, JSON.stringify(stored))
      setExamHistory(stored.exams)
      await saveProgress(user.key, stored)
      await updateLeaderboard(user.name, { totalPoints: stored.totalPoints, lastExamPct: result.pct })
      setSyncStatus('saved')
    } catch {
      setSyncStatus('unsaved')
    }

    setMode('results')
  }

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const syncDot = syncStatus === 'saved' ? '#34C759' : syncStatus === 'saving' ? '#FF9500' : '#FF3B30'
  const syncLabel = syncStatus === 'saved' ? 'Saved' : syncStatus === 'saving' ? 'Saving…' : 'Pending'

  const S = {
    screen: { padding: '0 0 16px', background: '#f5f5f7', minHeight: '100%' },
    header: { background: '#fff', padding: '16px 20px', marginBottom: 16, borderBottom: '0.5px solid #e5e5e5' },
    title: { fontSize: 20, fontWeight: 700 },
    sub: { fontSize: 13, color: '#888', marginTop: 2 },
    section: { background: '#fff', borderRadius: 14, margin: '0 16px 16px', padding: 16 },
    sLabel: { fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 8 },
    typeRow: { display: 'flex', gap: 10, marginBottom: 16 },
    typeBtn: (active) => ({ flex: 1, padding: '12px', border: active ? '2px solid #007AFF' : '1px solid #e0e0e0', borderRadius: 10, background: active ? '#EBF5FF' : '#f9f9f9', cursor: 'pointer', textAlign: 'center' }),
    typeBtnTitle: (active) => ({ fontSize: 14, fontWeight: 600, color: active ? '#007AFF' : '#333' }),
    typeBtnSub: { fontSize: 11, color: '#888', marginTop: 2 },
    select: { width: '100%', padding: '12px 14px', fontSize: 15, border: '1px solid #e0e0e0', borderRadius: 10, background: '#f9f9f9', marginBottom: 16, outline: 'none' },
    btn: (bg = '#007AFF') => ({ width: '100%', padding: '15px', fontSize: 16, fontWeight: 600, background: bg, color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', marginTop: 8 }),
    qText: { fontSize: 16, lineHeight: 1.6, color: '#1d1d1f', marginBottom: 20 },
    optBtn: (state) => ({
      width: '100%', padding: '13px 16px', marginBottom: 10, textAlign: 'left',
      border: `1.5px solid ${state === 'correct' ? '#34C759' : state === 'wrong' ? '#FF3B30' : state === 'highlight' ? '#007AFF' : '#e0e0e0'}`,
      borderRadius: 12, background: state === 'correct' ? '#F0FFF4' : state === 'wrong' ? '#FFF0F0' : state === 'highlight' ? '#EBF5FF' : '#fff',
      cursor: state ? 'default' : 'pointer', fontSize: 15, color: '#1d1d1f', display: 'flex', alignItems: 'center', gap: 10
    }),
    optLetter: (state) => ({
      width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700, flexShrink: 0,
      background: state === 'correct' ? '#34C759' : state === 'wrong' ? '#FF3B30' : state === 'highlight' ? '#007AFF' : '#f0f0f0',
      color: state ? '#fff' : '#666'
    }),
    expl: { background: '#f5f5f7', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#444', lineHeight: 1.6, marginTop: 12, marginBottom: 12 },
    histRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '0.5px solid #f0f0f0' },
  }

  if (mode === 'menu') {
    const recent = examHistory.slice(-3).reverse()
    return (
      <div style={S.screen}>
        <div style={S.header}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={S.title}>Practice Exam</div>
              <div style={S.sub}>{data ? `${data.length.toLocaleString()} questions available` : 'Loading…'}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#888' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: syncDot }} />
              {syncLabel}
            </div>
          </div>
        </div>
        <div style={S.section}>
          <div style={S.sLabel}>EXAM TYPE</div>
          <div style={S.typeRow}>
            {[
              { key: 'full', title: 'Full exam', sub: '100 questions · 60 min · all categories' },
              { key: 'drill', title: 'Category drill', sub: '20 questions · no timer · pick focus area' },
            ].map(({ key, title, sub }) => (
              <div key={key} style={S.typeBtn(examType === key)} onClick={() => setExamType(key)}>
                <div style={S.typeBtnTitle(examType === key)}>{title}</div>
                <div style={S.typeBtnSub}>{sub}</div>
              </div>
            ))}
          </div>
          {examType === 'drill' && (
            <>
              <div style={S.sLabel}>CATEGORY</div>
              <select style={S.select} value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
              </select>
            </>
          )}
          <button style={S.btn()} onClick={startExam} disabled={!data}>
            {data ? 'Start exam →' : 'Loading questions…'}
          </button>
        </div>
        {recent.length > 0 && (
          <div style={S.section}>
            <div style={S.sLabel}>RECENT EXAMS</div>
            {recent.map((e, i) => (
              <div key={i} style={S.histRow}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14 }}>{e.category} · {e.type === 'full' ? 'Full exam' : 'Drill'}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{new Date(e.date).toLocaleDateString()}</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: e.pct >= 75 ? '#34C759' : e.pct >= 60 ? '#FF9500' : '#FF3B30' }}>
                  {e.pct}%
                </div>
                <div style={{ fontSize: 12, color: '#888' }}>{e.score}/{e.total}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (mode === 'results') {
    const score = Object.entries(answers).filter(([i, a]) => questions[parseInt(i)]?.answer === a).length
    const pct = Math.round(score / questions.length * 100)
    const byCategory = {}
    questions.forEach((q, i) => {
      const cat = q.category
      if (!byCategory[cat]) byCategory[cat] = { correct: 0, total: 0 }
      byCategory[cat].total++
      if (answers[i] === q.answer) byCategory[cat].correct++
    })
    return (
      <div style={S.screen}>
        <div style={{ background: '#fff', padding: '32px 20px 24px', textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>{pct >= 75 ? '🎉' : pct >= 60 ? '📈' : '💪'}</div>
          <div style={{ fontSize: 48, fontWeight: 800, color: pct >= 75 ? '#34C759' : pct >= 60 ? '#FF9500' : '#FF3B30' }}>{pct}%</div>
          <div style={{ fontSize: 16, color: '#666', marginTop: 4 }}>{score} / {questions.length} correct</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, color: '#888', marginTop: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: syncDot }} />
            {syncLabel}
          </div>
        </div>
        <div style={S.section}>
          <div style={S.sLabel}>BREAKDOWN BY CATEGORY</div>
          {Object.entries(byCategory).sort((a, b) => b[1].total - a[1].total).map(([cat, { correct, total }]) => {
            const catPct = Math.round(correct / total * 100)
            return (
              <div key={cat} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13 }}>{cat}</span>
                  <span style={{ fontSize: 12, color: '#888' }}>{correct}/{total}</span>
                </div>
                <div style={{ height: 5, background: '#e5e5e5', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${catPct}%`, background: catPct >= 75 ? '#34C759' : catPct >= 60 ? '#FF9500' : '#FF3B30', borderRadius: 3 }} />
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ padding: '0 16px' }}>
          <button style={S.btn()} onClick={() => setMode('menu')}>← Back to menu</button>
          <button style={{ ...S.btn('#34C759'), marginTop: 10 }} onClick={startExam}>Retake exam</button>
        </div>
      </div>
    )
  }

  // Active exam
  const q = questions[current]
  if (!q) return null
  const opts = ['A', 'B', 'C', 'D']

  return (
    <div style={S.screen}>
      <div style={{ background: '#fff', padding: '12px 16px', borderBottom: '0.5px solid #e5e5e5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: '#888' }}>{current + 1}/{questions.length}</span>
        <span style={{ fontSize: 12, background: '#f0f0f0', padding: '3px 10px', borderRadius: 20, color: '#555' }}>{q.category}</span>
        {examType === 'full'
          ? <span style={{ fontSize: 13, fontWeight: 600, color: timeLeft < 300 ? '#FF3B30' : '#555' }}>⏱ {formatTime(timeLeft)}</span>
          : <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#888' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: syncDot }} />
              {syncLabel}
            </div>
        }
      </div>
      <div style={{ height: 3, background: '#e5e5e5' }}>
        <div style={{ height: '100%', width: `${(current / questions.length) * 100}%`, background: '#007AFF', transition: 'width 0.3s' }} />
      </div>
      <div style={{ padding: '20px 16px 12px' }}>
        <div style={S.qText}>{q.question}</div>
        {opts.map(opt => {
          const val = q[opt]
          if (!val) return null
          let state = null
          if (selected) {
            if (opt === q.answer) state = 'correct'
            else if (opt === selected) state = 'wrong'
          }
          return (
            <button key={opt} style={S.optBtn(state)} onClick={() => handleSelect(opt)}>
              <div style={S.optLetter(state)}>{opt}</div>
              <span>{val}</span>
            </button>
          )
        })}
        {showExpl && q.explanation && (
          <div style={S.expl}>
            <strong>{selected === q.answer ? '✓ Correct. ' : '✗ Incorrect. '}</strong>
            {q.explanation}
          </div>
        )}
        {selected && (
          <button style={S.btn()} onClick={nextQuestion}>
            {current + 1 >= questions.length ? 'See results →' : 'Next question →'}
          </button>
        )}
      </div>
    </div>
  )
}
