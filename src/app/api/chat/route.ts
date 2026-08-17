import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.MISTRAL_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { 
          error: "Mistral AI API Key is missing. Please configure MISTRAL_API_KEY in your .env or .env.local file." 
        }, 
        { status: 400 }
      );
    }

    const { messages, response_format, model } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid payload: messages array is required." },
        { status: 400 }
      );
    }

    // Call Mistral AI API
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'mistral-small-latest', // Use mistral-small-latest for fast, highly accurate instruction following
        messages: messages.map((m: any) => ({
          role: m.role || (m.sender === 'user' ? 'user' : 'assistant'),
          content: m.content || m.text
        })),
        ...(response_format ? { response_format } : {})
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Mistral API error response:", data);
      return NextResponse.json(
        { error: data.message || `Mistral API responded with status ${response.status}` },
        { status: response.status }
      );
    }

    const aiMessage = data.choices?.[0]?.message?.content;
    
    if (!aiMessage) {
      return NextResponse.json(
        { error: "Mistral API returned an empty or invalid completion choice." },
        { status: 500 }
      );
    }

    return NextResponse.json({ content: aiMessage });

  } catch (error: any) {
    console.error("AI Chat Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error communicating with AI core." },
      { status: 500 }
    );
  }
}
