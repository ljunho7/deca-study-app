import { put, head, getDownloadUrl } from '@vercel/blob'

export const config = { runtime: 'edge' }

export default async function handler(req) {
  const url = new URL(req.url)

  if (req.method === 'GET') {
    const user = url.searchParams.get('user')
    if (!user) return new Response('Missing user', { status: 400 })
    try {
      const key = `progress/${encodeURIComponent(user)}.json`
      const blobUrl = `${process.env.BLOB_READ_WRITE_TOKEN ? '' : ''}` 
      // Try to fetch existing blob
      const listRes = await fetch(
        `https://blob.vercel-storage.com?prefix=progress/${encodeURIComponent(user)}.json`,
        { headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` } }
      )
      const listData = await listRes.json()
      if (!listData.blobs || listData.blobs.length === 0) {
        return new Response(JSON.stringify(getDefaultProgress()), {
          headers: { 'Content-Type': 'application/json' }
        })
      }
      const dataRes = await fetch(listData.blobs[0].url)
      const data = await dataRes.json()
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      })
    } catch {
      return new Response(JSON.stringify(getDefaultProgress()), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }

  if (req.method === 'POST') {
    const { user, data } = await req.json()
    if (!user) return new Response('Missing user', { status: 400 })
    const blob = await put(
      `progress/${encodeURIComponent(user)}.json`,
      JSON.stringify(data),
      { access: 'public', token: process.env.BLOB_READ_WRITE_TOKEN, addRandomSuffix: false }
    )
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response('Method not allowed', { status: 405 })
}

function getDefaultProgress() {
  return {
    flashcards: {},   // { cardId: { status: 'new'|'learning'|'known', nextReview: timestamp, reviews: 0 } }
    exams: [],        // [{ date, score, category, total }]
    totalPoints: 0,
    lastActive: new Date().toISOString()
  }
}
