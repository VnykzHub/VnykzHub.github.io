import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabase } from '@/lib/supabase'
import { getResend } from '@/lib/resend'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
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

    const { name, email, message } = parsed.data

    let supabase
    try {
      supabase = getSupabase()
    } catch {
      return NextResponse.json({ error: 'Service not configured.' }, { status: 503 })
    }

    const { error: dbError } = await supabase.from('contacts').insert({
      name,
      email,
      message,
    })

    if (dbError) {
      console.error('Supabase insert error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save message. Please try again.' },
        { status: 500 }
      )
    }

    // Notify via Resend (non-fatal when unconfigured or failing)
    try {
      const resend = getResend()
      await resend.emails.send({
        from: 'vnykzhub.com <noreply@vnykzhub.com>',
        to: 'vinayak.k.mathur@gmail.com',
        subject: `New contact from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      })
    } catch (emailError) {
      console.error('Resend error (non-fatal):', emailError)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
