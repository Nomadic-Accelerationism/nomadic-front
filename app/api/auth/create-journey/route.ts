import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { journey, didToken, publicAddress } = await request.json();


    if (!didToken) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const nomadicApiUrl = process.env.NEXT_PUBLIC_NOMADIC_API_URL + "/create-journey";

    const response = await fetch(nomadicApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${didToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ journey, publicAddress }),
    });

    const data = await response.json();
    console.log("data: ", data);

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to create journey' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}