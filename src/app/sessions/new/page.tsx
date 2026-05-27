'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SessionForm from '@/components/sessions/SessionForm'
import Link from 'next/link'
import { ArrowLeft, CheckCircle } from 'lucide-react'

export default function NewSessionPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (data: {
    characterId: number
    spotId: number
    startedAt: string
    duration: number
    goldEarned: number
    xpGained: number
    notes: string | null
  }) => {
    setSaving(true)
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => router.push('/sessions'), 1200)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/sessions"
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Log Hunt Session</h1>
          <p className="text-sm text-gray-500 mt-0.5">Record a new hunting session</p>
        </div>
      </div>

      {success ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mb-3" />
          <p className="text-lg font-semibold text-white">Session saved!</p>
          <p className="text-sm text-gray-400 mt-1">Redirecting...</p>
        </div>
      ) : (
        <div className="bg-[#212121] border border-[#2e2e2e] rounded-xl p-6">
          <SessionForm onSubmit={handleSubmit} loading={saving} />
        </div>
      )}
    </div>
  )
}
