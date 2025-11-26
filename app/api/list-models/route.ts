import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Try to list models directly from the API
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json({
          error: `Failed to list models: ${response.status} ${response.statusText}`,
          details: errorText,
          suggestion: 'Please verify your API key is valid and has access to Gemini models'
        }, { status: response.status });
      }

      const data = await response.json();
      const models = data.models || [];
      
      // Filter models that support generateContent
      const availableModels = models
        .filter((m: any) => 
          m.supportedGenerationMethods?.includes('generateContent') ||
          m.supportedGenerationMethods?.includes('generateContentStream')
        )
        .map((m: any) => m.name.replace('models/', ''));

      return NextResponse.json({ 
        availableModels,
        allModels: models.map((m: any) => ({
          name: m.name,
          displayName: m.displayName,
          supportedMethods: m.supportedGenerationMethods
        })),
        recommended: availableModels[0] || 'none',
        apiKeyPrefix: apiKey.substring(0, 10) + '...' // Show first 10 chars for debugging
      });
    } catch (fetchError: any) {
      return NextResponse.json({
        error: 'Failed to fetch models from API',
        details: fetchError.message,
        suggestion: 'Check your API key and network connection'
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error listing models:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list models' },
      { status: 500 }
    );
  }
}

