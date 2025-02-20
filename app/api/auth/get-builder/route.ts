import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { wallet, didToken } = await request.json()

    if (!didToken) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const nomadicApiUrl = process.env.NEXT_PUBLIC_NOMADIC_API_URL + "/builder"
    
    const response = await fetch(`${nomadicApiUrl}?wallet=${wallet}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${didToken}`,
        'Content-Type': 'application/json',
      }
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to fetch builder data' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 