import { put } from '@vercel/blob'

export const config = { runtime: 'edge' }

const BLOB_KEY = 'shared/pi-tracker.json'

async function readTracker() {
  try {
    const listRes = await fetch(
      `https://blob.vercel-storage.com?prefix=${BLOB_KEY}`,
      { headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` } }
    )
    const listData = await listRes.json()
    if (!listData.blobs || listData.blobs.length === 0) return {}
    const dataRes = await fetch(listData.blobs[0].url)
    return dataRes.json()
  } catch {
    return {}
  }
}

export default async function handler(req) {
  if (req.method === 'GET') {
    const tracker = await readTracker()
    return new Response(JSON.stringify(tracker), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (req.method === 'POST') {
    const data = await req.json()
    await put(BLOB_KEY, JSON.stringify(data), {
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
