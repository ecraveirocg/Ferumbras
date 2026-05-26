import { PrismaClient, Sex, Vocation } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create spots
  const spots = [
    { name: 'Orc Fortress' },
    { name: 'Demon Oak' },
    { name: 'Yalahar' },
    { name: 'Roshamuul Prison' },
    { name: 'Edron Dragon Lair' },
    { name: 'Kazordoon Dwarves' },
    { name: 'Hellgate' },
    { name: 'Pits of Inferno' },
    { name: 'Ferumbras Ascendancy' },
    { name: 'Asura Palace' },
  ]

  for (const spot of spots) {
    await prisma.spot.upsert({
      where: { name: spot.name },
      update: {},
      create: spot,
    })
  }

  console.log(`Created ${spots.length} spots`)

  // Create characters
  const characters = [
    { name: 'Tibianus III', sex: Sex.MALE, level: 350, vocation: Vocation.ELITE_KNIGHT, world: 'Antica' },
    { name: 'Ellysa', sex: Sex.FEMALE, level: 420, vocation: Vocation.ELDER_DRUID, world: 'Antica' },
    { name: 'Bolthor', sex: Sex.MALE, level: 280, vocation: Vocation.ROYAL_PALADIN, world: 'Antica' },
    { name: 'Pyromancer', sex: Sex.MALE, level: 310, vocation: Vocation.MASTER_SORCERER, world: 'Secura' },
  ]

  for (const character of characters) {
    await prisma.character.upsert({
      where: { name: character.name },
      update: {},
      create: character,
    })
  }

  console.log(`Created ${characters.length} characters`)

  // Fetch created data
  const allCharacters = await prisma.character.findMany()
  const allSpots = await prisma.spot.findMany()

  const getCharacter = (name: string) => allCharacters.find(c => c.name === name)!
  const getSpot = (name: string) => allSpots.find(s => s.name === name)!

  // Create hunt sessions
  const now = new Date()
  const sessions = [
    {
      characterId: getCharacter('Tibianus III').id,
      spotId: getSpot('Hellgate').id,
      startedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      duration: 120,
      silverEarned: 850000,
      xpGained: 12500000,
      notes: 'Good hunt, lots of rare drops',
    },
    {
      characterId: getCharacter('Ellysa').id,
      spotId: getSpot('Asura Palace').id,
      startedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      duration: 90,
      silverEarned: 1200000,
      xpGained: 9800000,
      notes: null,
    },
    {
      characterId: getCharacter('Bolthor').id,
      spotId: getSpot('Yalahar').id,
      startedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      duration: 60,
      silverEarned: 450000,
      xpGained: 7200000,
      notes: null,
    },
    {
      characterId: getCharacter('Tibianus III').id,
      spotId: getSpot('Roshamuul Prison').id,
      startedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      duration: 150,
      silverEarned: 1800000,
      xpGained: 22000000,
      notes: 'Amazing session',
    },
    {
      characterId: getCharacter('Pyromancer').id,
      spotId: getSpot('Pits of Inferno').id,
      startedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      duration: 180,
      silverEarned: 2100000,
      xpGained: 28000000,
      notes: null,
    },
    {
      characterId: getCharacter('Ellysa').id,
      spotId: getSpot('Asura Palace').id,
      startedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
      duration: 120,
      silverEarned: 1350000,
      xpGained: 11000000,
      notes: null,
    },
    {
      characterId: getCharacter('Tibianus III').id,
      spotId: getSpot('Ferumbras Ascendancy').id,
      startedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      duration: 240,
      silverEarned: 3200000,
      xpGained: 45000000,
      notes: 'Best hunt ever!',
    },
    {
      characterId: getCharacter('Bolthor').id,
      spotId: getSpot('Orc Fortress').id,
      startedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
      duration: 90,
      silverEarned: 320000,
      xpGained: 5500000,
      notes: null,
    },
    {
      characterId: getCharacter('Pyromancer').id,
      spotId: getSpot('Edron Dragon Lair').id,
      startedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      duration: 120,
      silverEarned: 680000,
      xpGained: 9000000,
      notes: null,
    },
    {
      characterId: getCharacter('Tibianus III').id,
      spotId: getSpot('Hellgate').id,
      startedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      duration: 180,
      silverEarned: 1400000,
      xpGained: 19000000,
      notes: null,
    },
  ]

  for (const session of sessions) {
    await prisma.huntSession.create({ data: session })
  }

  console.log(`Created ${sessions.length} hunt sessions`)
  console.log('Seeding complete!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
