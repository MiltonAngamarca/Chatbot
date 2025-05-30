// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    console.log(
      'Proxying request to FastAPI:',
      body.text.substring(0, 50) + '...'
    );

    const response = await fetch('http://66.70.178.38:8000/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: body.text }),
    });

    if (!response.ok) {
      console.error('FastAPI error:', response.status, await response.text());
      return NextResponse.json(
        { error: `FastAPI error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Received response from FastAPI');

    return NextResponse.json(data);
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}
