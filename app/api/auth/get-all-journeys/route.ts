import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { publicAddress, didToken } = await request.json();

    if (!didToken) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }
    

    const nomadicApiUrl = process.env.NEXT_PUBLIC_NOMADIC_API_URL + "/get-all-journeys";
    
    const response = await fetch(nomadicApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${didToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();


    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to get all journeys' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}