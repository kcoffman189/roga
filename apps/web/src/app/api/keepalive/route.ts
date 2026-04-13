import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`)
    const data = await res.json()
    return NextResponse.json({ status: 'ok', api: data })
  } catch (e) {
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}
