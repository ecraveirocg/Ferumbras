import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export interface ItemStats {
  // ── Core ──────────────────────────────────────────────────────
  type?:        string
  subtype?:     string
  atk?:         number
  def?:         number
  arm?:         number
  // ── Magic level bonuses ───────────────────────────────────────
  ml?:          number   // general magic level
  iceml?:       number
  fireml?:      number
  earthml?:     number
  energyml?:    number
  healingml?:   number
  holyml?:      number
  deathml?:     number
  // ── Other bonuses ─────────────────────────────────────────────
  speed?:       number
  slots?:       number   // imbuement slots
  // ── Elemental protections (%) ─────────────────────────────────
  physProt?:    number
  fireProt?:    number
  iceProt?:     number
  earthProt?:   number
  energyProt?:  number
  holyProt?:    number
  deathProt?:   number
  // ── Requirements ─────────────────────────────────────────────
  weight?:      number
  lvl?:         number
  voc?:         string
  hands?:       string
  // ── Raw attrib text (fallback display) ───────────────────────
  attrib?:      string
}

const HEADERS = { 'User-Agent': 'Ferumbras-HuntTracker/1.0' }

// ── Wikitext helpers ──────────────────────────────────────────────────────────

/** Extract a single field value from wikitext infobox: | fieldname = VALUE */
function getField(wikitext: string, field: string): string | null {
  // Escape special regex chars in field name
  const esc = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re  = new RegExp(`\\|\\s*${esc}\\s*=\\s*([^|\n}]+)`, 'i')
  const m   = re.exec(wikitext)
  return m ? m[1].trim() : null
}

/** Strip wiki markup and return a clean number */
function toNum(s: string | null | undefined): number | undefined {
  if (!s) return undefined
  const clean = s
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/\{\{[^}]*\}\}/g, '')
    .replace(/[^\d.\-]/g, '')
    .trim()
  const n = parseFloat(clean)
  return isNaN(n) ? undefined : n
}

/** Strip wiki markup and return clean text */
function toStr(s: string | null | undefined): string | undefined {
  if (!s) return undefined
  const clean = s
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/\{\{[^}]*\}\}/g, '')
    .replace(/<[^>]+>/g, '')
    .trim()
  return clean || undefined
}

// ── Attrib text parser ────────────────────────────────────────────────────────
// Handles free-text like: "magic level +5, ice magic level +1, protection physical 4%"

function num(s: string): number { return parseFloat(s) || 0 }

function parseAttribText(raw: string): Partial<ItemStats> {
  const text = raw
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1') // strip links
    .replace(/\{\{[^}]*\}\}/g, '')                     // strip templates
    .replace(/<[^>]+>/g, '')                           // strip HTML
    .toLowerCase()

  const result: Partial<ItemStats> = {}

  // ── Elemental ML (must come BEFORE general "magic level") ─────────────────
  const elML: [RegExp, keyof ItemStats][] = [
    [/ice\s+magic\s+level\s+\+?(\d+)/,     'iceml'     ],
    [/fire\s+magic\s+level\s+\+?(\d+)/,    'fireml'    ],
    [/earth\s+magic\s+level\s+\+?(\d+)/,   'earthml'   ],
    [/energy\s+magic\s+level\s+\+?(\d+)/,  'energyml'  ],
    [/healing\s+magic\s+level\s+\+?(\d+)/, 'healingml' ],
    [/holy\s+magic\s+level\s+\+?(\d+)/,    'holyml'    ],
    [/death\s+magic\s+level\s+\+?(\d+)/,   'deathml'   ],
  ]
  for (const [re, key] of elML) {
    const m = re.exec(text)
    if (m) (result as any)[key] = num(m[1])
  }

  // ── General magic level (not preceded by an element word) ────────────────
  // Strip out all elemental ML occurrences, then search for plain "magic level"
  const stripped = text
    .replace(/(?:ice|fire|earth|energy|healing|holy|death)\s+magic\s+level\s+\+?\d+/g, '')
  const mlM = /(?:^|,\s*)magic\s+level\s+\+?(-?\d+)/.exec(stripped)
  if (mlM) result.ml = num(mlM[1])

  // ── Speed ─────────────────────────────────────────────────────────────────
  const speedM = /speed\s+\+?(-?\d+)/.exec(text)
  if (speedM) result.speed = num(speedM[1])

  // ── Protections ───────────────────────────────────────────────────────────
  const prots: [RegExp, keyof ItemStats][] = [
    [/protection\s+physical[^,\d]*(\d+)\s*%/, 'physProt'   ],
    [/protection\s+fire[^,\d]*(\d+)\s*%/,     'fireProt'   ],
    [/protection\s+ice[^,\d]*(\d+)\s*%/,      'iceProt'    ],
    [/protection\s+earth[^,\d]*(\d+)\s*%/,    'earthProt'  ],
    [/protection\s+energy[^,\d]*(\d+)\s*%/,   'energyProt' ],
    [/protection\s+holy[^,\d]*(\d+)\s*%/,     'holyProt'   ],
    [/protection\s+death[^,\d]*(\d+)\s*%/,    'deathProt'  ],
    // Alternative format: "fire +X%"
    [/fire\s+\+?(\d+)\s*%/,     'fireProt'   ],
    [/ice\s+\+?(\d+)\s*%/,      'iceProt'    ],
    [/earth\s+\+?(\d+)\s*%/,    'earthProt'  ],
    [/energy\s+\+?(\d+)\s*%/,   'energyProt' ],
    [/holy\s+\+?(\d+)\s*%/,     'holyProt'   ],
    [/death\s+\+?(\d+)\s*%/,    'deathProt'  ],
    [/physical\s+\+?(\d+)\s*%/, 'physProt'   ],
  ]
  for (const [re, key] of prots) {
    if ((result as any)[key] != null) continue   // already set by earlier pattern
    const m = re.exec(text)
    if (m) (result as any)[key] = num(m[1])
  }

  return result
}

// ── Main wikitext parser ──────────────────────────────────────────────────────

function parseInfobox(wikitext: string): ItemStats {
  const f = (field: string) => getField(wikitext, field)

  // ── Direct fields — handles both {{Infobox Item}} and {{Infobox Object}} ──
  const base: ItemStats = {
    // Type — Infobox Item uses "type", Infobox Object uses "primarytype" / "objectclass"
    type:    toStr(f('primarytype') ?? f('type')    ?? f('objectclass')),
    subtype: toStr(f('secondarytype') ?? f('subtype') ?? f('slot')),

    // Combat stats — Infobox Item uses "atk"/"def"/"arm", Infobox Object uses "attack"/"defense"/"armor"
    atk:     toNum(f('atk')     ?? f('attack')),
    def:     toNum(f('def')     ?? f('defense')),
    arm:     toNum(f('arm')     ?? f('armor')),

    // Bonus stats
    ml:      toNum(f('mlbonus')    ?? f('mlmod')    ?? f('ml')),
    speed:   toNum(f('speedbonus') ?? f('speedmod') ?? f('speed')),

    // Item details
    weight:  toNum(f('weight')),
    lvl:     toNum(f('levelrequired') ?? f('level required') ?? f('level')),

    // Vocation — Infobox Item uses "vocation"/"voc", Infobox Object uses "vocrequired"
    voc:     toStr(f('vocrequired') ?? f('vocation') ?? f('voc')),

    // Hands
    hands:   toStr(f('hands')),

    // Imbuement slots — Infobox Item uses "slots", Infobox Object uses "imbueslots"
    slots:   toNum(f('imbueslots') ?? f('slots') ?? f('imbue_slots')),
  }

  // ── attrib field (Infobox Item + Infobox Object both use "attrib") ──────────
  const attribRaw = f('attrib') ?? f('attribs') ?? f('attributes') ?? f('magicattributes') ?? ''
  if (attribRaw) {
    base.attrib = toStr(attribRaw)
    Object.assign(base, parseAttribText(attribRaw))
  }

  // ── resist field (Infobox Object: "resist = physical +4%, energy +6%") ──────
  // Different from attrib — stores elemental protections as "element +X%"
  const resistRaw = f('resist') ?? f('resistances') ?? ''
  if (resistRaw) {
    const resistStats = parseAttribText(resistRaw)
    // Only copy protection fields from resist (don't overwrite ML/speed from attrib)
    const protKeys: (keyof ItemStats)[] = [
      'physProt','fireProt','iceProt','earthProt','energyProt','holyProt','deathProt',
    ]
    for (const k of protKeys) {
      if (resistStats[k] != null && base[k] == null) (base as any)[k] = resistStats[k]
    }
  }

  // ── Inline fallback: scan wikitext for ML bonus if nothing found above ──────
  if (!base.ml && !attribRaw) {
    const inline = parseAttribText(wikitext.slice(0, 2000))
    if (inline.ml) base.ml = inline.ml
  }

  return base
}

// ── DB fetch/cache ────────────────────────────────────────────────────────────

async function fetchStats(name: string): Promise<ItemStats | null> {
  // 1. Check DB cache
  const row = await prisma.tibiaItemCache.findUnique({
    where:  { name },
    select: { stats: true },
  }).catch(() => null)

  if (row?.stats) {
    try { return JSON.parse(row.stats) as ItemStats } catch { /* ignore */ }
  }

  // 2. Fetch wikitext from TibiaWiki
  const url = new URL('https://tibia.fandom.com/api.php')
  url.searchParams.set('action',  'query')
  url.searchParams.set('titles',  name)
  url.searchParams.set('prop',    'revisions')
  url.searchParams.set('rvprop',  'content')
  url.searchParams.set('rvslots', 'main')
  url.searchParams.set('format',  'json')

  const res = await fetch(url.toString(), { headers: HEADERS })
  if (!res.ok) return null

  const data  = await res.json()
  const pages = Object.values(data.query?.pages ?? {}) as any[]
  if (!pages.length || 'missing' in pages[0]) return null

  const rev     = pages[0].revisions?.[0]
  const content: string =
    rev?.slots?.main?.['*'] ??  // new MW slots format
    rev?.['*']               ??  // legacy format
    ''

  if (!content || !content.includes('Infobox')) return null

  const stats = parseInfobox(content)

  // 3. Persist in DB
  prisma.tibiaItemCache.upsert({
    where:  { name },
    update: { stats: JSON.stringify(stats) },
    create: { name, image: null, stats: JSON.stringify(stats) },
  }).catch(() => {})

  return stats
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const name = (searchParams.get('name') ?? '').trim()
  if (!name) return NextResponse.json(null)

  try {
    return NextResponse.json(await fetchStats(name))
  } catch {
    return NextResponse.json(null)
  }
}

/** Force-refresh stats for a name (skip DB cache) */
export async function POST(req: Request) {
  const { name } = await req.json().catch(() => ({}))
  if (!name) return NextResponse.json(null)

  // Clear cached stats so next GET re-fetches from TibiaWiki
  await prisma.tibiaItemCache.updateMany({
    where:  { name },
    data:   { stats: null },
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
