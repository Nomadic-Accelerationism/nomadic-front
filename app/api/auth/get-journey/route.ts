import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { journeyId, didToken, publicAddress } = await request.json()

    if (!didToken) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    console.log('--------------------------------')
    console.log('journeyId', journeyId)
    console.log('didToken', didToken)
    console.log('publicAddress', publicAddress)
    console.log('--------------------------------')

    const nomadicApiUrl = process.env.NEXT_PUBLIC_NOMADIC_API_URL + "/get-journey"
    
    const response = await fetch(nomadicApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${didToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ journeyId, publicAddress })
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to fetch journey' },
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