import { NextResponse } from 'next/server'
import { getNomadicApiUrl, NomadicApiConfigError } from '@/lib/config/nomadic-api';

export async function POST(request: Request) {
  try {
    // Get the authorization header from the incoming request
    //const didToken = request.headers.get('authorization')?.split('Bearer ')[1];

    const { publicAddress, didToken } = await request.json();
    if (!didToken) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    let nomadicApiUrl: string;
    try {
      nomadicApiUrl = getNomadicApiUrl('/get-proof-hacker-list');
    } catch (error) {
      if (error instanceof NomadicApiConfigError) {
        return NextResponse.json(
          { error: 'Nomadic API is not configured', code: 'MISSING_API_CONFIG' },
          { status: 503 }
        );
      }
      throw error;
    }

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
        { error: data.error || 'Failed to get proofs' },
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
