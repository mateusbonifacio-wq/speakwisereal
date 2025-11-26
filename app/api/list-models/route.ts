import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try to list available models
    // Note: The SDK might not have a direct listModels method, so we'll test common models
    const modelsToTest = [
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-pro',
      'gemini-1.0-pro',
      'models/gemini-1.5-pro',
      'models/gemini-pro'
    ];

    const availableModels: string[] = [];

    for (const modelName of modelsToTest) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        // Try a minimal test
        const result = await model.generateContent('Hi');
        await result.response;
        availableModels.push(modelName);
      } catch (err: any) {
        // Model not available, skip
        console.log(`Model ${modelName} not available: ${err.message}`);
      }
    }

    return NextResponse.json({ 
      availableModels,
      recommended: availableModels[0] || 'none'
    });
  } catch (error: any) {
    console.error('Error listing models:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list models' },
      { status: 500 }
    );
  }
}

