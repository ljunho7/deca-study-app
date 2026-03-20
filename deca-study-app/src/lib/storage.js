// All data goes through /api/* serverless functions
// which have access to the Vercel Blob token server-side

export async function getProgress(username) {
  const res = await fetch(`/api/progress?user=${encodeURIComponent(username)}`)
  if (!res.ok) return null
  return res.json()
}

export async function saveProgress(username, data) {
  await fetch('/api/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: username, data })
  })
}

export async function getLeaderboard() {
  const res = await fetch('/api/leaderboard')
  if (!res.ok) return []
  return res.json()
}

export async function updateLeaderboard(username, stats) {
  await fetch('/api/leaderboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: username, stats })
  })
}

export async function getPITracker() {
  const res = await fetch('/api/pi-tracker')
  if (!res.ok) return {}
  return res.json()
}

export async function savePITracker(data) {
  await fetch('/api/pi-tracker', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
}
