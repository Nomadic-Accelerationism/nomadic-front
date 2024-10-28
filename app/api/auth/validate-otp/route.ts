import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {

    //console.log("request--->", request);

    const { email, didToken } = await request.json();
    console.log("*** From the API route ***");
    console.log("email--->", email);
    console.log("didToken--->", didToken);

    const nomadicApiUrl = process.env.NEXT_PUBLIC_NOMADIC_API_URL + "/validaOTP";
    //const nomadicApiUrl = "http://localhost:3001/validaOTP";

    console.log("calling nomadic api--->", nomadicApiUrl);

    const response = await fetch(nomadicApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${didToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    console.log("response--->", response);

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
