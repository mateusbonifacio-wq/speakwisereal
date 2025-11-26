import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured. Please set ELEVENLABS_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    // Convert File to Buffer for ElevenLabs API
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create FormData for ElevenLabs API
    const elevenLabsFormData = new FormData();
    const blob = new Blob([buffer], { type: audioFile.type || 'audio/mpeg' });
    elevenLabsFormData.append('file', blob, audioFile.name);
    elevenLabsFormData.append('model_id', 'scribe_v1');
    elevenLabsFormData.append('language_code', 'eng');

    // Call ElevenLabs Speech-to-Text API
    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: elevenLabsFormData,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('ElevenLabs API error:', errorData);
      return NextResponse.json(
        { error: `ElevenLabs API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    // Extract transcription text - simple extraction from ElevenLabs response
    let transcription = '';
    
    // Try common response formats from ElevenLabs
    if (result.text) {
      transcription = result.text;
    } else if (result.transcription) {
      transcription = result.transcription;
    } else if (typeof result === 'string') {
      transcription = result;
    } else if (result.segments && Array.isArray(result.segments)) {
      // Extract from segments array - this is likely the format ElevenLabs uses
      transcription = result.segments
        .filter((seg: any) => seg.text || seg.transcript)
        .map((seg: any) => {
          const text = seg.text || seg.transcript || '';
          // Skip audio event segments - only get actual speech
          if (text.match(/^\([a-z\s]+\)$/i) && !text.match(/^(laughs?|chuckles?|sighs?|applause)$/i)) {
            return '';
          }
          return text;
        })
        .filter((text: string) => text.trim())
        .join(' ');
    }
    
    // Clean up transcription - remove audio event markers but keep speech
    if (transcription) {
      // Remove standalone audio events like "(thunder rumbling)" but keep speech
      transcription = transcription.replace(/\s*\(thunder\s+rumbling\)\s*/gi, ' ');
      transcription = transcription.replace(/\s*\(wind\s+blowing\)\s*/gi, ' ');
      transcription = transcription.replace(/\s*\(birds?\s+chirping\)\s*/gi, ' ');
      transcription = transcription.replace(/\s+/g, ' ').trim();
    }

    // Simple emotion analysis from text only
    const fillerWords = (transcription.match(/\b(uh|um|er|ah|like|you know|so|well)\b/gi) || []).length;
    const repetitions = (transcription.match(/\b(\w+)(?:\s+\1\b)+/gi) || []).length;
    
    const emotionIndicators = {
      fillerWords,
      repetitions,
      questionMarks: (transcription.match(/\?/g) || []).length,
      exclamationMarks: (transcription.match(/!/g) || []).length,
      ellipsis: (transcription.match(/\.{2,}/g) || []).length,
      wordCount: transcription.split(/\s+/).filter(w => w.length > 0).length,
    };

    const emotionalState = {
      nervousness: fillerWords > 3 || repetitions > 1,
      hesitation: emotionIndicators.ellipsis > 1 || emotionIndicators.questionMarks > 0,
      enthusiasm: emotionIndicators.exclamationMarks > 1,
      fillerWordCount: fillerWords,
      repetitionCount: repetitions
    };

    // Always return transcription, even if empty (so frontend knows request completed)
    const responseData = { 
      transcription: transcription || '',
      emotionIndicators,
      emotionalState
    };
    
    console.log('Returning transcription response:', {
      transcriptionLength: transcription.length,
      hasTranscription: !!transcription,
      emotionIndicators
    });
    
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Error transcribing audio:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}

