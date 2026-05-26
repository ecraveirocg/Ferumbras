# Ferumbras — Tibia Hunt Tracker

A hunting session tracker for Tibia, inspired by Garmoth. Track your silver, XP and time across spots and characters.

![Dashboard Preview](https://via.placeholder.com/800x400/1a1a1a/ffffff?text=Ferumbras+Hunt+Tracker)

## Features

- 🧙 **Character management** — name, sex, level, vocation, world
- 🗺️ **Hunt spots** — manage your favourite grinding locations
- ⏱️ **Session logging** — record duration, silver earned and XP gained
- 📊 **Dashboard** — charts per spot, class or overtime with time filters
- 🕒 **Recent sessions** feed with silver/hour breakdown

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database ORM | Prisma |
| Database | MySQL |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Forms | React Hook Form + Zod |

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/ecraveirocg/ferumbras.git
cd ferumbras
npm install
```

### 2. Configure the database

```bash
cp .env.example .env
# Edit .env and set DATABASE_URL
```

```env
DATABASE_URL="mysql://user:password@localhost:3306/ferumbras"
```

### 3. Push schema & seed

```bash
npm run db:push      # create tables
npm run db:seed      # optional: populate with sample data
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## NPM scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run db:push` | Sync Prisma schema → database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed sample data |

## Vocations

Knight · Elite Knight · Paladin · Royal Paladin · Sorcerer · Master Sorcerer · Druid · Elder Druid

## Database schema

```
Character (id, name, sex, level, vocation, world)
    └── HuntSession (id, characterId, spotId, startedAt, duration, silverEarned, xpGained, notes)
            └── Spot (id, name)
```
