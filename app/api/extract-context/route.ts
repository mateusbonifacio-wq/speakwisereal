import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contextTranscript } = body;

    if (!contextTranscript || contextTranscript.trim().length === 0) {
      return NextResponse.json(
        { error: 'Context transcript is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a context extraction assistant. Extract structured information about a pitch context from the following user description.

User description:
${contextTranscript}

Extract the following information if mentioned (return JSON only, no other text):
- audience: who the pitch is for (e.g., "investors", "hiring manager", "customers", "conference audience")
- goal: what the speaker wants to achieve (e.g., "raise funding", "get hired", "book a meeting", "close a sale")
- duration: desired length (e.g., "30 seconds", "1 minute", "3 minutes", "5 minutes", "elevator pitch")
- scenario: type of situation (e.g., "startup investor pitch", "job interview intro", "sales call opener", "conference talk")
- english_level: "beginner", "intermediate", "advanced", or "fluent" (only if mentioned)
- tone_style: "confident", "friendly", "inspiring", "professional", "casual", or "humorous" (only if mentioned)
- constraints: any constraints mentioned (e.g., "no jargon", "non-native audience", "max 1 minute")
- notes_from_user: any additional notes or comments

Return ONLY a valid JSON object with these fields. Use null for fields that are not mentioned. Example:
{
  "audience": "investors",
  "goal": "raise funding",
  "duration": "3 minutes",
  "scenario": "startup investor pitch",
  "english_level": null,
  "tone_style": "confident",
  "constraints": "no technical jargon",
  "notes_from_user": "this is my first attempt"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response (might have markdown code blocks)
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const context = JSON.parse(jsonText);

    return NextResponse.json({ context });
  } catch (error: any) {
    console.error('Error extracting context:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to extract context' },
      { status: 500 }
    );
  }
}

