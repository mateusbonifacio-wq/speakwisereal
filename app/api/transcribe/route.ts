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
    // Based on the Python example, ElevenLabs expects a file upload
    const elevenLabsFormData = new FormData();
    const blob = new Blob([buffer], { type: audioFile.type || 'audio/mpeg' });
    elevenLabsFormData.append('file', blob, audioFile.name);

    // Add optional parameters - use only what's needed for transcription
    elevenLabsFormData.append('model_id', 'scribe_v1');
    // Removed problematic parameters that may interfere with transcription
    // Keep it simple - just get the text

    // Call ElevenLabs Speech-to-Text API
    // Note: The endpoint might be different, check ElevenLabs docs
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
    
    // Log full response to debug what ElevenLabs is actually returning
    console.log('ElevenLabs full response:', JSON.stringify(result, null, 2));
    console.log('Response keys:', Object.keys(result));
    if (result.segments) {
      console.log('Segments sample:', JSON.stringify(result.segments.slice(0, 3), null, 2));
    }
    
    // Extract transcription text from response - try all possible formats
    let transcription = '';
    
    // Try direct text fields first
    if (typeof result === 'string') {
      transcription = result;
    } else if (result.text && typeof result.text === 'string') {
      transcription = result.text;
    } else if (result.transcription && typeof result.transcription === 'string') {
      transcription = result.transcription;
    } 
    // Try segments array
    else if (result.segments && Array.isArray(result.segments) && result.segments.length > 0) {
      // Extract text from each segment
      const segmentTexts = result.segments
        .map((seg: any) => {
          // Try all possible text fields in segment
          return seg.text || seg.transcript || seg.word || seg.content || '';
        })
        .filter((text: string) => text && text.trim().length > 0);
      
      transcription = segmentTexts.join(' ').trim();
    }
    // Try words array if exists
    else if (result.words && Array.isArray(result.words)) {
      transcription = result.words
        .map((w: any) => w.word || w.text || w.content || '')
        .filter((w: string) => w && w.trim())
        .join(' ')
        .trim();
    }
    // Last resort - stringify
    else {
      console.warn('Could not find transcription in expected format. Full result:', JSON.stringify(result).substring(0, 500));
      transcription = '';
    }
    
    console.log('Extracted transcription length:', transcription.length);
    console.log('Transcription preview:', transcription.substring(0, 200));

    // Extract emotional and audio metadata
    const audioAnalysis = {
      // Audio events (laughter, applause, etc.)
      audioEvents: result.audio_events || result.events || [],
      
      // Speaker diarization (if multiple speakers)
      speakers: result.speakers || result.diarization || [],
      
      // Speech patterns (pauses, pace indicators)
      speechPatterns: {
        pauses: result.pauses || [],
        pace: result.pace || result.speaking_rate || null,
        volume: result.volume || result.energy || null,
      },
      
      // Segments with timing (to analyze pace and pauses)
      segments: result.segments || [],
      
      // Original metadata
      metadata: result.metadata || {}
    };

    // Analyze transcription patterns for emotions
    const emotionIndicators = {
      fillerWords: (transcription.match(/\b(uh|um|er|ah|like|you know|so|well)\b/gi) || []).length,
      repetitions: (transcription.match(/\b(\w+)(?:\s+\1\b)+/gi) || []).length,
      questionMarks: (transcription.match(/\?/g) || []).length,
      exclamationMarks: (transcription.match(/!/g) || []).length,
      ellipsis: (transcription.match(/\.{2,}/g) || []).length,
      wordCount: transcription.split(/\s+/).filter(w => w.length > 0).length,
      averageWordsPerSentence: transcription.split(/[.!?]+/).filter(s => s.trim().length > 0).length > 0 
        ? transcription.split(/\s+/).filter(w => w.length > 0).length / transcription.split(/[.!?]+/).filter(s => s.trim().length > 0).length 
        : 0
    };

    // Detect emotional state based on patterns
    const emotionalState = {
      nervousness: emotionIndicators.fillerWords > 5 || emotionIndicators.repetitions > 2,
      hesitation: emotionIndicators.ellipsis > 2 || emotionIndicators.questionMarks > emotionIndicators.exclamationMarks,
      enthusiasm: emotionIndicators.exclamationMarks > 2,
      rushed: emotionIndicators.averageWordsPerSentence > 25,
      confidence: emotionIndicators.fillerWords < 2 && emotionIndicators.repetitions === 0 && emotionIndicators.questionMarks === 0,
      fillerWordCount: emotionIndicators.fillerWords,
      repetitionCount: emotionIndicators.repetitions
    };

    return NextResponse.json({ 
      transcription,
      audioAnalysis,
      emotionIndicators,
      emotionalState,
      metadata: result.metadata || {}
    });
  } catch (error: any) {
    console.error('Error transcribing audio:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
