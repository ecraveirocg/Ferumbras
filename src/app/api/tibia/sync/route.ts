import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const HEADERS  = { 'User-Agent': 'Ferumbras-HuntTracker/1.0' }
const ROOT_CAT = 'Category:Items'

// ── Fetch one page of category members (pages + subcats) ─────────────────────
async function fetchCategoryMembers(
  category: string,
  cmcontinue?: string,
): Promise<{ pages: string[]; subcats: string[]; next?: string }> {
  const url = new URL('https://tibia.fandom.com/api.php')
  url.searchParams.set('action',      'query')
  url.searchParams.set('list',        'categorymembers')
  url.searchParams.set('cmtitle',     category)
  url.searchParams.set('cmlimit',     '500')
  url.searchParams.set('cmtype',      'page|subcat')   // ← include subcategories
  url.searchParams.set('cmnamespace', '0|14')
  url.searchParams.set('format',      'json')
  if (cmcontinue) url.searchParams.set('cmcontinue', cmcontinue)

  const res  = await fetch(url.toString(), { headers: HEADERS })
  const data = await res.json()
  const members: any[] = data.query?.categorymembers ?? []

  return {
    pages:   members.filter(m => m.ns === 0).map(m => m.title as string),
    subcats: members.filter(m => m.ns === 14).map(m => m.title as string),
    next:    data.continue?.cmcontinue,
  }
}

// ── Collect ALL page titles from a category (including subcategories) ─────────
async function collectAllTitles(
  category: string,
  visited: Set<string>,
  onProgress: (msg: string) => void,
): Promise<string[]> {
  if (visited.has(category)) return []
  visited.add(category)

  const allTitles: string[] = []
  let cmcontinue: string | undefined

  do {
    const { pages, subcats, next } = await fetchCategoryMembers(category, cmcontinue)
    allTitles.push(...pages)
    cmcontinue = next

    // Recurse into each subcategory
    for (const sub of subcats) {
      onProgress(`Scanning ${sub}…`)
      const subTitles = await collectAllTitles(sub, visited, onProgress)
      allTitles.push(...subTitles)
      await sleep(80)
    }
  } while (cmcontinue)

  return allTitles
}

// ── Fetch item sprites via File:ItemName.gif → imageinfo ─────────────────────
// This is the correct way to get Tibia item sprites from TibiaWiki.
// Each item has a dedicated file page: File:Item_Name.gif (or .png)
async function fetchImages(titles: string[]): Promise<Record<string, string | null>> {
  const map: Record<string, string | null> = {}

  // Build File: titles — try .gif first, then .png
  // We do two passes so a single API batch covers both extensions
  for (const ext of ['.gif', '.png'] as const) {
    const fileTitles = titles
      .filter(t => map[t] === undefined)          // skip already resolved
      .map(t => `File:${t.replace(/ /g, '_')}${ext}`)

    if (fileTitles.length === 0) break

    const url = new URL('https://tibia.fandom.com/api.php')
    url.searchParams.set('action',  'query')
    url.searchParams.set('titles',  fileTitles.join('|'))
    url.searchParams.set('prop',    'imageinfo')
    url.searchParams.set('iiprop',  'url')
    url.searchParams.set('format',  'json')

    const res  = await fetch(url.toString(), { headers: HEADERS })
    const data = await res.json()

    for (const page of Object.values(data.query?.pages ?? {}) as any[]) {
      // Missing file → page.missing exists
      if ('missing' in page) continue

      // "File:Gnome_Armor.gif" → "Gnome Armor"
      const name = page.title
        .replace(/^File:/i, '')
        .replace(/_/g, ' ')
        .replace(/\.(gif|png)$/i, '')

      const imgUrl = page.imageinfo?.[0]?.url ?? null
      if (imgUrl) map[name] = imgUrl
    }
  }

  // Any title with no file found → null
  for (const t of titles) {
    if (!(t in map)) map[t] = null
  }

  return map
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// ── GET — return current DB count ─────────────────────────────────────────────
export async function GET() {
  const count      = await prisma.tibiaItemCache.count()
  const noImageCnt = await prisma.tibiaItemCache.count({ where: { image: null } })
  const last  = count > 0
    ? await prisma.tibiaItemCache.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } })
    : null
  return NextResponse.json({ count, noImageCount: noImageCnt, lastSync: last?.updatedAt ?? null })
}

// ── POST — stream sync progress (SSE) ────────────────────────────────────────
export async function POST() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function send(payload: object) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))
        } catch { /* controller already closed */ }
      }

      try {
        send({ status: 'start', msg: 'Scanning TibiaWiki categories…' })

        // ── Phase 1: collect all item titles recursively ───────────────────
        const visited = new Set<string>()
        const allTitles = await collectAllTitles(
          ROOT_CAT,
          visited,
          (msg) => send({ status: 'scan', msg }),
        )

        // Deduplicate
        const unique = [...new Set(allTitles)]
        send({ status: 'scan', msg: `Found ${unique.length} unique items. Fetching sprites…` })

        // ── Phase 2: fetch images + upsert in batches of 50 ───────────────
        let saved = 0
        for (let i = 0; i < unique.length; i += 50) {
          const batch    = unique.slice(i, i + 50)
          const imageMap = await fetchImages(batch)

          await prisma.$transaction(
            batch.map(name =>
              prisma.tibiaItemCache.upsert({
                where:  { name },
                update: { image: imageMap[name] ?? null },
                create: { name, image: imageMap[name] ?? null },
              })
            )
          )

          saved += batch.length
          send({ status: 'progress', total: saved, msg: `${saved} / ${unique.length} items saved…` })
          await sleep(120)
        }

        send({ status: 'done', total: saved, msg: `✅ Sync complete! ${saved} items in database.` })
        controller.close()

      } catch (err: any) {
        send({ status: 'error', msg: `Error: ${err.message}` })
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':      'text/event-stream',
      'Cache-Control':     'no-cache',
      'Connection':        'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
