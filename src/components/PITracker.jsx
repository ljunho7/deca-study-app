import { useState, useEffect } from 'react'
import { getPITracker, savePITracker } from '../lib/storage.js'

const PI_DATA = {
  'Business Law': [
    'Comply with laws and regulations','Discuss nature of law / US sources','Describe US judicial system',
    'Describe IP protection methods','Describe legal issues affecting businesses','Identify basic business torts',
    'Describe legally binding contracts','Describe nature of legal procedure','Discuss debtor-creditor relationships',
    'Explain agency relationships','Discuss environmental law','Discuss role of administrative law',
    'Explain types of business ownership','Explain import/export law','Describe customs regulations',
  ],
  'Communications': [
    'Identify valid written sources','Extract info from written materials','Apply written directions to tasks',
    'Explain communication that supports a speaker','Follow oral directions','Demonstrate active listening',
    'Explain effective verbal communication','Ask relevant questions','Interpret nonverbal cues',
    'Provide legitimate responses to inquiries','Defend ideas objectively','Handle telephone calls professionally',
    'Participate in group discussions','Facilitate group discussions','Make oral presentations',
    'Utilize note-taking strategies','Organize information','Select and use graphic aids',
    'Explain effective written communications','Write professional emails','Write business letters',
    'Write informational messages','Write persuasive messages','Write executive summaries',
    'Prepare simple written reports','Explain digital communications risk','Adapt written correspondence to audience',
    'Use data visualization techniques','Describe social media brand impact','Distinguish social media business vs personal',
    'Explain staff communication','Choose appropriate communication channel','Participate in staff meetings',
  ],
  'Customer Relations': [
    'Explain positive customer relations','Demonstrate customer service mindset','Develop rapport with customers',
    'Reinforce service orientation through communication','Respond to customer inquiries',
    'Adapt communication to cultural differences','Interpret business policies to customers',
    'Build and maintain customer relationships','Handle difficult customers','Handle customer complaints',
    'Identify company brand promise','Determine ways to reinforce company image',
    'Discuss CRM nature','Explain ethics in CRM','Describe technology in CRM',
  ],
  'Economics': [
    'Distinguish economic goods and services','Explain concept of economic resources',
    'Describe economics and economic activities','Determine economic utilities',
    'Explain supply and demand','Describe functions of prices',
    'Explain role of business in society','Describe types of business activities',
    'Describe types of business models','Explain organizational design of businesses',
    'Explain types of economic systems','Explain concept of private enterprise',
    'Identify factors affecting profit','Determine factors affecting business risk',
    'Explain concept of competition','Determine government-business relationship',
    'Describe nature of taxes','Explain concept of productivity',
    'Explain division of labor / specialization','Explain organized labor and business',
    'Explain law of diminishing returns','Discuss consumer spending as indicator',
    'Describe economic impact of inflation','Explain GDP concept',
    'Discuss unemployment rate impact','Explain interest-rate fluctuations',
    'Determine impact of business cycles','Explain nature of global trade',
    'Discuss impact of globalization','Describe exchange rate determinants',
    'Explain cultural considerations in global business','Discuss cultural/social environments on trade',
    'Describe electronic communication impact on global business',
    'Explain impact of major trade alliances','Describe political environment on world trade',
    'Explain impact of geography on world trade','Describe country history impact on world trade',
    'Explain country economic development on world trade','Discuss bribery and foreign payments',
    'Identify international business travel requirements',
  ],
  'Emotional Intelligence': [
    'Describe nature of emotional intelligence','Explain concept of self-esteem',
    'Recognize and overcome biases/stereotypes','Assess personal strengths and weaknesses',
    'Assess personal behavior and values','Identify desirable personality traits',
    'Exhibit self-confidence','Demonstrate interest and enthusiasm','Demonstrate initiative',
    'Demonstrate honesty and integrity','Demonstrate responsible behavior','Demonstrate fairness',
    'Assess risks of personal decisions','Demonstrate ethical work habits',
    'Take responsibility for decisions and actions','Build trust in relationships',
    'Describe nature of ethics','Explain reasons for ethical dilemmas',
    'Recognize and respond to ethical dilemmas','Manage commitments in timely manner',
    'Develop tolerance for ambiguity','Exhibit positive attitude','Demonstrate self-control',
    'Explain use of feedback for personal growth','Adjust to change',
    'Show empathy for others','Maintain confidentiality','Exhibit cultural sensitivity',
    'Leverage personality types in business','Sell ideas to others','Persuade others',
    'Demonstrate negotiation skills','Use conflict-resolution skills','Explain nature of stress management',
    'Use consensus-building skills','Motivate team members','Explain concept of leadership',
    'Model ethical behavior','Determine personal vision','Inspire others','Demonstrate adaptability',
    'Develop achievement orientation','Challenge the status quo','Lead change',
    'Enlist others toward shared vision','Coach others','Recognize/reward others',
    'Foster positive working relationships','Assess long-term value of actions',
    'Explain organizational culture','Interpret and adapt to business culture',
  ],
  'Entrepreneurship': [
    'Describe nature of entrepreneurship','Explain role requirements of entrepreneurs',
    'Describe business ethics in entrepreneurship','Describe small-biz opportunities in intl trade',
  ],
  'Financial Analysis': [
    'Explain forms of financial exchange','Identify types of currency',
    'Describe functions of money','Describe sources of income and compensation',
    'Explain time value of money','Explain purposes and importance of credit',
    'Explain legal responsibilities for consumer financial products',
    'Explain need to save and invest','Set financial goals',
    'Develop personal budget','Determine personal net worth',
    'Explain nature of tax liabilities','Maintain financial records','Balance a bank account',
    'Manage online accounts','Calculate cost of credit','Demonstrate wise use of credit',
    'Validate credit history','Protect against identity theft','Control debt',
    'Prepare personal income tax forms','Discuss college financing options',
    'Discuss nature of retirement planning','Explain nature of estate planning',
    'Describe types of financial-services providers','Explain types of investments',
    'Describe concept of insurance','Determine insurance needs',
    'Describe need for financial information','Explain concept of accounting',
    'Discuss role of ethics in accounting','Explain use of technology in accounting',
    'Explain legal considerations for accounting',
    'Describe nature of cash flow statements','Explain nature of balance sheets',
    'Describe nature of income statements','Explain role of finance in business',
    'Discuss role of ethics in finance','Explain legal considerations for finance',
    'Describe nature of budgets',
  ],
  'Human Resources Management': [
    'Discuss nature of human resources management',
    'Explain role of ethics in HRM','Describe use of technology in HRM',
    'Orient new employees',
  ],
  'Information Management': [
    'Assess information needs','Obtain needed information efficiently',
    'Evaluate quality and source of information','Draw conclusions from information analysis',
    'Apply information to accomplish a task','Store information for future use',
    'Discuss nature of information management','Explain role of ethics in information management',
    'Explain legal issues in information management',
    'Identify ways technology impacts business','Explain role of information systems',
    'Discuss principles of computer systems','Demonstrate basic spreadsheet applications',
    'Demonstrate basic database applications','Demonstrate basic word processing skills',
    'Use integrated software application package','Demonstrate collaborative/groupware applications',
    'Describe nature of business records','Describe current business trends',
    'Monitor internal records for business information','Conduct environmental scan',
  ],
  'Marketing': [
    'Explain marketing importance in global economy','Describe marketing functions and activities',
    'Explain factors influencing buying behavior','Discuss employee actions to achieve results',
    'Demonstrate connections between company actions and results',
  ],
  'Operations': [
    'Explain nature of operations management','Develop and implement policies and procedures',
    'Explain project management','Understand quality management',
    'Manage workplace safety','Manage supply chain and inventory',
  ],
  'Professional Development': [
    'Manage personal career development','Maintain professional image',
    'Develop resume and employment documents','Build professional network',
    'Identify requirements for international business travel',
  ],
  'Risk Management': [
    'Describe concept of risk management','Identify types of business risk',
    'Apply risk management strategies','Use insurance as risk management tool',
    'Understand enterprise risk management (ERM)',
  ],
  'Strategic Management': [
    'Explain nature of strategic management','Conduct SWOT analysis',
    'Develop and implement business strategy','Understand organizational design',
    'Manage positive organizational culture',
  ],
}

export default function PITracker({ user }) {
  const [tracker, setTracker] = useState({}) // { "PI label": { checked: bool, checkedBy: string } }
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState({})
  const [filter, setFilter] = useState('all') // all | incomplete | complete

  useEffect(() => {
    getPITracker().then(data => { setTracker(data || {}); setLoading(false) })
  }, [])

  async function togglePI(label) {
    const current = tracker[label]
    const newVal = current?.checked
      ? null // uncheck = remove
      : { checked: true, checkedBy: user.name, checkedAt: new Date().toISOString() }

    const newTracker = { ...tracker }
    if (newVal) newTracker[label] = newVal
    else delete newTracker[label]

    setTracker(newTracker)
    setSaving(true)
    try { await savePITracker(newTracker) } catch {}
    setSaving(false)
  }

  function toggleChapter(ch) {
    setExpanded(e => ({ ...e, [ch]: !e[ch] }))
  }

  const allPIs = Object.values(PI_DATA).flat()
  const checkedCount = Object.keys(tracker).length
  const totalCount = allPIs.length
  const overallPct = Math.round(checkedCount / totalCount * 100)

  const S = {
    screen: { padding: '0 0 24px', background: '#f5f5f7', minHeight: '100%' },
    header: { background: '#fff', padding: '16px 20px 20px', marginBottom: 16, borderBottom: '0.5px solid #e5e5e5' },
    title: { fontSize: 20, fontWeight: 700 },
    sub: { fontSize: 13, color: '#888', marginTop: 2 },
    overallCard: { background: '#fff', borderRadius: 14, margin: '0 16px 16px', padding: 16 },
    bigPct: { fontSize: 44, fontWeight: 800, color: overallPct >= 75 ? '#34C759' : overallPct >= 50 ? '#FF9500' : '#007AFF' },
    chCard: { background: '#fff', borderRadius: 14, margin: '0 16px 12px', overflow: 'hidden' },
    chHeader: { display: 'flex', alignItems: 'center', padding: '14px 16px', cursor: 'pointer', gap: 10 },
    piRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderTop: '0.5px solid #f5f5f7' },
    check: (checked) => ({
      width: 22, height: 22, borderRadius: '50%', border: checked ? 'none' : '1.5px solid #ccc',
      background: checked ? '#34C759' : 'transparent', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', cursor: 'pointer'
    }),
    piLabel: (checked) => ({ fontSize: 13, color: checked ? '#888' : '#1d1d1f', textDecoration: checked ? 'line-through' : 'none', flex: 1, lineHeight: 1.4 }),
    checkedBy: { fontSize: 11, color: '#aaa', flexShrink: 0 },
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>
      <div style={{ fontSize: 15, color: '#888' }}>Loading team progress…</div>
    </div>
  )

  return (
    <div style={S.screen}>
      <div style={S.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={S.title}>PI Tracker</div>
            <div style={S.sub}>Shared across your team {saving ? '· Saving…' : '· Synced'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: overallPct >= 75 ? '#34C759' : overallPct >= 50 ? '#FF9500' : '#007AFF' }}>{overallPct}%</div>
            <div style={{ fontSize: 11, color: '#888' }}>{checkedCount}/{totalCount}</div>
          </div>
        </div>
        {/* Overall progress bar */}
        <div style={{ height: 6, background: '#e5e5e5', borderRadius: 4, marginTop: 12, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${overallPct}%`, background: overallPct >= 75 ? '#34C759' : overallPct >= 50 ? '#FF9500' : '#007AFF', borderRadius: 4, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px' }}>
        {[['all','All'],['incomplete','Remaining'],['complete','Done']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: filter === val ? 600 : 400,
            background: filter === val ? '#007AFF' : '#fff', color: filter === val ? '#fff' : '#555'
          }}>{label}</button>
        ))}
      </div>

      {Object.entries(PI_DATA).map(([chapter, pis]) => {
        const chChecked = pis.filter(pi => tracker[pi]?.checked).length
        const chPct = Math.round(chChecked / pis.length * 100)
        const isExpanded = expanded[chapter]

        const filtered = pis.filter(pi => {
          if (filter === 'complete') return tracker[pi]?.checked
          if (filter === 'incomplete') return !tracker[pi]?.checked
          return true
        })
        if (filter !== 'all' && filtered.length === 0) return null

        return (
          <div key={chapter} style={S.chCard}>
            <div style={S.chHeader} onClick={() => toggleChapter(chapter)}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{chapter}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
                  <div style={{ flex: 1, height: 4, background: '#e5e5e5', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${chPct}%`, background: chPct >= 75 ? '#34C759' : chPct >= 50 ? '#FF9500' : '#FF3B30', borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 11, color: '#888', flexShrink: 0 }}>{chChecked}/{pis.length}</span>
                </div>
              </div>
              <div style={{ fontSize: 16, color: '#c0c0c0', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>›</div>
            </div>

            {isExpanded && filtered.map(pi => {
              const checked = tracker[pi]?.checked
              const by = tracker[pi]?.checkedBy
              return (
                <div key={pi} style={S.piRow}>
                  <div style={S.check(checked)} onClick={() => togglePI(pi)}>
                    {checked && '✓'}
                  </div>
                  <div style={S.piLabel(checked)}>{pi}</div>
                  {checked && by && <div style={S.checkedBy}>{by.split(' ')[0]}</div>}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
