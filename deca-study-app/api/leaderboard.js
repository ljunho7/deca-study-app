import { put } from '@vercel/blob'

export const config = { runtime: 'edge' }

const BLOB_KEY = 'shared/leaderboard.json'

async function readLeaderboard() {
  try {
    const listRes = await fetch(
      `https://blob.vercel-storage.com?prefix=${BLOB_KEY}`,
      { headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` } }
    )
    const listData = await listRes.json()
    if (!listData.blobs || listData.blobs.length === 0) return []
    const dataRes = await fetch(listData.blobs[0].url)
    return dataRes.json()
  } catch {
    return []
  }
}

export default async function handler(req) {
  if (req.method === 'GET') {
    const lb = await readLeaderboard()
    return new Response(JSON.stringify(lb), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (req.method === 'POST') {
    const { user, stats } = await req.json()
    const lb = await readLeaderboard()
    const idx = lb.findIndex(e => e.user === user)
    const entry = { user, ...stats, updatedAt: new Date().toISOString() }
    if (idx >= 0) lb[idx] = entry
    else lb.push(entry)
    lb.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
    await put(BLOB_KEY, JSON.stringify(lb), {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false
    })
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response('Method not allowed', { status: 405 })
}
