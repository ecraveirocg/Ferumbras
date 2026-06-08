import { NextResponse } from 'next/server'

// In-memory cache
let cache: string[] | null = null
let cacheTime = 0
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

async function fetchAllSpots(): Promise<string[]> {
  const now = Date.now()
  if (cache && now - cacheTime < CACHE_TTL) return cache

  const allSpots: string[] = []
  let continueParam: string | undefined

  try {
    for (let page = 0; page < 10; page++) {
      const url = new URL('https://tibia.wiki.gg/api.php')
      url.searchParams.set('action', 'query')
      url.searchParams.set('list', 'categorymembers')
      url.searchParams.set('cmtitle', 'Category:Hunting_Places')
      url.searchParams.set('cmlimit', '500')
      url.searchParams.set('cmnamespace', '0')
      url.searchParams.set('format', 'json')
      url.searchParams.set('origin', '*')
      if (continueParam) url.searchParams.set('cmcontinue', continueParam)

      const res = await fetch(url.toString(), {
        headers: { 'User-Agent': 'FerumbrasHuntTracker/1.0' },
        signal: AbortSignal.timeout(8000),
      })

      if (!res.ok) break

      const data = await res.json()
      const members: { title: string }[] = data?.query?.categorymembers ?? []
      allSpots.push(...members.map((m) => m.title))

      if (!data?.continue?.cmcontinue) break
      continueParam = data.continue.cmcontinue
    }
  } catch {
    // Return cached or empty on network error
    return cache ?? []
  }

  if (allSpots.length > 0) {
    cache = allSpots.sort((a, b) => a.localeCompare(b))
    cacheTime = now
  }

  return cache ?? allSpots
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.toLowerCase().trim() ?? ''
    const limit = parseInt(searchParams.get('limit') ?? '25', 10)

    const spots = await fetchAllSpots()

    const filtered = q.length >= 1
      ? spots.filter((s) => s.toLowerCase().includes(q)).slice(0, limit)
      : spots.slice(0, limit)

    return NextResponse.json(filtered, {
      headers: { 'Cache-Control': 'public, s-maxage=3600' },
    })
  } catch {
    return NextResponse.json([])
  }
}
