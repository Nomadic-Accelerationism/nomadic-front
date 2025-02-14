import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { publicAddress, didToken } = await request.json();
    // console.log("From get-hacker-journeys route");
    // console.log('didToken: ', didToken);
    // console.log('publicAddress: ', publicAddress);

    if (!didToken) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }
    
    const nomadicApiUrl = process.env.NEXT_PUBLIC_NOMADIC_API_URL + "/get-hacker-journeys";
    
    const response = await fetch(nomadicApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${didToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    // console.log("data: ", data);

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to get hacker journeys' },
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
