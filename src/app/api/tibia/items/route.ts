import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export interface TibiaItem {
  name:  string
  image: string | null
}

const WIKI_HEADERS = { 'User-Agent': 'Ferumbras-HuntTracker/1.0' }

// Resolve item sprite URLs via File:Name.gif → imageinfo
async function resolveImages(names: string[]): Promise<Record<string, string | null>> {
  const map: Record<string, string | null> = {}
  for (const ext of ['.gif', '.png'] as const) {
    const pending = names.filter(n => !(n in map))
    if (!pending.length) break

    const fileTitles = pending.map(n => `File:${n.replace(/ /g, '_')}${ext}`)
    const url = new URL('https://tibia.fandom.com/api.php')
    url.searchParams.set('action', 'query')
    url.searchParams.set('titles', fileTitles.join('|'))
    url.searchParams.set('prop',   'imageinfo')
    url.searchParams.set('iiprop', 'url')
    url.searchParams.set('format', 'json')

    const res  = await fetch(url.toString(), { headers: WIKI_HEADERS })
    const data = await res.json()

    for (const page of Object.values(data.query?.pages ?? {}) as any[]) {
      if ('missing' in page) continue
      const name = page.title.replace(/^File:/i, '').replace(/_/g, ' ').replace(/\.(gif|png)$/i, '')
      const imgUrl = page.imageinfo?.[0]?.url ?? null
      if (imgUrl) map[name] = imgUrl
    }
  }
  for (const n of names) if (!(n in map)) map[n] = null
  return map
}

async function liveSearch(q: string): Promise<TibiaItem[]> {
  // Step 1: get matching page titles via search
  const searchUrl = new URL('https://tibia.fandom.com/api.php')
  searchUrl.searchParams.set('action',       'query')
  searchUrl.searchParams.set('generator',    'search')
  searchUrl.searchParams.set('gsrsearch',    q)
  searchUrl.searchParams.set('gsrlimit',     '15')
  searchUrl.searchParams.set('gsrnamespace', '0')
  searchUrl.searchParams.set('format',       'json')

  const res = await fetch(searchUrl.toString(), {
    headers: WIKI_HEADERS,
    next: { revalidate: 600 },
  })
  if (!res.ok) return []

  const data  = await res.json()
  const pages = Object.values(data?.query?.pages ?? {}) as any[]
  const names = pages
    .filter((p: any) =>
      !p.title.toLowerCase().includes('(disambiguation)') &&
      !p.title.toLowerCase().startsWith('list of') &&
      !p.title.toLowerCase().startsWith('category:')
    )
    .sort((a: any, b: any) => (a.index ?? 99) - (b.index ?? 99))
    .map((p: any) => p.title as string)

  if (!names.length) return []

  // Step 2: resolve sprites via File: API
  const imageMap = await resolveImages(names)

  return names.map(name => ({ name, image: imageMap[name] ?? null }))
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') ?? '').trim()

  // ── Exact lookup by names list (for loading slot images on mount) ──────────
  const namesParam = searchParams.get('names')
  if (namesParam) {
    const names = namesParam.split('|').map(n => n.trim()).filter(Boolean).slice(0, 30)
    if (!names.length) return NextResponse.json([])

    const rows = await prisma.tibiaItemCache.findMany({
      where:  { name: { in: names } },
      select: { name: true, image: true },
    })

    // For any names not in DB, fetch from TibiaWiki and cache them
    const found  = new Set(rows.map(r => r.name))
    const missing = names.filter(n => !found.has(n))
    if (missing.length) {
      const imageMap = await resolveImages(missing).catch(() => ({} as Record<string, string | null>))
      const newRows: TibiaItem[] = missing.map(n => ({ name: n, image: imageMap[n] ?? null }))
      // Cache silently
      prisma.$transaction(
        newRows.map(item => prisma.tibiaItemCache.upsert({
          where:  { name: item.name },
          update: { image: item.image },
          create: { name: item.name, image: item.image },
        }))
      ).catch(() => {})
      return NextResponse.json([...rows, ...newRows] as TibiaItem[])
    }

    return NextResponse.json(rows as TibiaItem[])
  }

  if (!q || q.length < 2) return NextResponse.json([])

  // ── 1. Try local DB ────────────────────────────────────────────────────────
  const dbCount = await prisma.tibiaItemCache.count()

  if (dbCount > 0) {
    const rows = await prisma.tibiaItemCache.findMany({
      where:   { name: { contains: q } },
      orderBy: { name: 'asc' },
      take:    15,
      select:  { name: true, image: true },
    })

    // ── 2. If DB had no match → live fallback (item may be missing from sync) ─
    if (rows.length === 0) {
      const live = await liveSearch(q).catch(() => [])
      // Silently cache any new items found
      if (live.length > 0) {
        prisma.$transaction(
          live.map(item =>
            prisma.tibiaItemCache.upsert({
              where:  { name: item.name },
              update: { image: item.image },
              create: { name: item.name, image: item.image },
            })
          )
        ).catch(() => {})
      }
      return NextResponse.json(live)
    }

    return NextResponse.json(rows as TibiaItem[])
  }

  // ── 3. DB empty — pure live search ────────────────────────────────────────
  try {
    return NextResponse.json(await liveSearch(q))
  } catch {
    return NextResponse.json([])
  }
}
