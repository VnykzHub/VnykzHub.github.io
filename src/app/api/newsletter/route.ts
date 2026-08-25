import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabase } from '@/lib/supabase'

const schema = z.object({
  email: z.string().email('Valid email is required'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email } = parsed.data

    let supabase
    try {
      supabase = getSupabase()
    } catch {
      return NextResponse.json({ error: 'Service not configured.' }, { status: 503 })
    }

    const { error } = await supabase.from('subscribers').insert({ email })

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { message: 'already_subscribed' },
          { status: 200 }
        )
      }
      console.error('Supabase insert error:', error)
      return NextResponse.json(
        { error: 'Failed to subscribe. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
