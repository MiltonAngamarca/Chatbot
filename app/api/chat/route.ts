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

    const response = await fetch('http://192.168.1.120:8000/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Ensure the 'stream' property is forwarded to the backend
      body: JSON.stringify({ text: body.text, stream: body.stream || false }),
    });

    // If the original request intended to stream, and the backend supports it,
    // we should pipe the stream back to the client.
    // For now, let's assume the backend will correctly set Content-Type for streams.
    const contentType = response.headers.get('content-type');
    console.log('FastAPI response content-type:', contentType);

    if (
      body.stream &&
      contentType &&
      contentType.includes('text/event-stream')
    ) {
      console.log('Proxying stream from FastAPI');
      // Ensure we return a streaming response if the backend provides one
      // and the initial request was for a stream.
      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }

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
